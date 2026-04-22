import { describe, expect, it, vi } from 'vitest'
import { HybridRetriever } from './hybrid-retriever.js'
import type { RetrievalProvider, Query, Hit } from './providers/types.js'

describe('HybridRetriever', () => {
  const mockAtomic: RetrievalProvider = {
    kind: 'atomic',
    cost: 'O(1)',
    capability: (q: Query) => q.text === 'EXACT' ? 'definite_hit' : 'may_hit',
    search: async (q: Query) => q.text === 'EXACT' ? [{ source: 'atomic', id: 'EXACT', score: 1.0, snippet: '' }] : [],
    health: async () => ({ ok: true })
  }

  const mockVector: RetrievalProvider = {
    kind: 'vector',
    cost: 'O(N*D)',
    capability: () => 'may_hit',
    search: async () => [{ source: 'vector', id: 'VEC', score: 0.8, snippet: '' }],
    health: async () => ({ ok: true })
  }

  it('short-circuits on definite hit', async () => {
    const atomicSpy = vi.spyOn(mockAtomic, 'search')
    const vectorSpy = vi.spyOn(mockVector, 'search')
    
    const retriever = new HybridRetriever([mockAtomic, mockVector])
    const hits = await retriever.resolve({ text: 'EXACT' })
    
    expect(hits).toHaveLength(1)
    expect(hits[0].id).toBe('EXACT')
    expect(atomicSpy).toHaveBeenCalled()
    expect(vectorSpy).not.toHaveBeenCalled() // Short-circuit worked
  })

  it('calls all providers when no short-circuit', async () => {
    const atomicSpy = vi.spyOn(mockAtomic, 'search')
    const vectorSpy = vi.spyOn(mockVector, 'search')
    
    const retriever = new HybridRetriever([mockAtomic, mockVector])
    const hits = await retriever.resolve({ text: 'something' })
    
    expect(hits.length).toBeGreaterThan(0)
    expect(atomicSpy).toHaveBeenCalled()
    expect(vectorSpy).toHaveBeenCalled()
  })

  it('enforces budget/deadline', async () => {
    const slowProvider: RetrievalProvider = {
      kind: 'vector',
      cost: 'O(N*D)',
      capability: () => 'may_hit',
      search: async () => {
        await new Promise(r => setTimeout(r, 100))
        return [{ source: 'vector', id: 'SLOW', score: 0.5, snippet: '' }]
      },
      health: async () => ({ ok: true })
    }

    const retriever = new HybridRetriever([mockAtomic, slowProvider])
    
    // Set a very tight budget
    const start = Date.now()
    const hits = await retriever.resolve({ 
      text: 'something', 
      budget: { maxLatencyMs: 10 } 
    })
    const duration = Date.now() - start
    
    expect(hits.every(h => h.id !== 'SLOW')).toBe(true)
  })
})
