import type { BrainId } from './brain.js'
import type { Intent } from './intent.js'
import type { Plan, StepTrace } from './plan.js'

export type SessionId = `MSP-SESS-${string}`

export type PermissionMode = 'auto' | 'confirm-each' | 'plan-only'

export type SessionStatus = 'active' | 'waiting_user' | 'ended' | 'cancelled'

export interface Message {
  id: string
  sessionId: SessionId
  role: 'user' | 'agent' | 'system' | 'tool'
  content: string
  intent?: Intent
  createdAt: string
  tokens?: number
}

export interface SessionStats {
  tokensIn: number
  tokensOut: number
  costUsd: number
  toolCalls: number
  brainCalls: Record<BrainId, number>
}

export interface Session {
  id: SessionId
  startedAt: string
  endedAt?: string
  userId: string
  agentId: string
  workspace: string

  permissions: PermissionMode
  history: Message[]
  traces: StepTrace[]

  stats: SessionStats
  status: SessionStatus

  currentPlan?: Plan
  currentBrain?: BrainId
}
