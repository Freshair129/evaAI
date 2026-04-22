import type {
  EpisodicMemory,
  Hit,
  RetrievalQuery,
  RetrievalResult,
  AtomicNote,
} from '../types/memory.js'
import { loadIndex, lookup, searchByText, filterIndex, readNote } from './gks.js'
import { VectorStore, type StoreName } from './vector/index.js'
import { writeEpisodic, readEpisodic, listEpisodic } from './episodic.js'
import { proposeInbound, type InboundArtifact, type InboundResult } from './inbound.js'
import { getObsidianClient } from './obsidian-mcp.js'
import type { RetrievalProvider } from './providers/types.js'

export interface MemoryStoreOptions {
  enableObsidian?: boolean
  vectorSources?: StoreName[]
  /**
   * Optional array of RetrievalProvider implementations. Reserved for Wave 1+
   * of MSP-IMP-260421001 (KOS hybrid retrieval). Currently stored but not
   * consulted — `retrieve()` uses the legacy path to preserve backward compat.
   */
  providers?: RetrievalProvider[]
}

export class MemoryStore {
  private vectors = new Map<StoreName, VectorStore>()
  private enableObsidian: boolean
  private vectorSources: StoreName[]
  /**
   * Providers array — wired in Wave 0 (T2) but not yet consumed by retrieve().
   * HybridRetriever (T7) will read from this in a later wave.
   */
  readonly providers: RetrievalProvider[]

  constructor(opts: MemoryStoreOptions = {}) {
    this.enableObsidian = opts.enableObsidian ?? false
    this.vectorSources = opts.vectorSources ?? ['atomic', 'episodic']
    this.providers = opts.providers ?? []
  }

  private getVectorStore(name: StoreName): VectorStore {
    let store = this.vectors.get(name)
    if (!store) {
      store = new VectorStore({ name })
      this.vectors.set(name, store)
    }
    return store
  }

  async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
    const start = Date.now()
    const sources = query.sources ?? ['atomic', 'vector', 'episodic']
    const topK = query.topK ?? 5
    const allHits: Hit[] = []
    let totalScanned = 0

    if (sources.includes('atomic')) {
      const entries = filterIndex(query.filter ?? {})
      totalScanned += entries.length
      const textHits = searchByText(query.text, topK)
      for (const entry of textHits) {
        allHits.push({
          source: 'atomic',
          id: entry.id,
          path: entry.path,
          score: 0.7,
          snippet: `${entry.id} (${entry.phase}/${entry.status})`,
        })
      }
    }

    if (sources.includes('vector')) {
      for (const vs of this.vectorSources) {
        const store = this.getVectorStore(vs)
        totalScanned += store.size()
        try {
          const hits = await store.search(query.text, topK)
          allHits.push(...hits)
        } catch {
          // embedder or store unavailable — skip
        }
      }
    }

    if (sources.includes('obsidian') && this.enableObsidian) {
      try {
        const client = getObsidianClient()
        const hits = await client.search(query.text, topK)
        allHits.push(...hits)
      } catch {
        // obsidian unavailable — skip
      }
    }

    if (sources.includes('episodic')) {
      const sessions = listEpisodic()
      totalScanned += sessions.length
      const needle = query.text.toLowerCase()
      for (const sid of sessions.slice(-20)) {
        const mem = readEpisodic(sid)
        if (!mem) continue
        const hay = `${mem.summary} ${mem.tags.join(' ')}`.toLowerCase()
        if (hay.includes(needle)) {
          allHits.push({
            source: 'episodic',
            id: sid,
            score: 0.6,
            snippet: mem.summary.slice(0, 300),
            meta: { tags: mem.tags, endedAt: mem.endedAt },
          })
        }
      }
    }

    const dedup = new Map<string, Hit>()
    for (const h of allHits) {
      const key = h.path ?? h.id
      const existing = dedup.get(key)
      if (!existing || h.score > existing.score) dedup.set(key, h)
    }
    const hits = [...dedup.values()].sort((a, b) => b.score - a.score).slice(0, topK)

    return { hits, totalScanned, latencyMs: Date.now() - start }
  }

  lookup(id: string): AtomicNote | null {
    return lookup(id)
  }

  listAllAtomic() {
    return loadIndex()
  }

  readAtomic(entry: Parameters<typeof readNote>[0]) {
    return readNote(entry)
  }

  writeEpisodic(memory: EpisodicMemory): string {
    return writeEpisodic(memory)
  }

  readEpisodicSession(sessionId: string): EpisodicMemory | null {
    return readEpisodic(sessionId)
  }

  proposeInbound(artifact: InboundArtifact): InboundResult {
    return proposeInbound(artifact)
  }

  getVector(name: StoreName): VectorStore {
    return this.getVectorStore(name)
  }
}

let singleton: MemoryStore | null = null
export function getMemoryStore(opts: MemoryStoreOptions = {}): MemoryStore {
  if (!singleton) singleton = new MemoryStore(opts)
  return singleton
}

export { VectorStore } from './vector/index.js'
export { writeEpisodic, readEpisodic, listEpisodic } from './episodic.js'
export { proposeInbound } from './inbound.js'
export { loadIndex, lookup, filterIndex, searchByText } from './gks.js'
export { parseFrontmatter } from './frontmatter.js'
export type {
  RetrievalProvider,
  Query,
  Hit as ProviderHit,
  QueryMode,
  Capability,
  ProviderHealth,
  SearchOpts,
  QueryFilters,
  QueryRelations,
  QueryBudget,
  HitEvidence,
  ProviderKind,
} from './providers/types.js'
