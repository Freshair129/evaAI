import React, { useCallback, useEffect, useMemo, useReducer, useRef, type Dispatch } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { theme } from './theme.js'
import { initialState, reducer, type UiAction, type UiMessage } from './state.js'
import { SessionContext, type SessionContextValue } from './hooks/use-session.js'
import { ChatPanel } from './components/ChatPanel.js'
import { ContextPanel } from './components/ContextPanel.js'
import { InputBar } from './components/InputBar.js'
import { PermissionDialog } from './components/PermissionDialog.js'
import { createSession, setStatus } from '../orchestrator/session.js'
import { PermissionSystem } from '../orchestrator/permissions.js'
import { AgentLoop, type LoopEvent } from '../orchestrator/loop.js'
import type { PermissionMode } from '../types/session.js'

export interface AppProps {
  initialPermissionMode?: PermissionMode
}

export function App({ initialPermissionMode = 'confirm-each' }: AppProps): React.ReactElement {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const { exit } = useApp()
  const sessionRef = useRef(createSession({ permissions: initialPermissionMode }))
  const loopRef = useRef<AgentLoop | null>(null)

  const permissionSystem = useMemo(
    () =>
      new PermissionSystem(initialPermissionMode, (prompt) => {
        return new Promise<boolean>((resolve) => {
          dispatch({ type: 'SET_CONFIRM', prompt, resolve })
        })
      }),
    [initialPermissionMode],
  )

  useEffect(() => {
    dispatch({ type: 'SET_SESSION', session: sessionRef.current })
  }, [])

  const submitInput = useCallback(
    async (text: string) => {
      if (text.toLowerCase() === 'exit' || text.toLowerCase() === 'quit') {
        await endSession()
        exit()
        return
      }

      dispatch({
        type: 'ADD_MESSAGE',
        message: makeMessage('user', text),
      })
      dispatch({ type: 'START_RUN' })

      const sink = (event: LoopEvent) => handleLoopEvent(event, dispatch as Dispatch<UiAction>)
      if (!loopRef.current) {
        loopRef.current = new AgentLoop({
          session: sessionRef.current,
          permissions: permissionSystem,
          sink,
        })
      }

      try {
        await loopRef.current.run(text)
      } catch (e) {
        dispatch({
          type: 'SET_ERROR',
          error: e instanceof Error ? e.message : String(e),
        })
      } finally {
        dispatch({ type: 'END_RUN' })
      }
    },
    [exit, permissionSystem],
  )

  const endSession = useCallback(async () => {
    try {
      if (loopRef.current) await loopRef.current.end()
      else setStatus(sessionRef.current, 'ended')
    } catch {
      // best-effort cleanup
    }
  }, [])

  useInput((input, key) => {
    if (key.ctrl && input === 'p') {
      const next: PermissionMode =
        state.permissionMode === 'auto'
          ? 'confirm-each'
          : state.permissionMode === 'confirm-each'
            ? 'plan-only'
            : 'auto'
      permissionSystem.setMode(next)
      dispatch({ type: 'SET_PERMISSION_MODE', mode: next })
    } else if (key.ctrl && input === 'l') {
      dispatch({ type: 'CLEAR_MESSAGES' })
    }
  })

  const ctxValue: SessionContextValue = {
    state,
    dispatch,
    submitInput,
    endSession,
  }

  return (
    <SessionContext.Provider value={ctxValue}>
      <Box flexDirection="column">
        <Box
          borderStyle="round"
          borderColor={theme.colors.primary}
          paddingX={1}
          justifyContent="space-between"
        >
          <Text color={theme.colors.primary} bold>
            EVA Tri-Brain Agent
          </Text>
          <Text color={theme.colors.muted}>v2.0.0-alpha</Text>
        </Box>
        <Box flexDirection="row" minHeight={10}>
          <ChatPanel />
          <ContextPanel />
        </Box>
        <PermissionDialog />
        <InputBar />
        <Box paddingX={1}>
          <Text color={theme.colors.muted}>
            Ctrl+P: permission mode · Ctrl+L: clear chat · type "exit" to quit
          </Text>
        </Box>
      </Box>
    </SessionContext.Provider>
  )
}

function makeMessage(role: UiMessage['role'], content: string, tool?: string): UiMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ...(tool !== undefined && { tool }),
    ts: new Date().toISOString(),
  }
}

function handleLoopEvent(event: LoopEvent, dispatch: Dispatch<UiAction>): void {
  switch (event.type) {
    case 'intent':
      dispatch({ type: 'SET_INTENT', intent: event.intent })
      break
    case 'retrieval':
      dispatch({ type: 'SET_RETRIEVED', hits: event.hits })
      break
    case 'brain_chunk':
      if (event.chunk.type === 'text') {
        dispatch({
          type: 'SET_BRAIN_ACTIVITY',
          brain: event.brain as 'cortex' | 'motor' | 'limbic',
          activity: 'streaming',
        })
      } else if (event.chunk.type === 'done') {
        dispatch({
          type: 'SET_BRAIN_ACTIVITY',
          brain: event.brain as 'cortex' | 'motor' | 'limbic',
          activity: 'done',
        })
      }
      break
    case 'step_start':
      if (event.step.kind === 'tool_call') {
        dispatch({
          type: 'ADD_MESSAGE',
          message: {
            id: `${Date.now()}-step-${event.step.id}`,
            role: 'tool',
            content: `running ${event.step.tool}`,
            tool: event.step.tool,
            ts: new Date().toISOString(),
          },
        })
      }
      break
    case 'step_done':
      if (event.step.kind === 'tool_call') {
        dispatch({
          type: 'ADD_MESSAGE',
          message: {
            id: `${Date.now()}-step-done-${event.step.id}`,
            role: 'tool',
            content: `${event.step.tool}: ${event.trace.status} (${event.trace.metrics.latencyMs}ms)`,
            tool: event.step.tool,
            ts: new Date().toISOString(),
          },
        })
      }
      break
    case 'message':
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: `${Date.now()}-msg`,
          role: 'agent',
          content: event.content,
          ts: new Date().toISOString(),
        },
      })
      break
    case 'error':
      dispatch({ type: 'SET_ERROR', error: event.message })
      break
    default:
      break
  }
}
