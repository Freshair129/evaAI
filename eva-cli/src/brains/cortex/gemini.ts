import { GoogleGenerativeAI } from '@google/generative-ai'
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

export class GeminiCortex implements BrainAdapter {
  readonly id = 'cortex' as const
  readonly modelSpec: ModelSpec
  private client: GoogleGenerativeAI

  constructor(modelId: 'gemini-pro' = 'gemini-pro') {
    const spec = getModelSpec(modelId)
    this.modelSpec = {
      id: modelId,
      provider: spec.provider,
      model: spec.model,
      envKey: spec.envKey ?? undefined,
      ...(spec.maxTokensDefault !== undefined && { maxTokensDefault: spec.maxTokensDefault }),
      ...(spec.contextWindow !== undefined && { contextWindow: spec.contextWindow }),
      supports: spec.supports as ModelSpec['supports'],
    }
    this.client = new GoogleGenerativeAI(requireSecret('geminiApiKey'))
  }

  async *invoke(input: BrainInput): AsyncIterable<BrainChunk> {
    const system = [SYSTEM_PROMPT, input.system].filter(Boolean).join('\n\n---\n\n')
    const model = this.client.getGenerativeModel({
      model: this.modelSpec.model,
      systemInstruction: system,
    })

    const contents = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const result = await model.generateContentStream({
      contents,
      generationConfig: {
        maxOutputTokens: input.maxTokens ?? this.modelSpec.maxTokensDefault ?? 8192,
        ...(input.temperature !== undefined && { temperature: input.temperature }),
      },
    })

    for await (const chunk of result.stream) {
      if (input.signal?.aborted) {
        yield { type: 'done', stopReason: 'abort' }
        return
      }
      const text = chunk.text()
      if (text) yield { type: 'text', content: text }
    }

    const final = await result.response
    yield {
      type: 'done',
      stopReason: final.candidates?.[0]?.finishReason === 'MAX_TOKENS' ? 'max_tokens' : 'end_turn',
    }
  }

  estimateCost(input: BrainInput): Cost {
    // Gemini 2.5 Pro: ~$1.25/M in, $5/M out (approx)
    const approxIn = input.messages.reduce((s, m) => s + m.content.length / 4, 0)
    const approxOut = input.maxTokens ?? 2048
    const usd = (approxIn / 1_000_000) * 1.25 + (approxOut / 1_000_000) * 5
    return { estimatedUsd: usd, estimatedTokens: approxIn + approxOut }
  }
}
