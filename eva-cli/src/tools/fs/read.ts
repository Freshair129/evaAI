import { readFileSync, statSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { z } from 'zod'
import fg from 'fast-glob'
import type { Tool, ToolResult } from '../types.js'
import { loadConfig } from '../../config/index.js'
import { markRead } from './read-tracker.js'

const inputSchema = z.object({
  file_path: z.string().describe('Absolute path to file'),
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().optional(),
})

export type ReadInput = z.infer<typeof inputSchema>

export interface ReadOutput {
  path: string
  content: string
  totalLines: number
  truncated: boolean
}

function isForbidden(path: string): boolean {
  const cfg = loadConfig()
  const patterns = cfg.permissions.read_forbidden_paths
  for (const pat of patterns) {
    if (fg.sync(pat, { dot: true, absolute: true }).includes(path)) return true
    if (pat.includes('**/') && path.includes(pat.replace('**/', '').replace('*', ''))) return true
  }
  return false
}

export const readTool: Tool<ReadInput, ReadOutput> = {
  name: 'Read',
  description: 'Read a file from workspace. Returns content with line numbers.',
  inputSchema,
  permission: 'auto',
  sideEffect: 'read',

  async execute(input, ctx): Promise<ToolResult<ReadOutput>> {
    const start = Date.now()
    try {
      const parsed = inputSchema.parse(input)
      if (!isAbsolute(parsed.file_path)) {
        return {
          status: 'fail',
          error: `file_path must be absolute, got: ${parsed.file_path}`,
          latencyMs: Date.now() - start,
        }
      }
      const full = resolve(parsed.file_path)

      if (isForbidden(full)) {
        return {
          status: 'denied',
          error: `Path matches forbidden pattern: ${full}`,
          latencyMs: Date.now() - start,
        }
      }

      const stat = statSync(full)
      if (!stat.isFile()) {
        return {
          status: 'fail',
          error: `Not a file: ${full}`,
          latencyMs: Date.now() - start,
        }
      }

      const raw = readFileSync(full, 'utf8')
      const lines = raw.split('\n')
      const offset = parsed.offset ?? 0
      const limit = parsed.limit ?? 2000
      const slice = lines.slice(offset, offset + limit)
      const numbered = slice
        .map((l, i) => `${String(offset + i + 1).padStart(6, ' ')}\t${l}`)
        .join('\n')

      markRead(ctx.sessionId, full)

      return {
        status: 'success',
        data: {
          path: full,
          content: numbered,
          totalLines: lines.length,
          truncated: offset + limit < lines.length,
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
