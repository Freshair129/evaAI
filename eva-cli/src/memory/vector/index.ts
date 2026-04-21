import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import type { Hit, VectorChunk } from '../../types/memory.js'
import { loadConfig } from '../../config/index.js'
import { createEmbedder, chunkText, type Embedder } from './embedder.js'
import { topK } from './similarity.js'

export type StoreName = 'atomic' | 'obsidian' | 'episodic'

interface Manifest {
  embedderModel: string
  dimension: number
  docCount: number
  lastUpdated: string
  fileHashes: Record<string, string>
}

export interface VectorStoreOptions {
  name: StoreName
  embedder?: Embedder
}

export class VectorStore {
  readonly name: StoreName
  private embedder: Embedder | null = null
  private chunks: VectorChunk[] = []
  private loaded = false

  constructor(opts: VectorStoreOptions) {
    this.name = opts.name
    if (opts.embedder) this.embedder = opts.embedder
  }

  private get paths() {
    const cfg = loadConfig()
    const root = resolve(cfg.paths.vectorDir)
    return {
      root,
      data: resolve(root, `${this.name}.jsonl`),
      manifest: resolve(root, `${this.name}.manifest.json`),
    }
  }

  private async ensureEmbedder(): Promise<Embedder> {
    if (!this.embedder) this.embedder = await createEmbedder()
    return this.embedder
  }

  load(): VectorChunk[] {
    if (this.loaded) return this.chunks
    const { data } = this.paths
    if (!existsSync(data)) {
      this.chunks = []
      this.loaded = true
      return this.chunks
    }

    const content = readFileSync(data, 'utf8')
    this.chunks = content
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as VectorChunk
        } catch {
          return null
        }
      })
      .filter((c): c is VectorChunk => c !== null)
    this.loaded = true
    return this.chunks
  }

  async search(query: string, k = 5, threshold = 0.35): Promise<Hit[]> {
    const chunks = this.load()
    if (chunks.length === 0) return []

    const embedder = await this.ensureEmbedder()
    const [queryVec] = await embedder.embed([query])
    if (!queryVec) return []

    const scored = topK(
      queryVec,
      chunks.map((c) => c.vec),
      k,
      threshold,
    )

    return scored
      .map((s) => {
        const chunk = chunks[s.index]
        if (!chunk) return null
        return {
          source: this.name,
          id: chunk.id,
          path: chunk.path,
          score: s.score,
          snippet: chunk.text.slice(0, 300),
          meta: chunk.meta,
        } as Hit
      })
      .filter((h): h is Hit => h !== null)
  }

  async addDocument(doc: {
    id: string
    path: string
    text: string
    meta?: Record<string, unknown>
  }): Promise<number> {
    const { root, data } = this.paths
    mkdirSync(root, { recursive: true })

    const embedder = await this.ensureEmbedder()
    const segments = chunkText(doc.text)
    const vecs = await embedder.embed(segments)

    const newChunks: VectorChunk[] = segments.map((text, i) => ({
      id: doc.id,
      path: doc.path,
      chunk: i,
      text,
      vec: vecs[i] ?? [],
      ...(doc.meta !== undefined && { meta: doc.meta }),
    }))

    for (const c of newChunks) {
      appendFileSync(data, JSON.stringify(c) + '\n')
    }

    this.chunks.push(...newChunks)
    return newChunks.length
  }

  rebuild(chunks: VectorChunk[], manifest?: Partial<Manifest>): void {
    const { root, data, manifest: mpath } = this.paths
    mkdirSync(root, { recursive: true })
    writeFileSync(data, chunks.map((c) => JSON.stringify(c)).join('\n') + '\n')

    const fullManifest: Manifest = {
      embedderModel: manifest?.embedderModel ?? this.embedder?.model ?? 'unknown',
      dimension: manifest?.dimension ?? this.embedder?.dimension ?? 0,
      docCount: chunks.length,
      lastUpdated: new Date().toISOString(),
      fileHashes: manifest?.fileHashes ?? {},
    }
    writeFileSync(mpath, JSON.stringify(fullManifest, null, 2))
    this.chunks = chunks
    this.loaded = true
  }

  readManifest(): Manifest | null {
    const { manifest } = this.paths
    if (!existsSync(manifest)) return null
    return JSON.parse(readFileSync(manifest, 'utf8')) as Manifest
  }

  size(): number {
    return this.load().length
  }

  static hashFile(path: string): string {
    if (!existsSync(path)) return ''
    const content = readFileSync(path)
    const stat = statSync(path)
    return createHash('sha1').update(content).update(String(stat.mtimeMs)).digest('hex')
  }
}

export function fingerprint(files: Array<{ path: string; fullPath: string }>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of files) out[f.path] = VectorStore.hashFile(f.fullPath)
  return out
}

function _ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true })
}
// used internally by other memory modules
export { _ensureDir as ensureParentDir }
