export type TaskType =
  | 'chat_casual'
  | 'chat_thai_complex'
  | 'plan_architecture'
  | 'code_generate'
  | 'code_edit'
  | 'code_review'
  | 'sql_gen'
  | 'analyze_log'
  | 'knowledge_recall'
  | 'knowledge_search'
  | 'doc_write'
  | 'write_adr'

export type Urgency = 'low' | 'normal' | 'high' | 'critical'

export type Emotion = 'neutral' | 'happy' | 'frustrated' | 'urgent' | 'curious' | 'uncertain'

export interface IntentEntity {
  kind: string
  value: string
}

export interface Intent {
  taskType: TaskType
  urgency: Urgency
  emotion: Emotion
  entities: IntentEntity[]
  hiddenConcerns?: string[] | undefined
  rewrittenQuery: string
  confidence: number
}
