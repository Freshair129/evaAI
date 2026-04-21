import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { loadConfig } from '../config/index.js'
import type { ToolResult } from '../types/tool.js'
import type { SessionId } from '../types/session.js'

export interface AuditEntry {
  timestamp: string
  sessionId: string
  tool: string
  argsHash: string
  resultStatus: string
  latencyMs: number
  error?: string
}

function auditPath(): string {
  const cfg = loadConfig()
  return resolve(cfg.paths.brainRoot, 'logs/tools.jsonl')
}

export function hashArgs(args: unknown): string {
  const json = JSON.stringify(args ?? {})
  return createHash('sha256').update(json).digest('hex').slice(0, 16)
}

export function writeAudit(
  sessionId: SessionId | string,
  toolName: string,
  args: unknown,
  result: ToolResult<unknown>,
): void {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    sessionId,
    tool: toolName,
    argsHash: hashArgs(args),
    resultStatus: result.status,
    latencyMs: result.latencyMs,
    ...(result.error !== undefined && { error: result.error }),
  }

  const path = auditPath()
  mkdirSync(dirname(path), { recursive: true })
  appendFileSync(path, JSON.stringify(entry) + '\n')
}
