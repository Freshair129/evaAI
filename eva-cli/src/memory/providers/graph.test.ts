import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BacklinkGraphProvider } from './graph.js'
import * as fs from 'node:fs'
import * as config from '../../config/index.js'

vi.mock('node:fs')
vi.mock('../../config/index.js')

describe('BacklinkGraphProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(config.loadConfig).mockReturnValue({
      paths: {
        vectorDir: '/mock/vector'
      }
    } as any)
  })

  it('identifies capability correctly', () => {
    const provider = new BacklinkGraphProvider()
    expect(provider.capability({ text: '', relations: { seedIds: ['A'] } })).toBe('definite_hit')
    expect(provider.capability({ text: '', mode: 'graph' })).toBe('may_hit')
    expect(provider.capability({ text: 'just text' })).toBe('miss')
  })

  it('traverses backlinks correctly', async () => {
    // Mock existence of files
    vi.mocked(fs.existsSync).mockReturnValue(true)
    
    // Mock backref.jsonl (to -> from)
    // B points to A, C points to A
    const backrefContent = '{"to":"A","from":"B","type":"implements"}\n{"to":"A","from":"C","type":"derived_from"}'
    
    vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
      if (path.includes('backref')) return backrefContent
      return ''
    })

    const provider = new BacklinkGraphProvider()
    const hits = await provider.search({ 
      text: '', 
      relations: { seedIds: ['A'], expandBacklinks: true } 
    })

    expect(hits).toHaveLength(2)
    expect(hits.map(h => h.id)).toContain('B')
    expect(hits.map(h => h.id)).toContain('C')
    expect(hits[0]!.meta?.direction).toBe('backward')
  })

  it('traverses forward links correctly', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    
    // Mock backlinks.jsonl (from -> to)
    // A points to B
    const backlinksContent = '{"from":"A","to":"B","type":"uses"}'
    
    vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
      if (path.includes('backlinks')) return backlinksContent
      return ''
    })

    const provider = new BacklinkGraphProvider()
    const hits = await provider.search({ 
      text: '', 
      relations: { seedIds: ['A'], expandForwardlinks: true, expandBacklinks: false } 
    })

    expect(hits).toHaveLength(1)
    expect(hits[0]!.id).toBe('B')
    expect(hits[0]!.meta?.direction).toBe('forward')
  })
})
