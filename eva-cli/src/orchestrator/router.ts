import type { BrainId } from '../types/brain.js'
import type { Intent, TaskType } from '../types/intent.js'
import { loadConfig } from '../config/index.js'

export type MemorySource = 'atomic' | 'vector' | 'obsidian' | 'episodic'

export interface RoutingPlan {
  taskType: TaskType
  primary: BrainId | 'none'
  secondary?: BrainId
  finalize?: BrainId
  delegate?: BrainId
  review?: BrainId
  validator?: BrainId
  cortexModel?: string
  memorySources: MemorySource[]
  maxLatencyMs: number
}

const VALID_SOURCES: Set<string> = new Set(['atomic', 'vector', 'obsidian', 'episodic'])

function isBrainId(v: string): v is BrainId {
  return v === 'cortex' || v === 'motor' || v === 'limbic'
}

export function route(intent: Intent): RoutingPlan {
  const cfg = loadConfig()
  const rule = cfg.routing.tasks[intent.taskType]

  if (!rule) {
    return {
      taskType: intent.taskType,
      primary: 'limbic',
      memorySources: ['atomic'],
      maxLatencyMs: 15000,
    }
  }

  const primary: BrainId | 'none' =
    rule.primary === 'none'
      ? 'none'
      : isBrainId(rule.primary)
        ? rule.primary
        : 'limbic'

  const memorySources = (rule.memory ?? []).filter((s): s is MemorySource => VALID_SOURCES.has(s))

  return {
    taskType: intent.taskType,
    primary,
    ...(rule.secondary && isBrainId(rule.secondary) && { secondary: rule.secondary }),
    ...(rule.finalize && isBrainId(rule.finalize) && { finalize: rule.finalize }),
    ...(rule.delegate && isBrainId(rule.delegate) && { delegate: rule.delegate }),
    ...(rule.review && isBrainId(rule.review) && { review: rule.review }),
    ...(rule.validator && isBrainId(rule.validator) && { validator: rule.validator }),
    ...(rule.cortex_model !== undefined && { cortexModel: rule.cortex_model }),
    memorySources,
    maxLatencyMs: rule.maxLatencyMs,
  }
}

/** Keyword-based fallback router used when intent extraction fails entirely. */
export function fallbackRoute(text: string): RoutingPlan {
  const cfg = loadConfig()
  const fb = cfg.routing.fallback
  for (const rule of fb.keyword_rules) {
    for (const pat of rule.match) {
      try {
        if (new RegExp(pat, 'i').test(text)) {
          return route({
            taskType: rule.task as TaskType,
            urgency: 'normal',
            emotion: 'neutral',
            entities: [],
            rewrittenQuery: text,
            confidence: 0.3,
          })
        }
      } catch {
        // invalid regex — skip
      }
    }
  }
  return route({
    taskType: fb.default_task as TaskType,
    urgency: 'normal',
    emotion: 'neutral',
    entities: [],
    rewrittenQuery: text,
    confidence: 0.2,
  })
}
