import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type {
  BrainAdapter,
  BrainChunk,
  BrainInput,
  Cost,
  ModelSpec,
} from '../../types/brain.js'
import { getModelSpec, requireSecret } from '../../config/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT = readFileSync(
  resolve(__dirname, '../../prompts/cortex.system.md'),
  'utf8',
)

// Cache read tokens cost 10% of normal; cache write tokens cost 25% extra.
const PRICING: Record<string, {
  inUsdPerM: number
  outUsdPerM: number
  cacheWriteUsdPerM: number
  cacheReadUsdPerM: number
}> = {
  'claude-opus-4-7':         { inUsdPerM: 15,  outUsdPerM: 75,  cacheWriteUsdPerM: 18.75, cacheReadUsdPerM: 1.5  },
  'claude-sonnet-4-6':       { inUsdPerM: 3,   outUsdPerM: 15,  cacheWriteUsdPerM: 3.75,  cacheReadUsdPerM: 0.3  },
  'claude-haiku-4-5-20251001':{ inUsdPerM: 1,  outUsdPerM: 5,   cacheWriteUsdPerM: 1.25,  cacheReadUsdPerM: 0.1  },
}

export class AnthropicCortex implements BrainAdapter {
  readonly id = 'cortex' as const
  readonly modelSpec: ModelSpec
  private client: Anthropic

  constructor(modelId: 'opus' | 'sonnet' | 'haiku') {
    const spec = getModelSpec(modelId)
    this.modelSpec = {
      id: modelId,
      provider: spec.provider,
      model: spec.model,
      envKey: spec.envKey ?? undefined,
      ...(spec.endpoint !== undefined && { endpoint: spec.endpoint }),
      ...(spec.maxTokensDefault !== undefined && { maxTokensDefault: spec.maxTokensDefault }),
      ...(spec.contextWindow !== undefined && { contextWindow: spec.contextWindow }),
      ...(spec.thinkingEnabled !== undefined && { thinkingEnabled: spec.thinkingEnabled }),
      supports: spec.supports as ModelSpec['supports'],
    }
    this.client = new Anthropic({ apiKey: requireSecret('anthropicApiKey') })
  }

  async *invoke(input: BrainInput): AsyncIterable<BrainChunk> {
    const useThinking = this.modelSpec.thinkingEnabled === true && input.enableThinking === true
    const thinkingBudget = input.thinkingBudget ?? 10_000

    // ── System blocks with prompt caching ─────────────────────────────
    // SYSTEM_PROMPT is static per session → mark as cacheable.
    // input.system (retrieved context) is near-static within a turn → also cacheable.
    const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ...(input.system
        ? [{ type: 'text' as const, text: input.system, cache_control: { type: 'ephemeral' } as const }]
        : []),
    ]

    // ── Tool definitions with prompt caching ──────────────────────────
    // Tool descriptions are static per invocation → mark last tool as cacheable
    // to cache the entire tools block up to that point.
    const tools: Anthropic.Messages.Tool[] | undefined = input.tools?.length
      ? input.tools.map((t, i) => {
          const isLast = i === (input.tools!.length - 1)
          return {
            name: t.name,
            description: t.description,
            input_schema: t.inputSchema as Anthropic.Messages.Tool['input_schema'],
            ...(isLast && { cache_control: { type: 'ephemeral' as const } }),
          }
        })
      : undefined

    // ── Betas ─────────────────────────────────────────────────────────
    const betas: string[] = ['prompt-caching-2024-07-31']
    if (useThinking) betas.push('interleaved-thinking-2025-05-14')

    const messages = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }))

    const stream = this.client.beta.messages.stream({
      model: this.modelSpec.model,
      max_tokens: input.maxTokens ?? this.modelSpec.maxTokensDefault ?? 8192,
      system: systemBlocks,
      messages,
      ...(tools !== undefined && { tools }),
      // Extended thinking: temperature MUST be 1 when enabled
      temperature: useThinking ? 1 : (input.temperature ?? undefined),
      ...(useThinking && {
        thinking: { type: 'enabled' as const, budget_tokens: thinkingBudget },
      }),
      betas,
    } as Parameters<typeof this.client.beta.messages.stream>[0])

    if (input.signal) {
      input.signal.addEventListener('abort', () => stream.abort())
    }

    // ── Stream tool_use accumulator ────────────────────────────────────
    let pendingToolCall: { id: string; name: string; jsonBuf: string } | null = null
    let stopReason: BrainChunk & { type: 'done' } = { type: 'done', stopReason: 'end_turn' }

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        const block = event.content_block
        if (block.type === 'tool_use') {
          pendingToolCall = { id: block.id, name: block.name, jsonBuf: '' }
        }
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta
        if (delta.type === 'text_delta') {
          yield { type: 'text', content: delta.text }
        } else if (delta.type === 'thinking_delta') {
          yield { type: 'thinking', content: delta.thinking }
        } else if (delta.type === 'input_json_delta' && pendingToolCall) {
          pendingToolCall.jsonBuf += delta.partial_json
        }
      } else if (event.type === 'content_block_stop') {
        if (pendingToolCall) {
          let args: unknown = {}
          try { args = JSON.parse(pendingToolCall.jsonBuf) } catch { /* leave as empty obj */ }
          yield {
            type: 'tool_call',
            name: pendingToolCall.name,
            args,
            callId: pendingToolCall.id,
          }
          pendingToolCall = null
        }
      } else if (event.type === 'message_delta' && event.delta.stop_reason) {
        const reason = event.delta.stop_reason
        stopReason = {
          type: 'done',
          stopReason:
            reason === 'end_turn'    ? 'end_turn'    :
            reason === 'max_tokens'  ? 'max_tokens'  :
            reason === 'tool_use'    ? 'tool_use'    :
            'end_turn',
        }
      }
    }

    yield stopReason
  }

  estimateCost(input: BrainInput): Cost {
    const pricing = PRICING[this.modelSpec.model]
    const approxIn = input.messages.reduce((s, m) => s + m.content.length / 4, 0)
    const approxOut = input.maxTokens ?? 2048
    if (!pricing) return { estimatedUsd: 0, estimatedTokens: approxIn + approxOut }
    const usd =
      (approxIn / 1_000_000) * pricing.inUsdPerM +
      (approxOut / 1_000_000) * pricing.outUsdPerM
    return { estimatedUsd: usd, estimatedTokens: approxIn + approxOut }
  }
}
