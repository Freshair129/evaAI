import { spawn } from 'node:child_process'
import { z } from 'zod'
import type { Tool, ToolResult } from './types.js'
import { loadConfig } from '../config/index.js'

const inputSchema = z.object({
  command: z.string().min(1),
  timeout: z.number().int().positive().max(600_000).default(120_000),
  cwd: z.string().optional(),
})

export type BashInput = z.infer<typeof inputSchema>

export interface BashOutput {
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
}

export function checkBlocklist(command: string): string | null {
  const cfg = loadConfig()
  for (const { pattern } of cfg.permissions.forbidden) {
    try {
      const re = new RegExp(pattern)
      if (re.test(command)) return pattern
    } catch {
      // plain substring match if regex is invalid
      if (command.includes(pattern)) return pattern
    }
  }
  return null
}

export const bashTool: Tool<BashInput, BashOutput> = {
  name: 'Bash',
  description: 'Execute shell command with timeout and blocklist protection.',
  inputSchema,
  permission: 'confirm',
  sideEffect: 'exec',

  async execute(input, ctx): Promise<ToolResult<BashOutput>> {
    const start = Date.now()
    try {
      const parsed = inputSchema.parse(input)
      const blocked = checkBlocklist(parsed.command)
      if (blocked) {
        return {
          status: 'denied',
          error: `Command matches blocklist: ${blocked}`,
          latencyMs: Date.now() - start,
        }
      }

      const proc = spawn('bash', ['-c', parsed.command], {
        cwd: parsed.cwd ?? ctx.cwd,
        env: process.env,
      })

      let stdout = ''
      let stderr = ''
      let timedOut = false

      const timer = setTimeout(() => {
        timedOut = true
        proc.kill('SIGTERM')
        setTimeout(() => proc.kill('SIGKILL'), 2000)
      }, parsed.timeout)

      if (ctx.signal) {
        ctx.signal.addEventListener('abort', () => {
          proc.kill('SIGTERM')
        })
      }

      proc.stdout.on('data', (c: Buffer) => {
        stdout += c.toString()
      })
      proc.stderr.on('data', (c: Buffer) => {
        stderr += c.toString()
      })

      const exitCode = await new Promise<number>((res) => {
        proc.on('close', (code) => res(code ?? -1))
        proc.on('error', () => res(-1))
      })

      clearTimeout(timer)

      const MAX_BUF = 100_000
      return {
        status: exitCode === 0 ? 'success' : 'fail',
        data: {
          stdout: stdout.length > MAX_BUF ? stdout.slice(0, MAX_BUF) + '\n...[truncated]' : stdout,
          stderr: stderr.length > MAX_BUF ? stderr.slice(0, MAX_BUF) + '\n...[truncated]' : stderr,
          exitCode,
          timedOut,
        },
        ...(exitCode !== 0 && {
          error: timedOut
            ? `Timed out after ${parsed.timeout}ms`
            : `Exit ${exitCode}${stderr ? ': ' + stderr.slice(0, 200) : ''}`,
        }),
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
