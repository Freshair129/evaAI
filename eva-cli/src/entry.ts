import React from 'react'
import { render } from 'ink'
import { App } from './ui/app.js'
import { runCliFallback } from './cli-fallback.js'
import { wantsTUI, parsePermissionMode } from './lib/tty-detect.js'
import { loadConfig } from './config/index.js'
import { startConnectors } from './connectors/index.js'

async function main(): Promise<void> {
  const cfg = loadConfig()
  const argv = process.argv.slice(2)

  // ── serve mode (background connectors) ─────────────────
  if (argv[0] === 'serve') {
    const wantLine = argv.includes('--line')
    const wantTelegram = argv.includes('--telegram')
    const neither = !wantLine && !wantTelegram
    const portIdx = argv.indexOf('--port')
    const rawPort = portIdx !== -1 ? argv[portIdx + 1] : undefined
    const port = rawPort ? Number(rawPort) : undefined

    const runtime = await startConnectors({
      ...(neither ? {} : { line: wantLine, telegram: wantTelegram }),
      ...(port !== undefined && { port }),
    })

    process.stdout.write(
      `EVA serve mode — ${runtime.connectors.map((c) => c.platform).join(', ')} active\n`,
    )
    process.stdout.write('Press Ctrl+C to stop\n')

    const shutdown = async () => {
      process.stdout.write('\nShutting down connectors...\n')
      await runtime.stop()
      process.exit(0)
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    await new Promise<void>(() => {
      // keep alive until SIGINT
    })
    return
  }

  // ── interactive modes ──────────────────────────────────
  const explicit = parsePermissionMode()
  const mode = explicit ?? cfg.permissions.default_mode

  if (wantsTUI()) {
    const { waitUntilExit } = render(
      React.createElement(App, { initialPermissionMode: mode }),
    )
    await waitUntilExit()
  } else {
    await runCliFallback(mode)
  }
}

main().catch((err) => {
  process.stderr.write(
    `EVA fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`,
  )
  process.exit(1)
})
