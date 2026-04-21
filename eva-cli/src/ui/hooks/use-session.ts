import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'
import type { UiAction, UiState } from '../state.js'

export interface SessionContextValue {
  state: UiState
  dispatch: Dispatch<UiAction>
  submitInput: (text: string) => Promise<void>
  endSession: () => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
