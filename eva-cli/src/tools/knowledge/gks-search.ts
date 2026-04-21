import { z } from 'zod'
import type { Tool, ToolResult } from '../types.js'
import { getMemoryStore } from '../../memory/index.js'
import type { Hit } from '../../types/memory.js'

const inputSchema = z.object({
  query: z.string().min(1),
  phase: z.number().int().min(0).max(6).optional(),
  type: z.enum(['concept', 'adr', 'flow', 'entity', 'feat', 'frame', 'blueprint', 'params']).optional(),
  top_k: z.number().int().positive().max(50).default(5),
})

export type GksSearchInput = z.infer<typeof inputSchema>

export interface GksSearchOutput {
  hits: Hit[]
  totalScanned: number
  latencyMs: number
}

export const gksSearchTool: Tool<GksSearchInput, GksSearchOutput> = {
  name: 'GksSearch',
  description: 'Semantic + substring search across GKS atomic notes.',
  inputSchema,
  permission: 'auto',
  sideEffect: 'read',

  async execute(input): Promise<ToolResult<GksSearchOutput>> {
    const start = Date.now()
    try {
      const parsed = inputSchema.parse(input)
      const store = getMemoryStore()
      const result = await store.retrieve({
        text: parsed.query,
        sources: ['atomic', 'vector'],
        topK: parsed.top_k,
        filter: {
          ...(parsed.phase !== undefined && { phase: parsed.phase }),
          ...(parsed.type !== undefined && { type: parsed.type }),
        },
      })
      return {
        status: 'success',
        data: {
          hits: result.hits,
          totalScanned: result.totalScanned,
          latencyMs: result.latencyMs,
        },
        latencyMs: Date.now() - start,
      }
    } catch (e) {
      return {
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
        latencyMs: Date.now() - start,
      }
    }
  },
}
