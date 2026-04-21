import React from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { theme } from '../theme.js'
import { useSession } from '../hooks/use-session.js'

export function ChatPanel(): React.ReactElement {
  const { state } = useSession()

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Text color={theme.colors.muted}>── Chat ──</Text>
      {state.messages.length === 0 && (
        <Text color={theme.colors.muted}>
          พิมพ์คำถามหรือคำสั่ง (เช่น "เขียน function X" หรือ "หา ADR เรื่อง Y")
        </Text>
      )}
      {state.messages.map((m) => (
        <MessageRow key={m.id} message={m} />
      ))}
      {state.isRunning && (
        <Box>
          <Text color={theme.colors.primary}>
            <Spinner type="dots" /> thinking...
          </Text>
        </Box>
      )}
      {state.error && <Text color={theme.colors.error}>error: {state.error}</Text>}
    </Box>
  )
}

function MessageRow({ message }: { message: ReturnType<typeof useSession>['state']['messages'][0] }): React.ReactElement {
  const label =
    message.role === 'user'
      ? theme.labels.user
      : message.role === 'agent'
        ? theme.labels.agent
        : message.role === 'tool'
          ? `tool:${message.tool ?? '?'}`
          : theme.labels.system

  const color =
    message.role === 'user'
      ? theme.colors.accent
      : message.role === 'agent'
        ? theme.colors.primary
        : theme.colors.muted

  return (
    <Box flexDirection="column" marginY={0}>
      <Text color={color} bold>
        {label}:
      </Text>
      <Box paddingLeft={2}>
        <Text color={message.role === 'tool' ? theme.colors.muted : theme.colors.text}>
          {message.content}
        </Text>
      </Box>
    </Box>
  )
}
