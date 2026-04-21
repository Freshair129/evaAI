import { spawn } from 'node:child_process'
import fg from 'fast-glob'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'
import type { Tool, ToolResult } from '../types.js'

const inputSchema = z.object({
  pattern: z.string().min(1),
  path: z.string().optional(),
  output_mode: z.enum(['content', 'files_with_matches', 'count']).default('files_with_matches'),
  glob: z.string().optional(),
  case_insensitive: z.boolean().default(false),
  head_limit: z.number().int().positive().default(100),
})

export type GrepInput = z.infer<typeof inputSchema>

export interface GrepOutput {
  mode: 'content' | 'files_with_matches' | 'count'
  results: string[]
  usedRipgrep: boolean
}

async function hasRipgrep(): Promise<boolean> {
  return new Promise((r) => {
    const p = spawn('rg', ['--version'])
    p.on('error', () => r(false))
    p.on('exit', (code) => r(code === 0))
  })
}

async function runRipgrep(input: GrepInput, cwd: string): Promise<string[]> {
  return new Promise((res, rej) => {
    const args: string[] = []
    if (input.output_mode === 'files_with_matches') args.push('-l')
    else if (input.output_mode === 'count') args.push('-c')
    else args.push('-n')
    if (input.case_insensitive) args.push('-i')
    if (input.glob) args.push('--glob', input.glob)
    args.push('--no-heading')
    args.push('--color=never')
    args.push('--max-count=1000')
    args.push(input.pattern)

    const p = spawn('rg', args, { cwd })
    let out = ''
    let err = ''
    p.stdout.on('data', (c) => (out += c.toString()))
    p.stderr.on('data', (c) => (err += c.toString()))
    p.on('error', rej)
    p.on('exit', (code) => {
      if (code === 0 || code === 1) {
        // 1 = no matches, still valid
        res(out.split('\n').filter(Boolean))
      } else {
        rej(new Error(`rg exit ${code}: ${err}`))
      }
    })
  })
}

async function runJsFallback(input: GrepInput, cwd: string): Promise<string[]> {
  const flags = input.case_insensitive ? 'im' : 'm'
  const regex = new RegExp(input.pattern, flags)
  const files = await fg(input.glob ?? '**/*', {
    cwd,
    absolute: true,
    onlyFiles: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    suppressErrors: true,
  })

  const out: string[] = []
  const fileHits = new Map<string, number>()

  for (const f of files) {
    let content: string
    try {
      content = readFileSync(f, 'utf8')
    } catch {
      continue
    }
    const lines = content.split('\n')
    let fileMatches = 0
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? ''
      if (regex.test(line)) {
        fileMatches += 1
        if (input.output_mode === 'content') {
          out.push(`${f}:${i + 1}:${line}`)
        }
      }
    }
    if (fileMatches > 0) fileHits.set(f, fileMatches)
  }

  if (input.output_mode === 'files_with_matches') return [...fileHits.keys()]
  if (input.output_mode === 'count') return [...fileHits].map(([p, n]) => `${p}:${n}`)
  return out
}

export const grepTool: Tool<GrepInput, GrepOutput> = {
  name: 'Grep',
  description: 'Search file contents with regex. Uses ripgrep if available, else JS fallback.',
  inputSchema,
  permission: 'auto',
  sideEffect: 'read',

  async execute(input): Promise<ToolResult<GrepOutput>> {
    const start = Date.now()
    try {
      const parsed = inputSchema.parse(input)
      const cwd = parsed.path ? resolve(parsed.path) : process.cwd()

      const useRg = await hasRipgrep()
      const raw = useRg ? await runRipgrep(parsed, cwd) : await runJsFallback(parsed, cwd)
      const trimmed = raw.slice(0, parsed.head_limit)

      return {
        status: 'success',
        data: {
          mode: parsed.output_mode,
          results: trimmed,
          usedRipgrep: useRg,
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
