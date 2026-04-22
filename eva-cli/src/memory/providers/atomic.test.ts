import { describe, expect, it, vi } from 'vitest'
import { AtomicIndexProvider } from './atomic.js'
import * as gks from '../gks.js'

describe('AtomicIndexProvider', () => {
  const mockEntries = [
    { id: 'CONCEPT--TEST', path: 'gks/concepts/test.md', phase: '1', status: 'raw' },
    { id: 'ADR--TEST', path: 'gks/adrs/test.md', phase: '2', status: 'accepted' },
    { id: 'OTHER', path: 'other.md', phase: 'unknown', status: 'draft' }
  ]

  it('identifies capability correctly', () => {
    const provider = new AtomicIndexProvider()
    
    // Exact ID pattern
    expect(provider.capability({ text: 'CONCEPT--TEST' })).toBe('definite_hit')
    expect(provider.capability({ text: 'ADR--123' })).toBe('definite_hit')
    
    // Explicit exact mode
    expect(provider.capability({ text: 'something', mode: 'exact' })).toBe('definite_hit')
    
    // General text
    expect(provider.capability({ text: 'how to test' })).toBe('may_hit')
  })

  it('returns exact match with score 1.0', async () => {
    vi.spyOn(gks, 'loadIndex').mockReturnValue(mockEntries as any)
    const provider = new AtomicIndexProvider()
    
    const hits = await provider.search({ text: 'CONCEPT--TEST' })
    expect(hits).toHaveLength(1)
    expect(hits[0]!.id).toBe('CONCEPT--TEST')
    expect(hits[0]!.score).toBe(1.0)
    expect(hits[0]!.evidence?.exactMatch).toBe(true)
  })

  it('returns substring hits when no exact match found', async () => {
    vi.spyOn(gks, 'loadIndex').mockReturnValue(mockEntries as any)
    const provider = new AtomicIndexProvider()
    
    const hits = await provider.search({ text: 'TEST' })
    expect(hits).toHaveLength(2)
    expect(hits.map(h => h.id)).toContain('CONCEPT--TEST')
    expect(hits.map(h => h.id)).toContain('ADR--TEST')
    expect(hits.every(h => h.score < 1.0)).toBe(true)
  })

  it('respects filters', async () => {
    vi.spyOn(gks, 'loadIndex').mockReturnValue(mockEntries as any)
    const provider = new AtomicIndexProvider()
    
    const hits = await provider.search({ 
      text: 'TEST', 
      filters: { phase: 2 } 
    })
    expect(hits).toHaveLength(1)
    expect(hits[0]!.id).toBe('ADR--TEST')
  })

  it('handles type filter', async () => {
    vi.spyOn(gks, 'loadIndex').mockReturnValue(mockEntries as any)
    const provider = new AtomicIndexProvider()
    
    const hits = await provider.search({ 
      text: 'TEST', 
      filters: { type: 'ADR' } 
    })
    expect(hits).toHaveLength(1)
    expect(hits[0]!.id).toBe('ADR--TEST')
  })
})
