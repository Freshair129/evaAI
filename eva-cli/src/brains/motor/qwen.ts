import { Ollama } from 'ollama'
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
import { getModelSpec } from '../../config/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT = readFileSync(
  resolve(__dirname, '../../prompts/motor.system.md'),
  'utf8',
)

export type MotorModelId = 'qwen-coder-14b' | 'qwen-coder-3b'

export class QwenMotor implements BrainAdapter {
  readonly id = 'motor' as const
  readonly modelSpec: ModelSpec
  private client: Ollama

  constructor(modelId: MotorModelId = 'qwen-coder-14b') {
    const spec = getModelSpec(modelId)
    this.modelSpec = {
      id: modelId,
      provider: spec.provider,
      model: spec.model,
      ...(spec.endpoint !== undefined && { endpoint: spec.endpoint }),
      ...(spec.maxTokensDefault !== undefined && { maxTokensDefault: spec.maxTokensDefault }),
      ...(spec.contextWindow !== undefined && { contextWindow: spec.contextWindow }),
      supports: spec.supports as ModelSpec['supports'],
    }
    this.client = new Ollama({ host: spec.endpoint ?? 'http://localhost:11434' })
  }

  async *invoke(input: BrainInput): AsyncIterable<BrainChunk> {
    const system = [SYSTEM_PROMPT, input.system].filter(Boolean).join('\n\n---\n\n')

    const messages = [
      { role: 'system' as const, content: system },
      ...input.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: m.content,
        })),
    ]

    const abortController = new AbortController()
    if (input.signal) {
      input.signal.addEventListener('abort', () => abortController.abort())
    }

    const stream = await this.client.chat({
      model: this.modelSpec.model,
      messages,
      stream: true,
      options: {
        temperature: input.temperature ?? 0.1,
        num_ctx: this.modelSpec.contextWindow ?? 8192,
      },
    })

    let stopReason: BrainChunk & { type: 'done' } = { type: 'done', stopReason: 'end_turn' }

    for await (const chunk of stream) {
      if (abortController.signal.aborted) {
        stopReason = { type: 'done', stopReason: 'abort' }
        break
      }
      if (chunk.message?.content) {
        yield { type: 'text', content: chunk.message.content }
      }
      if (chunk.done) {
        stopReason = {
          type: 'done',
          stopReason: chunk.done_reason === 'length' ? 'max_tokens' : 'end_turn',
        }
      }
    }

    yield stopReason
  }

  estimateCost(_input: BrainInput): Cost {
    // Local model — no monetary cost
    return { estimatedUsd: 0, estimatedTokens: 0 }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.list()
      return true
    } catch {
      return false
    }
  }
}
