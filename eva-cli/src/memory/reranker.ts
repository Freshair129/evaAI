import type { Hit } from './providers/types.js'

/**
 * Reranker — Uses Reciprocal Rank Fusion (RRF) to merge and rank hits from multiple providers.
 * 
 * Formula: score = Σ (1 / (k + rank_i))
 * k = 60 (standard constant)
 * 
 * Spec: gks/adrs/ADR--HYBRID-RETRIEVAL.md §Reranking algorithm
 */
export function rerank(providerHits: Hit[][], k = 60): Hit[] {
  const merged = new Map<string, { hits: Hit[], rrfScore: number }>()

  // 1. Calculate RRF score for each unique document
  providerHits.forEach((hits) => {
    hits.forEach((hit, index) => {
      const key = hit.id
      const existing = merged.get(key) || { hits: [], rrfScore: 0 }
      
      const rank = index + 1
      existing.rrfScore += 1 / (k + rank)
      existing.hits.push(hit)
      
      merged.set(key, existing)
    })
  })

  // 2. Select the best version of each document and apply boosts
  const finalHits: Hit[] = Array.from(merged.values()).map(({ hits, rrfScore }) => {
    // Pick the hit with the best base score or metadata
    const sorted = [...hits].sort((a, b) => b.score - a.score)
    const bestHit = sorted[0]
    
    if (!bestHit) {
      throw new Error('Reranker: empty hits for document')
    }
    
    let finalScore = rrfScore * 100 // Scale up for readability
    
    // 3. Apply Boosts
    // exactMatch boost
    if (hits.some(h => h.evidence?.exactMatch)) {
      finalScore *= 1.5
    }

    // Status boosts
    const status = (bestHit.meta?.status as string)?.toLowerCase()
    if (status === 'stable' || status === 'accepted' || status === 'Final Polish') {
      finalScore *= 1.2
    } else if (status === 'deprecated') {
      finalScore *= 0.8
    }

    return {
      ...bestHit,
      score: finalScore
    } as Hit
  })

  // 4. Final sort
  return finalHits.sort((a, b) => b.score - a.score)
}
