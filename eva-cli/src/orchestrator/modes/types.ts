import type { Intent } from '../../types/intent.js'

export type ExecutionMode = 'single_shot' | 'parallel' | 'debate' | 'pipeline'

export interface AgentResponse {
  answer: string
  confidence: number
  reasoning: string
  caveats?: string[]
  latencyMs: number
  costUsd: number
  agentId: string
  usedKnowledgeIds: string[]
}

export interface ModeResult {
  answer: string
  confidence: number
  mode: ExecutionMode
  agentResponses: AgentResponse[]
  latencyMs: number
  costUsd: number
  metadata?: Record<string, any>
}

export interface ModeExecutor {
  execute(query: string, intent: Intent, options: any): Promise<ModeResult>
}
