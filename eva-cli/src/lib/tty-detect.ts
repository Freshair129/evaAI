export function isInteractiveTTY(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY)
}

export function wantsTUI(argv: string[] = process.argv): boolean {
  if (argv.includes('--no-tui')) return false
  if (argv.includes('--tui')) return true
  if (process.env.EVA_NO_TUI === '1') return false
  return isInteractiveTTY()
}

export function parsePermissionMode(argv: string[] = process.argv): 'auto' | 'confirm-each' | 'plan-only' | null {
  const idx = argv.indexOf('--permission')
  if (idx !== -1 && argv[idx + 1]) {
    const val = argv[idx + 1]
    if (val === 'auto' || val === 'confirm-each' || val === 'plan-only') return val
  }
  if (argv.includes('--auto')) return 'auto'
  if (argv.includes('--plan')) return 'plan-only'
  return null
}
