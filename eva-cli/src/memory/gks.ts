import { existsSync, readFileSync, statSync, watch } from 'node:fs'
import { resolve } from 'node:path'
import type { AtomicEntry, AtomicNote } from '../types/memory.js'
import { loadConfig } from '../config/index.js'
import { parseFrontmatter, stripQuotes } from './frontmatter.js'

let cachedEntries: AtomicEntry[] | null = null
let cacheMtime = 0
let watcher: ReturnType<typeof watch> | null = null

function indexPath(): string {
  const cfg = loadConfig()
  return resolve(cfg.paths.gksRoot, '00_index/atomic_index.jsonl')
}

function parseLine(line: string): AtomicEntry | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  try {
    const raw = JSON.parse(trimmed) as Record<string, unknown>
    return {
      id: stripQuotes(raw.id),
      path: stripQuotes(raw.path),
      phase: stripQuotes(raw.phase),
      status: stripQuotes(raw.status),
      vaultId: stripQuotes(raw.vault_id ?? raw.vaultId),
      lastUpdated: stripQuotes(raw.last_updated ?? raw.lastUpdated),
    }
  } catch {
    return null
  }
}

export function loadIndex(opts: { reload?: boolean } = {}): AtomicEntry[] {
  const path = indexPath()
  if (!existsSync(path)) return []

  const mtime = statSync(path).mtimeMs
  if (!opts.reload && cachedEntries && mtime === cacheMtime) return cachedEntries

  const content = readFileSync(path, 'utf8')
  const entries = content
    .split('\n')
    .map(parseLine)
    .filter((e): e is AtomicEntry => e !== null)

  cachedEntries = entries
  cacheMtime = mtime

  if (!watcher) {
    try {
      watcher = watch(path, () => {
        cachedEntries = null
        cacheMtime = 0
      })
      watcher.unref?.()
    } catch {
      // watch unavailable on some filesystems — ignore
    }
  }

  return entries
}

export interface FilterQuery {
  phase?: number | string
  type?: string
  status?: string
  vaultId?: string
  idPrefix?: string
}

export function filterIndex(query: FilterQuery): AtomicEntry[] {
  const entries = loadIndex()
  return entries.filter((e) => {
    if (query.phase !== undefined && String(e.phase) !== String(query.phase)) return false
    if (query.status && e.status !== query.status) return false
    if (query.vaultId && e.vaultId !== query.vaultId) return false
    if (query.idPrefix && !e.id.startsWith(query.idPrefix)) return false
    if (query.type) {
      const typePrefix = query.type.toUpperCase() + '--'
      if (!e.id.toUpperCase().startsWith(typePrefix)) return false
    }
    return true
  })
}

export function lookup(id: string): AtomicNote | null {
  const entry = loadIndex().find((e) => e.id === id)
  if (!entry) return null
  return readNote(entry)
}

export function readNote(entry: AtomicEntry): AtomicNote | null {
  const cfg = loadConfig()
  const fullPath = resolve(cfg.paths.workspace, entry.path)
  if (!existsSync(fullPath)) return null
  const content = readFileSync(fullPath, 'utf8')
  const { frontmatter } = parseFrontmatter(content)
  return { ...entry, content, frontmatter }
}

export function searchByText(query: string, limit = 10): AtomicEntry[] {
  const needle = query.toLowerCase()
  const entries = loadIndex()
  const scored = entries
    .map((e) => ({
      entry: e,
      score: e.id.toLowerCase().includes(needle) ? 2 : e.path.toLowerCase().includes(needle) ? 1 : 0,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry)

  return scored
}
