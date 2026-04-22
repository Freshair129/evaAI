import { describe, expect, it } from 'vitest'
import { MemoryStore } from './index.js'
import type { RetrievalProvider, Query, Hit, ProviderHealth } from './providers/types.js'

function makeMockProvider(): RetrievalProvider {
  return {
    kind: 'atomic',
    cost: 'O(1)',
    capability: () => 'may_hit',
    search: async (q: Query): Promise<Hit[]> => [
      { source: 'atomic', id: 'TEST--1', score: 1.0, snippet: q.text },
    ],
    health: async (): Promise<ProviderHealth> => ({ ok: true }),
  }
}

describe('MemoryStore facade — T2 Wave 0', () => {
  it('constructs with no args (legacy shape still works)', () => {
    const store = new MemoryStore()
    expect(store).toBeDefined()
    expect(store.providers.length).toBeGreaterThanOrEqual(4)
  })

  it('accepts providers array via options', () => {
    const mock = makeMockProvider()
    const store = new MemoryStore({ providers: [mock] })
    expect(store.providers).toHaveLength(1)
    expect(store.providers[0]!.kind).toBe('atomic')
  })

  it('legacy retrieve() now delegates to providers (Wave 2 logic)', async () => {
    const mock = makeMockProvider()
    const store = new MemoryStore({ providers: [mock] })
    const result = await store.retrieve({ text: 'anything', topK: 3 })
    // retrieve now delegates to resolveContext -> providers
    expect(result.hits).toHaveLength(1)
    expect(result.hits[0]!.id).toBe('TEST--1')
  })

  it('exposes providers field as readonly-ish (runtime: still a regular array)', () => {
    const store = new MemoryStore({ providers: [makeMockProvider(), makeMockProvider()] })
    expect(store.providers.length).toBe(2)
  })
})
