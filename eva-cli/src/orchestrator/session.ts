import { existsSync, mkdirSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  Message,
  PermissionMode,
  Session,
  SessionId,
  SessionStats,
  SessionStatus,
} from '../types/session.js'
import type { StepTrace } from '../types/plan.js'
import { loadConfig } from '../config/index.js'

function sessionDir(id: SessionId): string {
  const cfg = loadConfig()
  return resolve(cfg.paths.sessionsDir, id)
}

export function generateSessionId(date = new Date()): SessionId {
  const cfg = loadConfig()
  const yymmdd = date
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, '')
  const dir = cfg.paths.sessionsDir
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const existing = readdirSync(dir).filter((d) => d.startsWith(`MSP-SESS-${yymmdd}`))
  const serial = String(existing.length + 1).padStart(3, '0')
  return `MSP-SESS-${yymmdd}${serial}` as SessionId
}

export interface CreateSessionOptions {
  userId?: string
  agentId?: string
  workspace?: string
  permissions?: PermissionMode
}

export function createSession(opts: CreateSessionOptions = {}): Session {
  const cfg = loadConfig()
  const id = generateSessionId()

  const session: Session = {
    id,
    startedAt: new Date().toISOString(),
    userId: opts.userId ?? 'MSP-USR-BOSS',
    agentId: opts.agentId ?? 'MSP-AGT-EVA-COWORK',
    workspace: opts.workspace ?? cfg.paths.workspace,
    permissions: opts.permissions ?? cfg.permissions.default_mode,
    history: [],
    traces: [],
    stats: {
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      toolCalls: 0,
      brainCalls: { cortex: 0, motor: 0, limbic: 0 },
    },
    status: 'active',
  }

  persistSessionMeta(session)
  return session
}

export function persistSessionMeta(session: Session): void {
  const dir = sessionDir(session.id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    resolve(dir, 'session.json'),
    JSON.stringify(
      {
        id: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt ?? null,
        userId: session.userId,
        agentId: session.agentId,
        workspace: session.workspace,
        permissions: session.permissions,
        stats: session.stats,
        status: session.status,
      },
      null,
      2,
    ),
  )
}

export function appendMessage(session: Session, message: Omit<Message, 'id' | 'sessionId' | 'createdAt'>): Message {
  const full: Message = {
    ...message,
    id: randomUUID(),
    sessionId: session.id,
    createdAt: new Date().toISOString(),
  }
  session.history.push(full)

  const dir = sessionDir(session.id)
  mkdirSync(dir, { recursive: true })
  appendFileSync(resolve(dir, 'messages.jsonl'), JSON.stringify(full) + '\n')
  return full
}

export function appendTrace(session: Session, trace: StepTrace): void {
  session.traces.push(trace)
  const dir = sessionDir(session.id)
  mkdirSync(dir, { recursive: true })
  appendFileSync(resolve(dir, 'traces.jsonl'), JSON.stringify(trace) + '\n')
}

export function updateStats(session: Session, delta: Partial<SessionStats>): void {
  session.stats = {
    tokensIn: session.stats.tokensIn + (delta.tokensIn ?? 0),
    tokensOut: session.stats.tokensOut + (delta.tokensOut ?? 0),
    costUsd: session.stats.costUsd + (delta.costUsd ?? 0),
    toolCalls: session.stats.toolCalls + (delta.toolCalls ?? 0),
    brainCalls: {
      cortex: session.stats.brainCalls.cortex + (delta.brainCalls?.cortex ?? 0),
      motor: session.stats.brainCalls.motor + (delta.brainCalls?.motor ?? 0),
      limbic: session.stats.brainCalls.limbic + (delta.brainCalls?.limbic ?? 0),
    },
  }
}

export function setStatus(session: Session, status: SessionStatus): void {
  session.status = status
  if (status === 'ended' || status === 'cancelled') {
    session.endedAt = new Date().toISOString()
  }
  persistSessionMeta(session)
}
