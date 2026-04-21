import React from 'react'
import { Box, Text } from 'ink'
import { theme } from '../theme.js'
import { useSession } from '../hooks/use-session.js'
import { BrainActivity } from './BrainActivity.js'

export function ContextPanel(): React.ReactElement {
  const { state } = useSession()
  return (
    <Box flexDirection="column" width={42} paddingX={1}>
      <Text color={theme.colors.muted}>── Session ──</Text>
      {state.session && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.colors.muted}>id: {state.session.id}</Text>
          <Text color={theme.colors.muted}>
            mode: <Text color={theme.colors.accent}>{state.permissionMode}</Text>
          </Text>
          <Text color={theme.colors.muted}>
            tokens: {state.session.stats.tokensIn + state.session.stats.tokensOut} · cost: $
            {state.session.stats.costUsd.toFixed(4)}
          </Text>
          <Text color={theme.colors.muted}>tool calls: {state.session.stats.toolCalls}</Text>
        </Box>
      )}

      {state.lastIntent && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.colors.muted}>── Intent ──</Text>
          <Text color={theme.colors.accent}>
            task: {state.lastIntent.taskType} ({state.lastIntent.urgency})
          </Text>
          <Text color={theme.colors.muted}>
            emotion: {state.lastIntent.emotion} · conf {state.lastIntent.confidence.toFixed(2)}
          </Text>
        </Box>
      )}

      {state.retrieved.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.colors.muted}>── Retrieved ──</Text>
          {state.retrieved.slice(0, 5).map((hit, i) => (
            <Box key={`${hit.id}-${i}`}>
              <Text color={theme.colors.primary}>
                [{hit.source}] {hit.id.slice(0, 30)}
              </Text>
              <Text color={theme.colors.muted}> {hit.score.toFixed(2)}</Text>
            </Box>
          ))}
        </Box>
      )}

      <BrainActivity />
    </Box>
  )
}
