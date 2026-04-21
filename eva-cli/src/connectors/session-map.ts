import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Session } from '../types/session.js'
import type { Platform } from './types.js'
import { createSession } from '../orchestrator/session.js'
import { loadConfig } from '../config/index.js'

export type ChatKey = `${Platform}:${string}`

interface SessionMapEntry {
  key: ChatKey
  sessionId: string
  createdAt: string
  lastSeen: string
}

interface PersistedMap {
  entries: SessionMapEntry[]
}

export class SessionMap {
  private map = new Map<ChatKey, Session>()
  private lastSeen = new Map<ChatKey, number>()
  private metaPath: string
  private ttlMs: number

  constructor(opts: { ttlHours?: number } = {}) {
    const cfg = loadConfig()
    this.metaPath = resolve(cfg.paths.brainRoot, 'connectors/session-map.json')
    this.ttlMs = (opts.ttlHours ?? 24) * 3600_000
    this.loadPersistedMeta()
  }

  key(platform: Platform, chatId: string): ChatKey {
    return `${platform}:${chatId}` as ChatKey
  }

  getOrCreate(platform: Platform, chatId: string): Session {
    const k = this.key(platform, chatId)
    let existing = this.map.get(k)

    if (existing && this.isExpired(k)) {
      this.map.delete(k)
      this.lastSeen.delete(k)
      existing = undefined
    }

    if (!existing) {
      const session = createSession({
        permissions: 'auto',
        userId: `MSP-USR-${platform.toUpperCase()}-${chatId}`,
      })
      this.map.set(k, session)
    }

    this.lastSeen.set(k, Date.now())
    this.persistMeta()
    return this.map.get(k)!
  }

  forget(platform: Platform, chatId: string): void {
    const k = this.key(platform, chatId)
    this.map.delete(k)
    this.lastSeen.delete(k)
    this.persistMeta()
  }

  size(): number {
    return this.map.size
  }

  private isExpired(k: ChatKey): boolean {
    const last = this.lastSeen.get(k)
    if (!last) return true
    return Date.now() - last > this.ttlMs
  }

  private persistMeta(): void {
    try {
      const entries: SessionMapEntry[] = []
      for (const [k, session] of this.map) {
        entries.push({
          key: k,
          sessionId: session.id,
          createdAt: session.startedAt,
          lastSeen: new Date(this.lastSeen.get(k) ?? Date.now()).toISOString(),
        })
      }
      mkdirSync(dirname(this.metaPath), { recursive: true })
      const data: PersistedMap = { entries }
      writeFileSync(this.metaPath, JSON.stringify(data, null, 2))
    } catch {
      // non-fatal
    }
  }

  private loadPersistedMeta(): void {
    if (!existsSync(this.metaPath)) return
    try {
      const data = JSON.parse(readFileSync(this.metaPath, 'utf8')) as PersistedMap
      for (const e of data.entries ?? []) {
        this.lastSeen.set(e.key, new Date(e.lastSeen).getTime())
      }
    } catch {
      // ignore
    }
  }
}

let singleton: SessionMap | null = null
export function getSessionMap(opts: { ttlHours?: number } = {}): SessionMap {
  if (!singleton) singleton = new SessionMap(opts)
  return singleton
}

export function resetSessionMap(): void {
  singleton = null
}
