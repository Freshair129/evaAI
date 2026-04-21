import { Ollama } from 'ollama'
import { loadConfig } from '../../config/index.js'

export interface Embedder {
  readonly model: string
  readonly dimension: number
  embed(texts: string[]): Promise<number[][]>
}

export class OllamaEmbedder implements Embedder {
  readonly model: string
  readonly dimension: number
  private client: Ollama

  constructor(model = 'bge-m3', dimension = 1024, endpoint = 'http://localhost:11434') {
    this.model = model
    this.dimension = dimension
    this.client = new Ollama({ host: endpoint })
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []
    const out: number[][] = []
    for (const text of texts) {
      const res = await this.client.embeddings({ model: this.model, prompt: text })
      out.push(res.embedding)
    }
    return out
  }

  async embedBatch(texts: string[], batchSize = 16): Promise<number[][]> {
    const out: number[][] = []
    for (let i = 0; i < texts.length; i += batchSize) {
      const slice = texts.slice(i, i + batchSize)
      const embeds = await Promise.all(
        slice.map((t) => this.client.embeddings({ model: this.model, prompt: t })),
      )
      out.push(...embeds.map((e) => e.embedding))
    }
    return out
  }
}

export class OpenAIEmbedder implements Embedder {
  readonly model: string
  readonly dimension: number
  private apiKey: string
  private endpoint: string

  constructor(apiKey: string, model = 'text-embedding-3-small', dimension = 1536) {
    this.model = model
    this.dimension = dimension
    this.apiKey = apiKey
    this.endpoint = 'https://api.openai.com/v1/embeddings'
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`OpenAI embeddings ${res.status}: ${txt}`)
    }
    const json = (await res.json()) as { data: Array<{ embedding: number[] }> }
    return json.data.map((d) => d.embedding)
  }
}

export async function createEmbedder(): Promise<Embedder> {
  const cfg = loadConfig()
  const primaryId = cfg.models.defaults.embedder
  const primary = cfg.models.models[primaryId]

  if (primary?.provider === 'ollama') {
    const embedder = new OllamaEmbedder(
      primary.model,
      1024,
      primary.endpoint ?? 'http://localhost:11434',
    )
    try {
      await embedder.embed(['warmup'])
      return embedder
    } catch {
      // fallthrough to fallback
    }
  }

  if (cfg.secrets.openaiApiKey) {
    return new OpenAIEmbedder(cfg.secrets.openaiApiKey)
  }

  throw new Error(
    'No embedder available: Ollama bge-m3 unreachable and OPENAI_API_KEY not set',
  )
}

export function chunkText(
  text: string,
  opts: { maxTokens?: number; overlap?: number } = {},
): string[] {
  const maxTokens = opts.maxTokens ?? 512
  const overlap = opts.overlap ?? 64
  const approxCharsPerToken = 4
  const maxChars = maxTokens * approxCharsPerToken
  const overlapChars = overlap * approxCharsPerToken

  if (text.length <= maxChars) return [text]

  const chunks: string[] = []
  const sections = text.split(/\n(?=#{1,6}\s)/)
  let buffer = ''

  for (const section of sections) {
    if ((buffer + section).length <= maxChars) {
      buffer += (buffer ? '\n' : '') + section
    } else {
      if (buffer) chunks.push(buffer)
      if (section.length <= maxChars) {
        buffer = section
      } else {
        // section too big — split by char window with overlap
        let i = 0
        while (i < section.length) {
          chunks.push(section.slice(i, i + maxChars))
          i += maxChars - overlapChars
        }
        buffer = ''
      }
    }
  }
  if (buffer) chunks.push(buffer)

  return chunks
}
