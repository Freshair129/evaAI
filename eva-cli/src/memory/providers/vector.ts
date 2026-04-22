import { VectorStore, type StoreName } from '../vector/index.js'
import type { 
  RetrievalProvider, 
  Query, 
  Hit as ProviderHit, 
  Capability, 
  ProviderHealth, 
  SearchOpts,
  ProviderKind
} from './types.js'

/**
 * FileVectorProvider — Semantic search using the pre-existing VectorStore.
 * 
 * Backed by .eva/vector/atomic.jsonl (by default).
 * 
 * Spec: gks/adrs/ADR--HYBRID-RETRIEVAL.md §Provider C: FileVectorProvider
 */
export class FileVectorProvider implements RetrievalProvider {
  readonly kind: ProviderKind = 'vector'
  readonly cost = 'O(N*D)'

  private store: VectorStore

  constructor(storeName: StoreName = 'atomic') {
    this.store = new VectorStore({ name: storeName })
  }

  capability(q: Query): Capability {
    // Vector search is the fallback for any semantic/auto query
    if (q.mode === 'semantic' || q.mode === 'auto') {
      return 'may_hit'
    }
    return 'miss'
  }

  async search(q: Query, opts?: SearchOpts): Promise<ProviderHit[]> {
    // Note: VectorStore search uses the old Hit shape
    const legacyHits = await this.store.search(q.text, opts?.topK ?? 10)
    
    return legacyHits.map(lh => ({
      source: this.kind,
      id: lh.id,
      path: lh.path,
      score: lh.score,
      snippet: lh.snippet,
      evidence: {
        cosineScore: lh.score
      },
      meta: lh.meta
    }))
  }

  async health(): Promise<ProviderHealth> {
    try {
      const size = this.store.size()
      return { ok: true, message: `Store loaded with ${size} chunks` }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) }
    }
  }
}
