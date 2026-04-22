import { describe, expect, it } from 'vitest'
import { rerank } from './reranker.js'
import type { Hit } from './providers/types.js'

describe('Reranker (RRF)', () => {
  it('merges hits from different providers using RRF', () => {
    // Provider 1: [A, B]
    const hits1: Hit[] = [
      { source: 'atomic', id: 'A', score: 1.0, snippet: 'A' },
      { source: 'atomic', id: 'B', score: 0.8, snippet: 'B' }
    ]
    // Provider 2: [B, A]
    const hits2: Hit[] = [
      { source: 'fts', id: 'B', score: 0.9, snippet: 'B' },
      { source: 'fts', id: 'A', score: 0.7, snippet: 'A' }
    ]

    const result = rerank([hits1, hits2])
    
    expect(result).toHaveLength(2)
    // Both A and B are in both lists at positions 1 and 2.
    // RRF score for both should be (1/61 + 1/62)
    // But A has an exactMatch boost (if we added it, but here we didn't)
    // Let's check the order
    expect(result[0]!.id).toBe('A') // A might win because its atomic score was 1.0
  })

  it('applies exactMatch boost', () => {
    const hits1: Hit[] = [
      { source: 'atomic', id: 'A', score: 0.5, snippet: 'A', evidence: { exactMatch: true } }
    ]
    const hits2: Hit[] = [
      { source: 'fts', id: 'B', score: 0.9, snippet: 'B' }
    ]

    const result = rerank([hits1, hits2])
    expect(result[0]!.id).toBe('A') // A wins because of 1.5x boost
  })

  it('applies status boosts', () => {
    const hits1: Hit[] = [
      { source: 'atomic', id: 'DEPRECATED', score: 1.0, snippet: 'X', meta: { status: 'deprecated' } }
    ]
    const hits2: Hit[] = [
      { source: 'fts', id: 'STABLE', score: 0.9, snippet: 'Y', meta: { status: 'stable' } }
    ]

    const result = rerank([hits1, hits2])
    expect(result[0]!.id).toBe('STABLE') // Stable wins because of 1.2x boost vs 0.8x
  })
})
