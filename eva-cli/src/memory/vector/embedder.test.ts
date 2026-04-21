import { describe, expect, it } from 'vitest'
import { chunkText } from './embedder.js'

describe('chunkText', () => {
  it('returns single chunk for short text', () => {
    const chunks = chunkText('short text')
    expect(chunks).toEqual(['short text'])
  })

  it('splits on headings when text exceeds limit', () => {
    const text =
      '# Section A\n' +
      'a'.repeat(2000) +
      '\n# Section B\n' +
      'b'.repeat(2000) +
      '\n# Section C\n' +
      'c'.repeat(2000)
    const chunks = chunkText(text, { maxTokens: 512 })
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0]).toContain('# Section A')
  })

  it('uses sliding window for oversized single section', () => {
    const text = 'x'.repeat(10000)
    const chunks = chunkText(text, { maxTokens: 256, overlap: 32 })
    expect(chunks.length).toBeGreaterThan(1)
  })
})
