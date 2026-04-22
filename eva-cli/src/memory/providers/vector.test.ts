import { describe, expect, it, vi, beforeEach } from 'vitest'
import { FileVectorProvider } from './vector.js'
import { VectorStore } from '../vector/index.js'

vi.mock('../vector/index.js')

describe('FileVectorProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('identifies capability correctly', () => {
    const provider = new FileVectorProvider()
    expect(provider.capability({ text: 'test', mode: 'semantic' })).toBe('may_hit')
    expect(provider.capability({ text: 'test', mode: 'auto' })).toBe('may_hit')
    expect(provider.capability({ text: 'test', mode: 'exact' })).toBe('miss')
  })

  it('translates legacy hits to new hit shape', async () => {
    const mockLegacyHits = [
      { id: 'ID1', path: 'path1.md', score: 0.9, snippet: 'snippet1', meta: { key: 'val' } }
    ]
    
    // @ts-ignore
    vi.mocked(VectorStore).mockImplementation(() => ({
      search: vi.fn().mockResolvedValue(mockLegacyHits),
      size: vi.fn().mockReturnValue(1)
    }))

    const provider = new FileVectorProvider()
    const hits = await provider.search({ text: 'query' })
    
    expect(hits).toHaveLength(1)
    expect(hits[0]!.source).toBe('vector')
    expect(hits[0]!.id).toBe('ID1')
    expect(hits[0]!.evidence?.cosineScore).toBe(0.9)
    expect(hits[0]!.meta?.key).toBe('val')
  })

  it('reports health correctly', async () => {
    // @ts-ignore
    vi.mocked(VectorStore).mockImplementation(() => ({
      size: vi.fn().mockReturnValue(42)
    }))

    const provider = new FileVectorProvider()
    const health = await provider.health()
    expect(health.ok).toBe(true)
    expect(health.message).toContain('42 chunks')
  })
})
