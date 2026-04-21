import { describe, expect, it } from 'vitest'
import { extractIntentTag, keywordFallback, parseIntent } from './intent-extractor.js'
import type { BrainAdapter, BrainChunk, BrainInput } from '../../types/brain.js'

describe('extractIntentTag', () => {
  it('extracts JSON from <intent> tag', () => {
    const text = 'some prose\n<intent>\n{"taskType":"code_generate"}\n</intent>\n'
    expect(extractIntentTag(text)).toContain('"taskType":"code_generate"')
  })

  it('falls back to first json with taskType', () => {
    const text = 'no tag but here {"taskType":"chat_casual","urgency":"low"}'
    expect(extractIntentTag(text)).toContain('chat_casual')
  })

  it('returns null when no json found', () => {
    expect(extractIntentTag('no json here')).toBeNull()
  })
})

describe('keywordFallback', () => {
  it('classifies greetings as chat_casual', () => {
    expect(keywordFallback('สวัสดีครับ').taskType).toBe('chat_casual')
  })

  it('classifies code request', () => {
    expect(keywordFallback('ช่วยเขียน function add หน่อย').taskType).toBe('code_generate')
  })

  it('classifies recall request', () => {
    expect(keywordFallback('เมื่อวานเราคุยเรื่องอะไร').taskType).toBe('knowledge_recall')
  })

  it('detects critical urgency', () => {
    expect(keywordFallback('ด่วนมาก! แก้ให้หน่อย').urgency).toBe('critical')
  })
})

function mockLimbic(response: string): BrainAdapter {
  return {
    id: 'limbic',
    modelSpec: { id: 'mock', provider: 'thaillm', model: 'mock', supports: [] },
    invoke: async function* (_input: BrainInput): AsyncIterable<BrainChunk> {
      yield { type: 'text', content: response }
      yield { type: 'done', stopReason: 'end_turn' }
    },
    estimateCost: () => ({ estimatedUsd: 0, estimatedTokens: 0 }),
  }
}

describe('parseIntent', () => {
  it('parses valid intent from limbic response', async () => {
    const mock = mockLimbic(
      `<intent>{"taskType":"code_generate","urgency":"normal","emotion":"curious","entities":[],"rewrittenQuery":"write a function","confidence":0.9}</intent>`,
    )
    const intent = await parseIntent(mock, 'เขียน function หน่อย')
    expect(intent.taskType).toBe('code_generate')
    expect(intent.confidence).toBe(0.9)
  })

  it('falls back to keyword when response is malformed', async () => {
    const mock = mockLimbic('garbage response')
    const intent = await parseIntent(mock, 'ช่วยเขียน function add')
    expect(intent.taskType).toBe('code_generate')
    expect(intent.confidence).toBe(0.4) // fallback confidence
  })
})
