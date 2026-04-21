import { describe, expect, it } from 'vitest'
import { cosine, dot, magnitude, topK } from './similarity.js'

describe('cosine', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 5)
  })

  it('returns -1 for opposite vectors', () => {
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1, 5)
  })

  it('returns 0 when either vector has magnitude 0', () => {
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0)
  })
})

describe('dot', () => {
  it('computes dot product', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32)
  })

  it('handles different lengths by taking min', () => {
    expect(dot([1, 2, 3, 4], [1, 1])).toBe(3)
  })
})

describe('magnitude', () => {
  it('computes euclidean norm', () => {
    expect(magnitude([3, 4])).toBe(5)
  })
})

describe('topK', () => {
  it('returns top K sorted by score descending', () => {
    const query = [1, 0]
    const vectors = [
      [0, 1],
      [1, 0],
      [0.9, 0.1],
      [-1, 0],
    ]
    const result = topK(query, vectors, 2)
    expect(result).toHaveLength(2)
    expect(result[0]!.index).toBe(1) // perfect match
    expect(result[1]!.index).toBe(2) // close match
  })

  it('respects threshold', () => {
    const result = topK([1, 0], [[0, 1], [1, 0]], 10, 0.9)
    expect(result).toHaveLength(1)
    expect(result[0]!.index).toBe(1)
  })

  it('returns empty when no vectors pass threshold', () => {
    const result = topK([1, 0], [[0, 1]], 5, 0.5)
    expect(result).toEqual([])
  })
})
