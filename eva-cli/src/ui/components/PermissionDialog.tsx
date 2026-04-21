import React from 'react'
import { Box, Text, useInput } from 'ink'
import { theme } from '../theme.js'
import { useSession } from '../hooks/use-session.js'

export function PermissionDialog(): React.ReactElement | null {
  const { state, dispatch } = useSession()
  const pending = state.pendingConfirm

  useInput((input, key) => {
    if (!pending) return
    if (input === 'y' || input === 'Y' || key.return) {
      pending.resolve(true)
      dispatch({ type: 'CLEAR_CONFIRM' })
    } else if (input === 'n' || input === 'N' || key.escape) {
      pending.resolve(false)
      dispatch({ type: 'CLEAR_CONFIRM' })
    }
  })

  if (!pending) return null

  const argPreview = JSON.stringify(pending.prompt.args, null, 2)
  const preview = argPreview.length > 400 ? argPreview.slice(0, 400) + '...' : argPreview

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={theme.colors.warning}
      padding={1}
      marginY={1}
    >
      <Text color={theme.colors.warning} bold>
        ! Permission required
      </Text>
      <Text color={theme.colors.text}>
        Tool: <Text color={theme.colors.accent}>{pending.prompt.tool}</Text> (side-effect:{' '}
        {pending.prompt.sideEffect})
      </Text>
      <Text color={theme.colors.muted}>{pending.prompt.summary}</Text>
      <Box marginTop={1}>
        <Text color={theme.colors.muted}>{preview}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={theme.colors.accent}>[y] allow · [n] deny · [Esc] cancel</Text>
      </Box>
    </Box>
  )
}
