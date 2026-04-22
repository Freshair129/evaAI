import type { 
  RetrievalProvider, 
  Query, 
  Hit
} from './providers/types.js'
import { rerank } from './reranker.js'

/**
 * HybridRetriever — Orchestrates multiple providers with cascade and budget enforcement.
 * 
 * Spec: gks/adrs/ADR--HYBRID-RETRIEVAL.md §HybridRetriever
 */
export class HybridRetriever {
  constructor(private providers: RetrievalProvider[]) {}

  async resolve(q: Query): Promise<Hit[]> {
    const budget = q.budget ?? { maxHits: 10, maxLatencyMs: 500 }
    const deadline = Date.now() + (budget.maxLatencyMs ?? 500)
    
    const resultsByProvider: Hit[][] = []
    
    // 1. Cheap Cascade (Atomic + maybe FTS)
    // If it looks like an exact ID, we might only need Atomic
    const cheapProviders = this.providers.filter(p => p.kind === 'atomic' || p.kind === 'fts')
    
    for (const p of cheapProviders) {
      if (Date.now() > deadline) break
      
      const capability = p.capability(q)
      if (capability === 'miss') continue
      
      try {
        const hits = await p.search(q, { deadline, topK: budget.maxHits })
        if (hits.length > 0) {
          resultsByProvider.push(hits)
          
          // Short-circuit if we found a definite hit with high confidence
          if (capability === 'definite_hit' && hits.some(h => (h.score ?? 0) >= 0.95)) {
            return rerank(resultsByProvider, q)
          }
        }
      } catch (e) {
        console.error(`Provider ${p.kind} failed:`, e)
      }
    }

    // 2. Parallel dispatch for remaining providers if budget allows
    const remainingProviders = this.providers.filter(p => 
      p.kind !== 'atomic' && p.kind !== 'fts' && !resultsByProvider.some(r => r.some(h => h.source === p.kind))
    )

    if (remainingProviders.length > 0 && Date.now() < deadline - 50) {
      const promises = remainingProviders.map(async (p) => {
        if (p.capability(q) === 'miss') return []
        try {
          return await p.search(q, { deadline, topK: budget.maxHits })
        } catch (e) {
          console.error(`Provider ${p.kind} failed:`, e)
          return []
        }
      })

      const results = await Promise.all(promises)
      results.forEach(hits => {
        if (hits.length > 0) resultsByProvider.push(hits)
      })
    }

    // 3. Final Rerank
    return rerank(resultsByProvider, q)
  }
}
