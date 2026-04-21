import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { z } from 'zod'
import type { Tool, ToolResult } from '../types.js'
import { hasRead } from './read-tracker.js'

const inputSchema = z.object({
  file_path: z.string(),
  old_string: z.string().min(1),
  new_string: z.string(),
  replace_all: z.boolean().default(false),
})

export type EditInput = z.infer<typeof inputSchema>

export interface EditOutput {
  path: string
  replacements: number
}

export const editTool: Tool<EditInput, EditOutput> = {
  name: 'Edit',
  description: 'Exact string replacement in file. old_string must be unique unless replace_all.',
  inputSchema,
  permission: 'confirm',
  sideEffect: 'write',

  async execute(input, ctx): Promise<ToolResult<EditOutput>> {
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

      if (!existsSync(full)) {
        return {
          status: 'fail',
          error: `File not found: ${full}`,
          latencyMs: Date.now() - start,
        }
      }
      if (!hasRead(ctx.sessionId, full)) {
        return {
          status: 'denied',
          error: `Must Read file before Edit: ${full}`,
          latencyMs: Date.now() - start,
        }
      }

      if (parsed.old_string === parsed.new_string) {
        return {
          status: 'fail',
          error: 'old_string and new_string are identical',
          latencyMs: Date.now() - start,
        }
      }

      const content = readFileSync(full, 'utf8')
      const occurrences = content.split(parsed.old_string).length - 1

      if (occurrences === 0) {
        return {
          status: 'fail',
          error: 'old_string not found in file',
          latencyMs: Date.now() - start,
        }
      }
      if (occurrences > 1 && !parsed.replace_all) {
        return {
          status: 'fail',
          error: `old_string matches ${occurrences} places — use replace_all or make unique`,
          latencyMs: Date.now() - start,
        }
      }

      const updated = parsed.replace_all
        ? content.split(parsed.old_string).join(parsed.new_string)
        : content.replace(parsed.old_string, parsed.new_string)

      writeFileSync(full, updated, 'utf8')

      return {
        status: 'success',
        data: {
          path: full,
          replacements: parsed.replace_all ? occurrences : 1,
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
