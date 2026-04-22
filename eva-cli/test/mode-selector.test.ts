import { describe, it, expect } from 'vitest'
import { ModeSelector } from '../src/orchestrator/mode-selector.js'
import type { Intent } from '../src/types/intent.js'

function makeIntent(taskType: Intent['taskType'], confidence = 0.9): Intent {
  return {
    taskType,
    urgency: 'normal',
    emotion: 'neutral',
    entities: [],
    rewrittenQuery: 'test',
    confidence,
  }
}

describe('ModeSelector', () => {
  const selector = new ModeSelector()

  it('routes write_adr → debate', () => {
    const { mode } = selector.select(makeIntent('write_adr'), 0.9)
    expect(mode).toBe('debate')
  })

  it('routes chat_casual high-confidence → single_shot', () => {
    const { mode } = selector.select(makeIntent('chat_casual'), 0.9)
    expect(mode).toBe('single_shot')
  })

  it('escalates low-confidence to debate', () => {
    const { mode } = selector.select(makeIntent('chat_casual'), 0.3)
    expect(mode).toBe('debate')
  })

  it('returns executor + options alongside mode', () => {
    const result = selector.select(makeIntent('chat_casual'), 0.9)
    expect(result.mode).toBeDefined()
    expect(result.executor).toBeDefined()
    expect(result.options).toBeDefined()
  })
})
