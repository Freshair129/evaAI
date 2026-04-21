import { z } from 'zod'
import type { Intent, TaskType } from '../../types/intent.js'
import type { BrainAdapter } from '../../types/brain.js'
import { collectText } from '../../lib/streaming.js'

const TASK_TYPES: TaskType[] = [
  'chat_casual',
  'chat_thai_complex',
  'plan_architecture',
  'code_generate',
  'code_edit',
  'code_review',
  'sql_gen',
  'analyze_log',
  'knowledge_recall',
  'knowledge_search',
  'doc_write',
  'write_adr',
]

const IntentSchema = z.object({
  taskType: z.enum(TASK_TYPES as [TaskType, ...TaskType[]]),
  urgency: z.enum(['low', 'normal', 'high', 'critical']),
  emotion: z.enum(['neutral', 'happy', 'frustrated', 'urgent', 'curious', 'uncertain']),
  entities: z
    .array(z.object({ kind: z.string(), value: z.string() }))
    .default([]),
  hiddenConcerns: z.array(z.string()).optional(),
  rewrittenQuery: z.string(),
  confidence: z.number().min(0).max(1),
})

export function extractIntentTag(text: string): string | null {
  const match = text.match(/<intent>\s*(\{[\s\S]*?\})\s*<\/intent>/i)
  if (match?.[1]) return match[1]
  // fallback: first JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*"taskType"[\s\S]*\}/)
  return jsonMatch?.[0] ?? null
}

export function keywordFallback(input: string): Intent {
  const lower = input.toLowerCase()
  let taskType: TaskType = 'chat_thai_complex'

  if (/^(สวัสดี|หวัดดี|hi|hello|thanks|ขอบคุณ)/i.test(input)) taskType = 'chat_casual'
  else if (/(เขียน|สร้าง|gen).*(function|code|โค้ด|ไฟล์)/i.test(input)) taskType = 'code_generate'
  else if (/(แก้|ปรับ|fix|edit)/i.test(input)) taskType = 'code_edit'
  else if (/(รีวิว|review)/i.test(input)) taskType = 'code_review'
  else if (/(sql|query|prisma)/i.test(lower)) taskType = 'sql_gen'
  else if (/(วางแผน|ออกแบบ|plan|architect)/i.test(input)) taskType = 'plan_architecture'
  else if (/(adr|ตัดสินใจ)/i.test(lower)) taskType = 'write_adr'
  else if (/(จำ|เมื่อวาน|recall)/i.test(input)) taskType = 'knowledge_recall'
  else if (/(หา|search|ค้น)/i.test(input)) taskType = 'knowledge_search'
  else if (/(เอกสาร|spec|doc)/i.test(input)) taskType = 'doc_write'

  const urgency = /(ด่วน|urgent|asap|ฉุกเฉิน)/i.test(input)
    ? 'critical'
    : /(เร็ว|วันนี้)/i.test(input)
      ? 'high'
      : 'normal'

  return {
    taskType,
    urgency,
    emotion: 'neutral',
    entities: [],
    rewrittenQuery: input,
    confidence: 0.4,
  }
}

export async function parseIntent(
  limbic: BrainAdapter,
  userInput: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<Intent> {
  const stream = limbic.invoke({
    system:
      'Parse the following user input and return ONLY the <intent>...</intent> JSON block. No prose.',
    messages: [
      ...history,
      { role: 'user' as const, content: userInput },
    ],
    temperature: 0.2,
    maxTokens: 512,
  })

  let text: string
  try {
    text = await collectText(stream)
  } catch {
    return keywordFallback(userInput)
  }

  const jsonStr = extractIntentTag(text)
  if (!jsonStr) return keywordFallback(userInput)

  try {
    const parsed = IntentSchema.parse(JSON.parse(jsonStr))
    return parsed
  } catch {
    return keywordFallback(userInput)
  }
}
