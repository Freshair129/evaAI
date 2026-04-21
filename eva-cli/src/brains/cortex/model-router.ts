import type { BrainAdapter } from '../../types/brain.js'
import type { TaskType } from '../../types/intent.js'
import { loadConfig } from '../../config/index.js'
import { AnthropicCortex } from './opus.js'
import { GeminiCortex } from './gemini.js'

export interface CortexSelectionContext {
  taskType?: TaskType
  estimatedSteps?: number
  contextTokens?: number
  explicitModel?: string
}

type CortexModelId = 'opus' | 'sonnet' | 'haiku' | 'gemini-pro'

export function selectCortexModel(ctx: CortexSelectionContext): CortexModelId {
  if (ctx.explicitModel) return ctx.explicitModel as CortexModelId

  const cfg = loadConfig()

  if (ctx.contextTokens && ctx.contextTokens > 50_000) return 'gemini-pro'
  if (ctx.taskType === 'write_adr') return 'opus'
  if (ctx.estimatedSteps && ctx.estimatedSteps > 5) return 'opus'
  if (ctx.taskType === 'code_review' || ctx.taskType === 'doc_write') return 'sonnet'
  if (ctx.estimatedSteps !== undefined && ctx.estimatedSteps <= 2) return 'haiku'

  // Per-task override from routing.yaml
  if (ctx.taskType) {
    const rule = cfg.routing.tasks[ctx.taskType]
    if (rule?.cortex_model) return rule.cortex_model as CortexModelId
  }

  return (cfg.routing.cortex_selection.default as CortexModelId) ?? 'sonnet'
}

export function createCortex(modelId: CortexModelId): BrainAdapter {
  if (modelId === 'gemini-pro') return new GeminiCortex('gemini-pro')
  return new AnthropicCortex(modelId)
}

export async function invokeCortexWithFallback(
  primary: CortexModelId,
  fn: (adapter: BrainAdapter) => Promise<void> | AsyncIterable<unknown>,
): Promise<BrainAdapter> {
  const cfg = loadConfig()
  const chain: CortexModelId[] = [
    primary,
    ...(cfg.models.fallback_chain.cortex as CortexModelId[]).filter((m) => m !== primary),
  ]

  let lastError: unknown
  for (const id of chain) {
    try {
      const adapter = createCortex(id)
      await fn(adapter)
      return adapter
    } catch (e) {
      lastError = e
    }
  }
  throw lastError ?? new Error('No Cortex model available')
}
