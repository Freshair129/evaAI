import React from 'react'
import { render } from 'ink'
import { App } from './ui/app.js'
import { runCliFallback } from './cli-fallback.js'
import { wantsTUI, parsePermissionMode } from './lib/tty-detect.js'
import { loadConfig } from './config/index.js'

async function main(): Promise<void> {
  const cfg = loadConfig()
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
  process.stderr.write(`EVA fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`)
  process.exit(1)
})
