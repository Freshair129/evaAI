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
  resolve(__dirname, '../../prompts/limbic.system.md'),
  'utf8',
)

interface TyphoonChoice {
  delta?: { content?: string }
  message?: { content?: string }
  finish_reason?: string | null
}

interface TyphoonChunk {
  choices?: TyphoonChoice[]
}

export class TyphoonLimbic implements BrainAdapter {
  readonly id = 'limbic' as const
  readonly modelSpec: ModelSpec
  private endpoint: string
  private apiKey: string

  constructor() {
    const spec = getModelSpec('typhoon')
    this.modelSpec = {
      id: 'typhoon',
      provider: spec.provider,
      model: spec.model,
      envKey: spec.envKey ?? undefined,
      ...(spec.endpoint !== undefined && { endpoint: spec.endpoint }),
      ...(spec.maxTokensDefault !== undefined && { maxTokensDefault: spec.maxTokensDefault }),
      ...(spec.contextWindow !== undefined && { contextWindow: spec.contextWindow }),
      supports: spec.supports as ModelSpec['supports'],
    }
    this.endpoint = spec.endpoint ?? 'http://thaillm.or.th/api/typhoon/v1/chat/completions'
    this.apiKey = requireSecret('thaillmApiKey')
  }

  async *invoke(input: BrainInput): AsyncIterable<BrainChunk> {
    const system = [SYSTEM_PROMPT, input.system].filter(Boolean).join('\n\n---\n\n')

    const body = {
      model: this.modelSpec.model,
      messages: [
        { role: 'system', content: system },
        ...input.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
      ],
      temperature: input.temperature ?? 0.4,
      max_tokens: input.maxTokens ?? this.modelSpec.maxTokensDefault ?? 2048,
      stream: input.stream ?? true,
    }

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: input.signal ?? null,
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`Typhoon API ${res.status}: ${txt}`)
    }

    if (!body.stream || !res.body) {
      const json = (await res.json()) as TyphoonChunk
      const content = json.choices?.[0]?.message?.content ?? ''
      if (content) yield { type: 'text', content }
      yield { type: 'done', stopReason: 'end_turn' }
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let finish: BrainChunk & { type: 'done' } = { type: 'done', stopReason: 'end_turn' }

    while (true) {
      if (input.signal?.aborted) {
        finish = { type: 'done', stopReason: 'abort' }
        break
      }
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      const lines = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const raw of lines) {
        const line = raw.trim()
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') {
          yield finish
          return
        }
        try {
          const parsed = JSON.parse(payload) as TyphoonChunk
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) yield { type: 'text', content: delta }
          if (parsed.choices?.[0]?.finish_reason === 'length') {
            finish = { type: 'done', stopReason: 'max_tokens' }
          }
        } catch {
          // skip malformed line
        }
      }
    }

    yield finish
  }

  estimateCost(input: BrainInput): Cost {
    // ThaiLLM pricing varies; use placeholder 0 (often free tier or flat quota)
    const approxIn = input.messages.reduce((s, m) => s + m.content.length / 4, 0)
    return { estimatedUsd: 0, estimatedTokens: approxIn + (input.maxTokens ?? 1024) }
  }
}
