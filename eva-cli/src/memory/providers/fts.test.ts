import { describe, expect, it, vi, beforeEach } from 'vitest'
import { RipgrepFtsProvider } from './fts.js'
import * as fs from 'node:fs'
import * as cp from 'node:child_process'
import * as config from '../../config/index.js'

vi.mock('node:fs')
vi.mock('node:child_process')
vi.mock('../../config/index.js')

describe('RipgrepFtsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(config.loadConfig).mockReturnValue({
      paths: {
        gksRoot: '/mock/gks'
      }
    } as any)
  })

  it('identifies capability as may_hit', () => {
    const provider = new RipgrepFtsProvider()
    expect(provider.capability({ text: 'any keyword' })).toBe('may_hit')
  })

  it('runs JS fallback when ripgrep is missing', async () => {
    // Mock spawn to fail (ripgrep not found)
    vi.spyOn(cp, 'spawn').mockImplementation((cmd, args) => {
      const emitter = {
        on: vi.fn((event, cb) => {
          if (event === 'error') cb(new Error('spawn rg ENOENT'))
          return emitter
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() }
      }
      return emitter as any
    })

    const provider = new RipgrepFtsProvider()
    const health = await provider.health()
    expect(health.message).toContain('JS fallback')
  })

  it('extracts ID from file content correctly', () => {
    vi.mocked(fs.readFileSync).mockReturnValue('---\nid: "ADR--123"\ntype: adr\n---\nContent here')
    const provider = new RipgrepFtsProvider()
    // @ts-ignore
    const id = provider.extractIdFromPath('dummy.md')
    expect(id).toBe('ADR--123')
  })

  it('handles files without ID', () => {
    vi.mocked(fs.readFileSync).mockReturnValue('Just some content without frontmatter id')
    const provider = new RipgrepFtsProvider()
    // @ts-ignore
    const id = provider.extractIdFromPath('dummy.md')
    expect(id).toBeNull()
  })
})
