import { describe, it, expect } from 'vitest'
import { ModeSelector } from '../src/orchestrator/mode-selector.js'
import type { Intent } from '../src/types/intent.js'

const makeIntent = (taskType: Intent['taskType'], confidence = 0.9): Intent => ({
  taskType,
  urgency: 'normal',
  emotion: 'neutral',
  entities: [],
  rewrittenQuery: taskType,
  confidence,
})

describe('ModeSelector', () => {
  const selector = new ModeSelector()

  it('routes write_adr to debate mode', () => {
    const { mode } = selector.select(makeIntent('write_adr'), 0.9)
    expect(mode).toBe('debate')
  })

  it('routes plan_architecture to debate mode', () => {
    const { mode } = selector.select(makeIntent('plan_architecture'), 0.9)
    expect(mode).toBe('debate')
  })

  it('routes chat_casual to single_shot (default) mode', () => {
    const { mode } = selector.select(makeIntent('chat_casual'), 0.9)
    expect(mode).toBe('single_shot')
  })

  it('routes knowledge_search to pipeline mode', () => {
    const { mode } = selector.select(makeIntent('knowledge_search'), 0.9)
    expect(mode).toBe('pipeline')
  })

  it('forces debate mode on low confidence below threshold', () => {
    const { mode } = selector.select(makeIntent('chat_casual'), 0.3)
    expect(mode).toBe('debate')
  })
})
