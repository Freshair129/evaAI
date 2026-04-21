import type { BrainId } from './brain.js'

export type StepKind = 'tool_call' | 'brain_call' | 'memory_op' | 'user_input'

export interface ToolCallStep {
  id: string
  kind: 'tool_call'
  tool: string
  args: unknown
  critical: boolean
  rationale?: string
}

export type BrainSubtype = 'code_gen' | 'code_edit' | 'review' | 'summarize' | 'stylize_thai'

export interface BrainCallStep {
  id: string
  kind: 'brain_call'
  brain: BrainId
  subtype: BrainSubtype
  prompt: string
  contextIds?: string[]
}

export type MemoryOp = 'search' | 'lookup' | 'recall_episodic' | 'write_episodic' | 'propose_inbound'

export interface MemoryOpStep {
  id: string
  kind: 'memory_op'
  op: MemoryOp
  args: unknown
}

export interface UserInputStep {
  id: string
  kind: 'user_input'
  question: string
  schemaHint?: string
}

export type Step = ToolCallStep | BrainCallStep | MemoryOpStep | UserInputStep

export interface Plan {
  id: string
  goal: string
  reasoning: string
  steps: Step[]
  estimated: {
    durationMs: number
    costUsd: number
    tokens: number
  }
  risky: boolean
  createdBy: BrainId
  createdAt: string
}

export type StepStatus = 'success' | 'fail' | 'denied' | 'error' | 'cancelled'

export interface StepTrace {
  stepId: string
  startedAt: string
  endedAt: string
  status: StepStatus
  input: unknown
  output?: unknown
  error?: string
  unexpected?: boolean
  metrics: {
    latencyMs: number
    tokens?: number
    costUsd?: number
  }
}
