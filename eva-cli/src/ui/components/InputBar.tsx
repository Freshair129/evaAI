import React, { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { theme } from '../theme.js'
import { useSession } from '../hooks/use-session.js'

export function InputBar(): React.ReactElement {
  const { state, submitInput } = useSession()
  const [value, setValue] = useState('')

  const onSubmit = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || state.isRunning) return
    setValue('')
    void submitInput(trimmed)
  }

  return (
    <Box borderStyle="single" borderColor={theme.colors.primary} paddingX={1}>
      <Text color={theme.colors.primary}>
        {theme.symbols.arrow}{' '}
      </Text>
      {state.pendingConfirm ? (
        <Text color={theme.colors.muted}>(awaiting permission response)</Text>
      ) : (
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={onSubmit}
          placeholder="พิมพ์ที่นี่... (exit เพื่อออก)"
        />
      )}
    </Box>
  )
}
