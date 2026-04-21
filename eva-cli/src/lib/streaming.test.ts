import { describe, expect, it } from 'vitest'
import { abortable, collectAll, collectText, mapStream } from './streaming.js'
import type { BrainChunk } from '../types/brain.js'

async function* textStream(parts: string[]): AsyncIterable<BrainChunk> {
  for (const p of parts) yield { type: 'text', content: p }
  yield { type: 'done', stopReason: 'end_turn' }
}

describe('collectText', () => {
  it('concatenates all text chunks', async () => {
    const out = await collectText(textStream(['hello ', 'world']))
    expect(out).toBe('hello world')
  })
})

describe('collectAll', () => {
  it('returns all chunks including done', async () => {
    const chunks = await collectAll(textStream(['a']))
    expect(chunks).toHaveLength(2)
    expect(chunks[1]?.type).toBe('done')
  })
})

describe('mapStream', () => {
  it('filters and maps', async () => {
    const mapped = mapStream(textStream(['a', 'b']), (c) =>
      c.type === 'text' ? c.content.toUpperCase() : undefined,
    )
    const out: string[] = []
    for await (const v of mapped) out.push(v)
    expect(out).toEqual(['A', 'B'])
  })
})

describe('abortable', () => {
  it('stops yielding after abort', async () => {
    const controller = new AbortController()
    const wrapped = abortable(textStream(['a', 'b', 'c', 'd']), controller.signal)
    const out: BrainChunk[] = []
    let count = 0
    for await (const v of wrapped) {
      out.push(v)
      count += 1
      if (count === 2) controller.abort()
    }
    expect(out.length).toBeLessThanOrEqual(2)
  })
})
