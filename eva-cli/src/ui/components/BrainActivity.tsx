import React from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { theme } from '../theme.js'
import { useSession } from '../hooks/use-session.js'
import type { BrainId } from '../../types/brain.js'

const BRAIN_LABELS: Record<BrainId, string> = {
  cortex: 'CORTEX',
  motor: 'MOTOR',
  limbic: 'LIMBIC',
}

export function BrainActivity(): React.ReactElement {
  const { state } = useSession()
  return (
    <Box flexDirection="column">
      <Text color={theme.colors.muted}>── Brains ──</Text>
      {(Object.keys(state.activity) as BrainId[]).map((b) => {
        const activity = state.activity[b]
        const color = theme.brainColors[b]
        const isBusy = activity === 'thinking' || activity === 'streaming'
        return (
          <Box key={b}>
            <Box width={10}>
              <Text color={color}>
                {theme.symbols.bullet} {BRAIN_LABELS[b]}
              </Text>
            </Box>
            <Box>
              {isBusy ? (
                <Text color={theme.colors.accent}>
                  <Spinner type="dots" /> {activity}
                </Text>
              ) : (
                <Text color={activity === 'error' ? theme.colors.error : theme.colors.muted}>
                  {activity}
                </Text>
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
