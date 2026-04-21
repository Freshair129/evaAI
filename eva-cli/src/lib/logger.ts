import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Logger } from '../types/tool.js'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

export interface LoggerOptions {
  minLevel?: LogLevel
  file?: string
  sessionId?: string
  context?: string
}

export function createLogger(opts: LoggerOptions = {}): Logger {
  const minLevel = opts.minLevel ?? (process.env.EVA_LOG_LEVEL as LogLevel) ?? 'info'
  const threshold = LEVEL_ORDER[minLevel] ?? 1

  function write(level: LogLevel, msg: string, meta?: unknown) {
    if (LEVEL_ORDER[level] < threshold) return
    const entry = {
      ts: new Date().toISOString(),
      level,
      ctx: opts.context,
      sessionId: opts.sessionId,
      msg,
      meta,
    }
    if (opts.file) {
      mkdirSync(dirname(opts.file), { recursive: true })
      appendFileSync(opts.file, JSON.stringify(entry) + '\n')
    } else if (level === 'error' || level === 'warn') {
      process.stderr.write(JSON.stringify(entry) + '\n')
    }
  }

  return {
    debug: (m, meta) => write('debug', m, meta),
    info: (m, meta) => write('info', m, meta),
    warn: (m, meta) => write('warn', m, meta),
    error: (m, meta) => write('error', m, meta),
  }
}

export const rootLogger = createLogger({ context: 'eva' })
