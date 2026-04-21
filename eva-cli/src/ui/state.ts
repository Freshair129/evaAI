import type { Session, PermissionMode } from '../types/session.js'
import type { BrainId } from '../types/brain.js'
import type { Intent } from '../types/intent.js'
import type { Hit } from '../types/memory.js'
import type { ConfirmPrompt } from '../orchestrator/permissions.js'

export type BrainActivity = 'idle' | 'thinking' | 'streaming' | 'done' | 'error'

export interface UiMessage {
  id: string
  role: 'user' | 'agent' | 'system' | 'tool'
  content: string
  tool?: string
  ts: string
}

export interface UiState {
  session: Session | null
  messages: UiMessage[]
  activity: Record<BrainId, BrainActivity>
  retrieved: Hit[]
  lastIntent: Intent | null
  pendingConfirm: { prompt: ConfirmPrompt; resolve: (ok: boolean) => void } | null
  isRunning: boolean
  error: string | null
  permissionMode: PermissionMode
}

export type UiAction =
  | { type: 'SET_SESSION'; session: Session }
  | { type: 'ADD_MESSAGE'; message: UiMessage }
  | { type: 'SET_BRAIN_ACTIVITY'; brain: BrainId; activity: BrainActivity }
  | { type: 'SET_RETRIEVED'; hits: Hit[] }
  | { type: 'SET_INTENT'; intent: Intent }
  | { type: 'START_RUN' }
  | { type: 'END_RUN' }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_CONFIRM'; prompt: ConfirmPrompt; resolve: (ok: boolean) => void }
  | { type: 'CLEAR_CONFIRM' }
  | { type: 'SET_PERMISSION_MODE'; mode: PermissionMode }
  | { type: 'CLEAR_MESSAGES' }

export function initialState(): UiState {
  return {
    session: null,
    messages: [],
    activity: { cortex: 'idle', motor: 'idle', limbic: 'idle' },
    retrieved: [],
    lastIntent: null,
    pendingConfirm: null,
    isRunning: false,
    error: null,
    permissionMode: 'confirm-each',
  }
}

export function reducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.session, permissionMode: action.session.permissions }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'SET_BRAIN_ACTIVITY':
      return {
        ...state,
        activity: { ...state.activity, [action.brain]: action.activity },
      }
    case 'SET_RETRIEVED':
      return { ...state, retrieved: action.hits }
    case 'SET_INTENT':
      return { ...state, lastIntent: action.intent }
    case 'START_RUN':
      return { ...state, isRunning: true, error: null }
    case 'END_RUN':
      return {
        ...state,
        isRunning: false,
        activity: { cortex: 'idle', motor: 'idle', limbic: 'idle' },
      }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'SET_CONFIRM':
      return { ...state, pendingConfirm: { prompt: action.prompt, resolve: action.resolve } }
    case 'CLEAR_CONFIRM':
      return { ...state, pendingConfirm: null }
    case 'SET_PERMISSION_MODE':
      return { ...state, permissionMode: action.mode }
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] }
    default:
      return state
  }
}
