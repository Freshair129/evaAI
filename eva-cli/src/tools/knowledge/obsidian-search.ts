import { z } from 'zod'
import type { Tool, ToolResult } from '../types.js'
import { getObsidianClient } from '../../memory/obsidian-mcp.js'
import type { Hit } from '../../types/memory.js'

const inputSchema = z.object({
  query: z.string().min(1),
  top_k: z.number().int().positive().max(50).default(5),
})

export type ObsidianSearchInput = z.infer<typeof inputSchema>

export interface ObsidianSearchOutput {
  hits: Hit[]
  connected: boolean
}

export const obsidianSearchTool: Tool<ObsidianSearchInput, ObsidianSearchOutput> = {
  name: 'ObsidianSearch',
  description: 'Search Obsidian vault via MCP server (graceful degrade if unavailable).',
  inputSchema,
  permission: 'auto',
  sideEffect: 'network',

  async execute(input): Promise<ToolResult<ObsidianSearchOutput>> {
    const start = Date.now()
    try {
      const parsed = inputSchema.parse(input)
      const client = getObsidianClient()
      const hits = await client.search(parsed.query, parsed.top_k)
      return {
        status: 'success',
        data: { hits, connected: client.isConnected() },
        latencyMs: Date.now() - start,
      }
    } catch (e) {
      return {
        status: 'fail',
        error: e instanceof Error ? e.message : String(e),
        data: { hits: [], connected: false },
        latencyMs: Date.now() - start,
      }
    }
  },
}
