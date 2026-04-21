export const theme = {
  colors: {
    primary: 'cyan',
    secondary: 'magenta',
    accent: 'yellow',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    muted: 'gray',
    text: 'white',
    bgPanel: 'blackBright',
  },
  labels: {
    user: 'Boss',
    agent: 'EVA',
    system: 'SYS',
  },
  brainColors: {
    cortex: 'magenta',
    motor: 'cyan',
    limbic: 'yellow',
  } as const,
  symbols: {
    bullet: '●',
    arrow: '➜',
    spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    check: '✓',
    cross: '✗',
    warn: '!',
  },
}

export type Theme = typeof theme
