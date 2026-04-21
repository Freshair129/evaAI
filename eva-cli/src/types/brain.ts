export type BrainId = 'cortex' | 'motor' | 'limbic'

export type Capability =
  | 'reasoning'
  | 'planning'
  | 'tool_use'
  | 'long_context'
  | 'code_gen'
  | 'code_edit'
  | 'sql_gen'
  | 'unit_test_gen'
  | 'thai_nlu'
  | 'intent_extraction'
  | 'stylize_thai'

export interface ModelSpec {
  id: string
  provider: 'anthropic' | 'google' | 'ollama' | 'thaillm' | 'openai'
  model: string
  envKey?: string
  endpoint?: string
  maxTokensDefault?: number
  contextWindow?: number
  thinkingEnabled?: boolean
  supports: Capability[]
}

export interface Cost {
  estimatedUsd: number
  estimatedTokens: number
}

export interface ToolDescriptor {
  name: string
  description: string
  inputSchema: unknown
}

export interface BrainInput {
  system: string
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  tools?: ToolDescriptor[]
  stream?: boolean
  maxTokens?: number
  temperature?: number
  signal?: AbortSignal
}

export type BrainChunk =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; name: string; args: unknown; callId: string }
  | { type: 'done'; stopReason: 'end_turn' | 'max_tokens' | 'tool_use' | 'abort' }

export interface BrainAdapter {
  readonly id: BrainId
  readonly modelSpec: ModelSpec

  invoke(input: BrainInput): AsyncIterable<BrainChunk>
  estimateCost(input: BrainInput): Cost
}
