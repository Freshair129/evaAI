import { z } from 'zod'
import type { Tool, ToolResult } from '../types.js'
import { getMemoryStore } from '../../memory/index.js'
import type { InboundResult } from '../../memory/inbound.js'

const inputSchema = z.object({
  kind: z.enum(['idea', 'concept', 'adr', 'flow', 'entity', 'feat', 'params']),
  id: z.string().min(1).describe('Target atomic ID, e.g. CONCEPT--XYZ'),
  content: z.string().min(10).describe('Full markdown including frontmatter'),
  reviewer: z.string().optional(),
  notes: z.string().optional(),
})

export type GksProposeInput = z.infer<typeof inputSchema>

export const gksProposeTool: Tool<GksProposeInput, InboundResult> = {
  name: 'GksPropose',
  description: 'Propose a new atomic note into the inbound review queue (never writes gks/ directly).',
  inputSchema,
  permission: 'confirm',
  sideEffect: 'write',

  async execute(input): Promise<ToolResult<InboundResult>> {
    const start = Date.now()
    try {
      const parsed = inputSchema.parse(input)
      const expectedPrefix = parsed.kind.toUpperCase() + '--'
      if (
        parsed.kind !== 'idea' &&
        parsed.kind !== 'feat' &&
        !parsed.id.toUpperCase().startsWith(expectedPrefix)
      ) {
        return {
          status: 'fail',
          error: `ID prefix mismatch: expected ${expectedPrefix}, got ${parsed.id}`,
          latencyMs: Date.now() - start,
        }
      }

      const result = getMemoryStore().proposeInbound({
        kind: parsed.kind,
        id: parsed.id,
        content: parsed.content,
        ...(parsed.reviewer !== undefined && { reviewer: parsed.reviewer }),
        ...(parsed.notes !== undefined && { notes: parsed.notes }),
      })
      return { status: 'success', data: result, latencyMs: Date.now() - start }
    } catch (e) {
      return {
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
        latencyMs: Date.now() - start,
      }
    }
  },
}
