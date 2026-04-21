export interface AtomicEntry {
  id: string
  path: string
  phase: string
  status: string
  vaultId: string
  lastUpdated: string
}

export interface AtomicNote extends AtomicEntry {
  content: string
  frontmatter: Record<string, unknown>
}

export interface VectorChunk {
  id: string
  path: string
  chunk: number
  text: string
  vec: number[]
  meta?: Record<string, unknown>
}

export interface Hit {
  source: 'atomic' | 'vector' | 'obsidian' | 'episodic'
  id: string
  path?: string
  score: number
  snippet: string
  meta?: Record<string, unknown>
}

export interface RetrievalQuery {
  text: string
  sources?: Array<'atomic' | 'vector' | 'obsidian' | 'episodic'>
  topK?: number
  filter?: {
    phase?: number
    type?: string
    status?: string
  }
}

export interface RetrievalResult {
  hits: Hit[]
  totalScanned: number
  latencyMs: number
}

export interface EpisodicMemory {
  sessionId: string
  startedAt: string
  endedAt: string
  durationMin: number
  tokensTotal: number
  costUsd: number
  tags: string[]
  linkedAtoms: string[]
  emotionSummary: string
  outcomes: string[]
  summary: string
}
