import fg from 'fast-glob'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'
import type { Tool, ToolResult } from '../types.js'

const inputSchema = z.object({
  pattern: z.string(),
  path: z.string().optional(),
})

export type GlobInput = z.infer<typeof inputSchema>

export interface GlobOutput {
  matches: string[]
  count: number
  truncated: boolean
}

export const globTool: Tool<GlobInput, GlobOutput> = {
  name: 'Glob',
  description: 'Find files by glob pattern. Sorted by mtime desc.',
  inputSchema,
  permission: 'auto',
  sideEffect: 'read',

  async execute(input): Promise<ToolResult<GlobOutput>> {
    const start = Date.now()
    try {
      const parsed = inputSchema.parse(input)
      const cwd = parsed.path ? resolve(parsed.path) : process.cwd()

      const matches = await fg(parsed.pattern, {
        cwd,
        absolute: true,
        onlyFiles: true,
        dot: false,
        suppressErrors: true,
      })

      const withStats = matches
        .map((p) => {
          try {
            return { path: p, mtime: statSync(p).mtimeMs }
          } catch {
            return null
          }
        })
        .filter((x): x is { path: string; mtime: number } => x !== null)
        .sort((a, b) => b.mtime - a.mtime)

      const limit = 200
      const truncated = withStats.length > limit

      return {
        status: 'success',
        data: {
          matches: withStats.slice(0, limit).map((x) => x.path),
          count: withStats.length,
          truncated,
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
