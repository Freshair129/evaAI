import { describe, expect, it } from 'vitest'
import { selectCortexModel } from './model-router.js'

describe('selectCortexModel', () => {
  it('uses gemini-pro for very long context', () => {
    expect(selectCortexModel({ contextTokens: 100_000 })).toBe('gemini-pro')
  })

  it('uses opus for ADR writing', () => {
    expect(selectCortexModel({ taskType: 'write_adr' })).toBe('opus')
  })

  it('uses opus for multi-step plans', () => {
    expect(selectCortexModel({ estimatedSteps: 7 })).toBe('opus')
  })

  it('uses sonnet for code review', () => {
    expect(selectCortexModel({ taskType: 'code_review' })).toBe('sonnet')
  })

  it('uses haiku for trivial tasks', () => {
    expect(selectCortexModel({ estimatedSteps: 1 })).toBe('haiku')
  })

  it('honors explicit model override', () => {
    expect(
      selectCortexModel({ explicitModel: 'gemini-pro', taskType: 'write_adr' }),
    ).toBe('gemini-pro')
  })

  it('falls back to default (sonnet) when no rules match', () => {
    expect(selectCortexModel({ taskType: 'chat_thai_complex', estimatedSteps: 3 })).toBe('sonnet')
  })
})
