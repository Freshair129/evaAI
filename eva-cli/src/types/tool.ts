import type { z } from 'zod'
import type { PermissionMode, SessionId } from './session.js'

export type SideEffect = 'read' | 'write' | 'exec' | 'network'

export type PermissionLevel = 'auto' | 'confirm' | 'forbidden'

export interface ToolContext {
  sessionId: SessionId
  cwd: string
  permissions: PermissionMode
  signal?: AbortSignal
  logger: Logger
}

export interface Logger {
  debug(msg: string, meta?: unknown): void
  info(msg: string, meta?: unknown): void
  warn(msg: string, meta?: unknown): void
  error(msg: string, meta?: unknown): void
}

export type ToolResultStatus = 'success' | 'fail' | 'denied' | 'error'

export interface ToolResult<T = unknown> {
  status: ToolResultStatus
  data?: T
  error?: string
  latencyMs: number
}

export interface Tool<I = unknown, O = unknown> {
  name: string
  description: string
  inputSchema: z.ZodType<I, z.ZodTypeDef, unknown>
  permission: PermissionLevel
  sideEffect: SideEffect
  execute(input: I, ctx: ToolContext): Promise<ToolResult<O>>
}
