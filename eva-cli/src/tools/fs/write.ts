import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { z } from 'zod'
import type { Tool, ToolResult } from '../types.js'
import { hasRead } from './read-tracker.js'

const inputSchema = z.object({
  file_path: z.string(),
  content: z.string(),
})

export type WriteInput = z.infer<typeof inputSchema>

export interface WriteOutput {
  path: string
  bytesWritten: number
  created: boolean
}

export const writeTool: Tool<WriteInput, WriteOutput> = {
  name: 'Write',
  description: 'Create or overwrite a file. Requires prior Read when file exists.',
  inputSchema,
  permission: 'confirm',
  sideEffect: 'write',

  async execute(input, ctx): Promise<ToolResult<WriteOutput>> {
    const start = Date.now()
    try {
      const parsed = inputSchema.parse(input)
      if (!isAbsolute(parsed.file_path)) {
        return {
          status: 'fail',
          error: `file_path must be absolute: ${parsed.file_path}`,
          latencyMs: Date.now() - start,
        }
      }
      const full = resolve(parsed.file_path)
      const created = !existsSync(full)

      if (!created && !hasRead(ctx.sessionId, full)) {
        return {
          status: 'denied',
          error: `Must Read existing file before Write: ${full}`,
          latencyMs: Date.now() - start,
        }
      }

      mkdirSync(dirname(full), { recursive: true })
      writeFileSync(full, parsed.content, 'utf8')

      return {
        status: 'success',
        data: {
          path: full,
          bytesWritten: Buffer.byteLength(parsed.content, 'utf8'),
          created,
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
