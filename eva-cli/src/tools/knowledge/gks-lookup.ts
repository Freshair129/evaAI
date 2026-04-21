import { z } from 'zod'
import type { Tool, ToolResult } from '../types.js'
import { getMemoryStore } from '../../memory/index.js'
import type { AtomicNote } from '../../types/memory.js'

const inputSchema = z.object({
  id: z.string().min(1).describe('Atomic ID (e.g., CONCEPT--EVA-TRI-BRAIN)'),
})

export type GksLookupInput = z.infer<typeof inputSchema>

export const gksLookupTool: Tool<GksLookupInput, AtomicNote> = {
  name: 'GksLookup',
  description: 'Fetch a single atomic note by exact ID.',
  inputSchema,
  permission: 'auto',
  sideEffect: 'read',

  async execute(input): Promise<ToolResult<AtomicNote>> {
    const start = Date.now()
    try {
      const parsed = inputSchema.parse(input)
      const note = getMemoryStore().lookup(parsed.id)
      if (!note) {
        return {
          status: 'fail',
          error: `Atomic not found: ${parsed.id}`,
          latencyMs: Date.now() - start,
        }
      }
      return { status: 'success', data: note, latencyMs: Date.now() - start }
    } catch (e) {
      return {
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
        latencyMs: Date.now() - start,
      }
    }
  },
}
