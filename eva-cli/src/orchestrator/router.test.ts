import { describe, expect, it } from 'vitest'
import { route, fallbackRoute } from './router.js'

describe('route', () => {
  it('routes chat_casual to limbic only', () => {
    const plan = route({
      taskType: 'chat_casual',
      urgency: 'low',
      emotion: 'neutral',
      entities: [],
      rewrittenQuery: 'hi',
      confidence: 0.9,
    })
    expect(plan.primary).toBe('limbic')
    expect(plan.memorySources).toEqual([])
  })

  it('routes code_generate to cortex with motor delegate', () => {
    const plan = route({
      taskType: 'code_generate',
      urgency: 'normal',
      emotion: 'curious',
      entities: [],
      rewrittenQuery: 'write code',
      confidence: 0.9,
    })
    expect(plan.primary).toBe('cortex')
    expect(plan.delegate).toBe('motor')
    expect(plan.memorySources).toContain('atomic')
  })

  it('routes knowledge_recall to none with limbic finalize', () => {
    const plan = route({
      taskType: 'knowledge_recall',
      urgency: 'low',
      emotion: 'curious',
      entities: [],
      rewrittenQuery: 'recall',
      confidence: 0.9,
    })
    expect(plan.primary).toBe('none')
    expect(plan.finalize).toBe('limbic')
    expect(plan.memorySources).toContain('episodic')
  })
})

describe('fallbackRoute', () => {
  it('matches keyword for code_generate', () => {
    const plan = fallbackRoute('เขียน function add')
    expect(plan.taskType).toBe('code_generate')
  })

  it('falls back to default task for unknown input', () => {
    const plan = fallbackRoute('random nonsense garble')
    expect(plan.taskType).toBe('chat_thai_complex')
  })
})
