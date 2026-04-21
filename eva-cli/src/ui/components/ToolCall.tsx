import React from 'react'
import { Box, Text } from 'ink'
import { theme } from '../theme.js'

export interface ToolCallDisplay {
  tool: string
  status: 'running' | 'success' | 'fail' | 'denied' | 'error'
  summary?: string
}

export function ToolCall({ tool, status, summary }: ToolCallDisplay): React.ReactElement {
  const color =
    status === 'success'
      ? theme.colors.success
      : status === 'denied'
        ? theme.colors.warning
        : status === 'running'
          ? theme.colors.primary
          : theme.colors.error

  const symbol =
    status === 'success'
      ? theme.symbols.check
      : status === 'running'
        ? theme.symbols.arrow
        : status === 'denied'
          ? theme.symbols.warn
          : theme.symbols.cross

  return (
    <Box>
      <Text color={color}>
        {symbol} [{tool}]
      </Text>
      {summary && (
        <Box marginLeft={1}>
          <Text color={theme.colors.muted}>{summary}</Text>
        </Box>
      )}
    </Box>
  )
}
