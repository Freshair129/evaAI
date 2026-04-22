import { loadIndex } from '../gks.js'
import type { 
  RetrievalProvider, 
  Query, 
  Hit, 
  Capability, 
  ProviderHealth, 
  SearchOpts,
  ProviderKind
} from './types.js'

/**
 * AtomicIndexProvider — O(1) exact ID lookup and O(N) substring fallback.
 * 
 * Backed by gks/00_index/atomic_index.jsonl.
 * 
 * Spec: gks/adrs/ADR--HYBRID-RETRIEVAL.md §Provider A: AtomicIndexProvider
 */
export class AtomicIndexProvider implements RetrievalProvider {
  readonly kind: ProviderKind = 'atomic'
  readonly cost = 'O(1)'

  capability(q: Query): Capability {
    // If it looks like an exact ID (e.g., CONCEPT--X, ADR--Y), it's a definite hit candidate
    if (q.mode === 'exact' || /^[A-Z]+--[A-Z0-9-]+$/.test(q.text)) {
      return 'definite_hit'
    }
    return 'may_hit'
  }

  async search(q: Query, opts?: SearchOpts): Promise<Hit[]> {
    const entries = loadIndex()
    const needle = q.text.toLowerCase()
    const results: Hit[] = []

    // 1. Exact lookup (Case sensitive as IDs are usually uppercase)
    const exact = entries.find(e => e.id === q.text)
    if (exact) {
      if (this.matchesFilters(exact, q)) {
        results.push(this.mapToHit(exact, 1.0, true))
      }
    }

    // 2. Substring matching if no exact hit or mode is not exact
    if (q.mode !== 'exact' && results.length === 0) {
      const limit = opts?.topK ?? 10
      const substringHits = entries
        .filter(e => e.id !== q.text) // Already checked exact
        .filter(e => e.id.toLowerCase().includes(needle) || e.path.toLowerCase().includes(needle))
        .filter(e => this.matchesFilters(e, q))
        .map(e => {
          // Score based on whether it's in ID or path
          const score = e.id.toLowerCase().includes(needle) ? 0.8 : 0.6
          return this.mapToHit(e, score, false)
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
      
      results.push(...substringHits)
    }

    return results
  }

  async health(): Promise<ProviderHealth> {
    try {
      loadIndex()
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) }
    }
  }

  private matchesFilters(entry: any, q: Query): boolean {
    if (!q.filters) return true
    const { phase, type, status } = q.filters
    
    if (phase !== undefined && String(entry.phase) !== String(phase)) return false
    if (status && entry.status !== status) return false
    if (type) {
      const typePrefix = type.toUpperCase() + '--'
      if (!entry.id.toUpperCase().startsWith(typePrefix)) return false
    }
    return true
  }

  private mapToHit(entry: any, score: number, exact: boolean): Hit {
    return {
      source: this.kind,
      id: entry.id,
      path: entry.path,
      score,
      snippet: `${entry.id} (${entry.phase}/${entry.status})`,
      evidence: {
        exactMatch: exact
      },
      meta: {
        phase: String(entry.phase),
        status: String(entry.status),
        vaultId: String(entry.vaultId)
      }
    } as Hit
  }
}
