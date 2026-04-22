import { describe, expect, it } from 'vitest'
import type {
  RetrievalProvider,
  Query,
  Hit,
  Capability,
  ProviderHealth,
  SearchOpts,
} from './types.js'

/**
 * Contract tests: any implementation of RetrievalProvider must be
 * constructible from these types. We validate via compile-time (TS)
 * and a mock implementation to prove shape is usable at runtime.
 */

class MockProvider implements RetrievalProvider {
  readonly kind = 'atomic' as const
  readonly cost = 'O(1)' as const

  capability(q: Query): Capability {
    if (q.text.startsWith('MOCK-')) return 'definite_hit'
    if (q.text.length < 3) return 'miss'
    return 'may_hit'
  }

  async search(q: Query, opts?: SearchOpts): Promise<Hit[]> {
    void opts
    return [
      {
        source: 'atomic',
        id: 'MOCK--1',
        path: 'mock/1.md',
        score: 0.95,
        snippet: `match for ${q.text}`,
        evidence: { exactMatch: q.text === 'MOCK--1' },
      },
    ]
  }

  async health(): Promise<ProviderHealth> {
    return { ok: true, latencyMs: 1 }
  }
}

describe('RetrievalProvider contract', () => {
  const provider = new MockProvider()

  it('exposes kind + cost as readonly metadata', () => {
    expect(provider.kind).toBe('atomic')
    expect(provider.cost).toBe('O(1)')
  })

  it('capability returns miss for tiny query', () => {
    expect(provider.capability({ text: 'x' })).toBe('miss')
  })

  it('capability returns definite_hit for exact pattern', () => {
    expect(provider.capability({ text: 'MOCK-1' })).toBe('definite_hit')
  })

  it('capability returns may_hit otherwise', () => {
    expect(provider.capability({ text: 'something random' })).toBe('may_hit')
  })

  it('search returns Hit array matching shape', async () => {
    const hits = await provider.search({ text: 'test query' })
    expect(hits).toHaveLength(1)
    expect(hits[0]!.source).toBe('atomic')
    expect(hits[0]!.score).toBeGreaterThan(0)
    expect(typeof hits[0]!.id).toBe('string')
    expect(typeof hits[0]!.snippet).toBe('string')
  })

  it('health returns ok status', async () => {
    const h = await provider.health()
    expect(h.ok).toBe(true)
  })

  it('accepts optional filters, relations, budget on Query', () => {
    const q: Query = {
      text: 'full query',
      mode: 'semantic',
      filters: { phase: 2, type: 'concept', tags: ['architecture'] },
      relations: { seedIds: ['CONCEPT--X'], expandBacklinks: true, depth: 2 },
      budget: { maxHits: 10, maxLatencyMs: 500 },
    }
    expect(q.filters?.phase).toBe(2)
    expect(q.relations?.depth).toBe(2)
    expect(q.budget?.maxHits).toBe(10)
  })

  it('Hit supports all evidence fields', () => {
    const hit: Hit = {
      source: 'vector',
      id: 'ID',
      score: 0.8,
      snippet: 'text',
      evidence: {
        exactMatch: false,
        keywordCount: 3,
        cosineScore: 0.82,
        graphDistance: 2,
      },
    }
    expect(hit.evidence?.keywordCount).toBe(3)
  })
})
