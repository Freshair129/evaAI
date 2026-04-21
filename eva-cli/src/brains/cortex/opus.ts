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

const PRICING: Record<string, { inUsdPerM: number; outUsdPerM: number }> = {
  'claude-opus-4-7': { inUsdPerM: 15, outUsdPerM: 75 },
  'claude-sonnet-4-6': { inUsdPerM: 3, outUsdPerM: 15 },
  'claude-haiku-4-5-20251001': { inUsdPerM: 1, outUsdPerM: 5 },
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
    const system = [SYSTEM_PROMPT, input.system].filter(Boolean).join('\n\n---\n\n')

    const stream = await this.client.messages.stream({
      model: this.modelSpec.model,
      max_tokens: input.maxTokens ?? this.modelSpec.maxTokensDefault ?? 8192,
      system,
      messages: input.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ...(input.temperature !== undefined && { temperature: input.temperature }),
    })

    if (input.signal) {
      input.signal.addEventListener('abort', () => stream.abort())
    }

    let stopReason: BrainChunk & { type: 'done' } = { type: 'done', stopReason: 'end_turn' }

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text', content: event.delta.text }
        } else if (event.delta.type === 'thinking_delta') {
          yield { type: 'thinking', content: event.delta.thinking }
        }
      } else if (event.type === 'message_delta' && event.delta.stop_reason) {
        const reason = event.delta.stop_reason
        stopReason = {
          type: 'done',
          stopReason:
            reason === 'end_turn'
              ? 'end_turn'
              : reason === 'max_tokens'
                ? 'max_tokens'
                : reason === 'tool_use'
                  ? 'tool_use'
                  : 'end_turn',
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
    const usd = (approxIn / 1_000_000) * pricing.inUsdPerM + (approxOut / 1_000_000) * pricing.outUsdPerM
    return { estimatedUsd: usd, estimatedTokens: approxIn + approxOut }
  }
}
