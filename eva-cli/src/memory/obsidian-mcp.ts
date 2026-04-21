import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { Hit } from '../types/memory.js'

export interface ObsidianConfig {
  command?: string
  args?: string[]
  env?: Record<string, string>
}

interface McpTextContent {
  type: 'text'
  text: string
}
interface McpToolResult {
  content?: McpTextContent[]
  isError?: boolean
}

export class ObsidianMcpClient {
  private client: Client | null = null
  private transport: StdioClientTransport | null = null
  private connecting: Promise<void> | null = null

  constructor(private cfg: ObsidianConfig = {}) {}

  private async connect(): Promise<void> {
    if (this.client) return
    if (this.connecting) return this.connecting

    this.connecting = (async () => {
      const transport = new StdioClientTransport({
        command: this.cfg.command ?? 'npx',
        args: this.cfg.args ?? ['-y', '@obsidian-community/mcp-server'],
        env: { ...process.env, ...this.cfg.env } as Record<string, string>,
      })
      const client = new Client(
        { name: 'eva-agent', version: '2.0.0-alpha' },
        { capabilities: {} },
      )
      await client.connect(transport)
      this.client = client
      this.transport = transport
    })()

    try {
      await this.connecting
    } finally {
      this.connecting = null
    }
  }

  async search(query: string, topK = 5): Promise<Hit[]> {
    try {
      await this.connect()
    } catch {
      return []
    }
    if (!this.client) return []

    try {
      const result = (await this.client.callTool({
        name: 'search',
        arguments: { query, limit: topK },
      })) as McpToolResult

      if (result.isError || !result.content) return []

      const text = result.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n')

      return parseSearchResults(text, topK)
    } catch {
      return []
    }
  }

  async readNote(path: string): Promise<string | null> {
    try {
      await this.connect()
    } catch {
      return null
    }
    if (!this.client) return null

    try {
      const result = (await this.client.callTool({
        name: 'read_note',
        arguments: { path },
      })) as McpToolResult
      if (result.isError || !result.content) return null
      return result.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
    } catch {
      return null
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close().catch(() => {})
      this.client = null
    }
    if (this.transport) {
      await this.transport.close().catch(() => {})
      this.transport = null
    }
  }

  isConnected(): boolean {
    return this.client !== null
  }
}

function parseSearchResults(text: string, limit: number): Hit[] {
  // MCP servers return free-form markdown — best-effort parse of "- path: ...\n  score: ..." blocks
  const hits: Hit[] = []
  const blocks = text.split(/\n---\n|\n\n(?=[*-]\s)/)

  for (const block of blocks) {
    const pathMatch = block.match(/path:\s*(.+)/i) ?? block.match(/\[\[(.+?)\]\]/)
    if (!pathMatch) continue
    const path = pathMatch[1]?.trim()
    if (!path) continue

    const scoreMatch = block.match(/score:\s*([\d.]+)/i)
    const score = scoreMatch ? Number(scoreMatch[1]) : 0.5

    hits.push({
      source: 'obsidian',
      id: path,
      path,
      score,
      snippet: block.slice(0, 300),
    })

    if (hits.length >= limit) break
  }

  return hits
}

let singleton: ObsidianMcpClient | null = null
export function getObsidianClient(cfg: ObsidianConfig = {}): ObsidianMcpClient {
  if (!singleton) singleton = new ObsidianMcpClient(cfg)
  return singleton
}
