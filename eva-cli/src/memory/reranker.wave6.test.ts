import { describe, it, expect } from 'vitest'
import { rerank } from './reranker.js'
import type { Hit, Query } from './providers/types.js'

describe('Weighted Sum Reranker (Wave 6)', () => {
  it('ranks hits by weighted sum of components', () => {
    const hits: Hit[][] = [
      [
        { 
          id: 'CONCEPT--TEST', 
          source: 'vector', 
          score: 0.8, 
          snippet: 'semantic hit',
          meta: { status: 'stable', last_updated: new Date().toISOString() }
        }
      ],
      [
        { 
          id: 'CONCEPT--TEST', 
          source: 'fts', 
          score: 10.0, // BM25 raw
          snippet: 'fts hit'
        },
        {
          id: 'ADR--TEST',
          source: 'fts',
          score: 5.0,
          snippet: 'lower fts hit',
          meta: { status: 'verified', last_updated: new Date().toISOString() }
        }
      ]
    ]

    const query: Query = { text: 'test query', mode: 'explain' }
    const results = rerank(hits, query)

    expect(results.length).toBe(2)
    expect(results[0].id).toBe('CONCEPT--TEST') // Higher semantic + status + type boost for explain
    expect(results[0].meta?.scoreBreakdown).toBeDefined()
  })

  it('applies type boost correctly', () => {
    const hits: Hit[][] = [[
      { id: 'CONCEPT--1', source: 'atomic', score: 1.0, snippet: 'c' },
      { id: 'BLUEPRINT--1', source: 'atomic', score: 1.0, snippet: 'b' }
    ]]

    const explainQuery: Query = { text: 'q', mode: 'explain' }
    const codeQuery: Query = { text: 'q', mode: 'code' }

    const explainResults = rerank(hits, explainQuery)
    const codeResults = rerank(hits, codeQuery)

    expect(explainResults[0].id).toBe('CONCEPT--1')
    expect(codeResults[0].id).toBe('BLUEPRINT--1')
  })
})
