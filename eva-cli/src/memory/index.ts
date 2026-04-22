import type {
  EpisodicMemory,
  RetrievalQuery,
  RetrievalResult,
  AtomicNote,
} from '../types/memory.js'
import { loadIndex, lookup, readNote } from './gks.js'
import { VectorStore, type StoreName } from './vector/index.js'
import { writeEpisodic, readEpisodic } from './episodic.js'
import { proposeInbound, type InboundArtifact, type InboundResult } from './inbound.js'
// import { getObsidianClient } from './obsidian-mcp.js'
import { 
  type RetrievalProvider, 
  type Query, 
  type Hit as ProviderHit 
} from './providers/types.js'
import { HybridRetriever } from './hybrid-retriever.js'
import { AtomicIndexProvider } from './providers/atomic.js'
import { RipgrepFtsProvider } from './providers/fts.js'
import { FileVectorProvider } from './providers/vector.js'
import { BacklinkGraphProvider } from './providers/graph.js'

export interface MemoryStoreOptions {
  enableObsidian?: boolean
  vectorSources?: StoreName[]
  /**
   * Optional array of RetrievalProvider implementations.
   */
  providers?: RetrievalProvider[]
}

export class MemoryStore {
  private vectors = new Map<StoreName, VectorStore>()
  private hybrid: HybridRetriever

  /**
   * Providers array — wired in Wave 0 (T2) and Wave 1 (T3-T6).
   */
  readonly providers: RetrievalProvider[]

  constructor(opts: MemoryStoreOptions = {}) {
    // If no providers provided, use defaults
    this.providers = opts.providers || [
      new AtomicIndexProvider(),
      new RipgrepFtsProvider(),
      new FileVectorProvider(),
      new BacklinkGraphProvider()
    ]
    
    this.hybrid = new HybridRetriever(this.providers)
  }

  private getVectorStore(name: StoreName): VectorStore {
    let store = this.vectors.get(name)
    if (!store) {
      store = new VectorStore({ name })
      this.vectors.set(name, store)
    }
    return store
  }

  static warnedRetrieve = false
  /**
   * @deprecated Use resolveContext() for hybrid retrieval.
   * This method now delegates to resolveContext for consistent results.
   */
  async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
    if (!MemoryStore.warnedRetrieve) {
      console.warn('MemoryStore.retrieve() is deprecated. Use resolveContext() instead.')
      MemoryStore.warnedRetrieve = true
    }
    const start = Date.now()
    
    // Convert old RetrievalQuery to new Query
    const newQuery: Query = {
      text: query.text,
      mode: 'auto',
      filters: query.filter ? {
        phase: query.filter.phase,
        status: query.filter.status,
        type: query.filter.type
      } : undefined,
      budget: {
        maxHits: query.topK ?? 5,
        maxLatencyMs: 500
      }
    }

    const hits = await this.resolveContext(newQuery)
    
    return { 
      hits: hits as any, // Cast due to legacy Hit vs ProviderHit overlap
      totalScanned: 0, // No longer tracked per-provider
      latencyMs: Date.now() - start 
    }
  }

  /**
   * resolveContext — New hybrid retrieval API.
   * Leverages Atomic, FTS, Vector, and Graph providers.
   */
  async resolveContext(query: Query): Promise<ProviderHit[]> {
    return this.hybrid.resolve(query)
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
