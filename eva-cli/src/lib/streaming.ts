import type { BrainChunk } from '../types/brain.js'

export async function* mapStream<T, U>(
  stream: AsyncIterable<T>,
  fn: (v: T) => U | undefined,
): AsyncIterable<U> {
  for await (const v of stream) {
    const mapped = fn(v)
    if (mapped !== undefined) yield mapped
  }
}

export async function collectText(stream: AsyncIterable<BrainChunk>): Promise<string> {
  const parts: string[] = []
  for await (const chunk of stream) {
    if (chunk.type === 'text') parts.push(chunk.content)
  }
  return parts.join('')
}

export async function collectAll(stream: AsyncIterable<BrainChunk>): Promise<BrainChunk[]> {
  const out: BrainChunk[] = []
  for await (const chunk of stream) out.push(chunk)
  return out
}

export function abortable<T>(
  stream: AsyncIterable<T>,
  signal: AbortSignal | undefined,
): AsyncIterable<T> {
  if (!signal) return stream
  return (async function* () {
    for await (const v of stream) {
      if (signal.aborted) return
      yield v
    }
  })()
}
