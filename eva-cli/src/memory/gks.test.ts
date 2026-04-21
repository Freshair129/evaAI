import { describe, expect, it } from 'vitest'
import { loadIndex, filterIndex } from './gks.js'

describe('gks reader (integration against repo atomic_index)', () => {
  it('loads atomic_index.jsonl without throwing', () => {
    const entries = loadIndex({ reload: true })
    expect(Array.isArray(entries)).toBe(true)
  })

  it('strips quoted IDs from legacy index format', () => {
    const entries = loadIndex({ reload: true })
    for (const entry of entries) {
      expect(entry.id.startsWith('"')).toBe(false)
      expect(entry.status.startsWith('"')).toBe(false)
    }
  })

  it('filters by type prefix', () => {
    const concepts = filterIndex({ type: 'concept' })
    for (const entry of concepts) {
      expect(entry.id.toUpperCase().startsWith('CONCEPT--')).toBe(true)
    }
  })
})
