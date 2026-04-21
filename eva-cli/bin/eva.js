#!/usr/bin/env node
/**
 * EVA Tri-Brain Agent — entrypoint
 *
 * Detects TTY and launches Ink TUI; otherwise falls back to line-based CLI.
 * Delegates to tsx at runtime so TS source is usable without pre-build.
 */

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const entry = resolve(projectRoot, 'src/entry.ts')

const args = process.argv.slice(2)

const child = spawn(
  process.execPath,
  [resolve(projectRoot, 'node_modules/tsx/dist/cli.mjs'), entry, ...args],
  {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  },
)

child.on('exit', (code) => process.exit(code ?? 0))
child.on('error', (err) => {
  console.error('Failed to start EVA:', err)
  process.exit(1)
})
