export function dot(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  let sum = 0
  for (let i = 0; i < n; i += 1) sum += (a[i] ?? 0) * (b[i] ?? 0)
  return sum
}

export function magnitude(v: number[]): number {
  let sum = 0
  for (const x of v) sum += x * x
  return Math.sqrt(sum)
}

export function cosine(a: number[], b: number[]): number {
  const magA = magnitude(a)
  const magB = magnitude(b)
  if (magA === 0 || magB === 0) return 0
  return dot(a, b) / (magA * magB)
}

export interface ScoredIndex {
  index: number
  score: number
}

export function topK(
  query: number[],
  vectors: number[][],
  k: number,
  threshold = 0,
): ScoredIndex[] {
  const scored: ScoredIndex[] = []
  for (let i = 0; i < vectors.length; i += 1) {
    const vec = vectors[i]
    if (!vec) continue
    const score = cosine(query, vec)
    if (score >= threshold) scored.push({ index: i, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, k)
}
