import readline from 'node:readline'
import { createSession, setStatus } from './orchestrator/session.js'
import { PermissionSystem } from './orchestrator/permissions.js'
import { AgentLoop, type LoopEvent } from './orchestrator/loop.js'
import type { PermissionMode } from './types/session.js'

export async function runCliFallback(permissionMode: PermissionMode = 'confirm-each'): Promise<void> {
  const session = createSession({ permissions: permissionMode })
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  })

  const confirm = async (prompt: {
    tool: string
    sideEffect: string
    summary: string
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      const q = `\n[confirm] ${prompt.tool} (${prompt.sideEffect}): ${prompt.summary}\n  allow? [y/N] `
      rl.question(q, (ans) => {
        resolve(ans.trim().toLowerCase().startsWith('y'))
      })
    })
  }

  const perms = new PermissionSystem(permissionMode, confirm)
  const sink = (event: LoopEvent) => {
    if (event.type === 'message') {
      process.stdout.write(`\nEVA: ${event.content}\n`)
    } else if (event.type === 'step_start' && event.step.kind === 'tool_call') {
      process.stdout.write(`  › ${event.step.tool}\n`)
    } else if (event.type === 'step_done' && event.step.kind === 'tool_call') {
      process.stdout.write(`    └ ${event.trace.status} (${event.trace.metrics.latencyMs}ms)\n`)
    } else if (event.type === 'error') {
      process.stderr.write(`  ! ${event.message}\n`)
    }
  }

  const loop = new AgentLoop({ session, permissions: perms, sink })

  process.stdout.write(`EVA Tri-Brain Agent (CLI mode) — session ${session.id}\n`)
  process.stdout.write('Type "exit" to quit.\n\n')

  const prompt = () =>
    new Promise<string>((resolve) => {
      rl.question('Boss: ', (ans) => resolve(ans))
    })

  try {
    while (true) {
      const input = (await prompt()).trim()
      if (!input) continue
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') break
      try {
        await loop.run(input)
      } catch (e) {
        process.stderr.write(`! ${e instanceof Error ? e.message : String(e)}\n`)
      }
    }
  } finally {
    await loop.end()
    setStatus(session, 'ended')
    rl.close()
  }
}
