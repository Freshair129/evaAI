import { describe, expect, it } from 'vitest'
import { SlidingWindowLimiter } from './rate-limit.js'

describe('SlidingWindowLimiter', () => {
  it('allows up to maxPerWindow requests', () => {
    const l = new SlidingWindowLimiter({ windowMs: 1000, maxPerWindow: 3 })
    expect(l.allow('u', 1000)).toBe(true)
    expect(l.allow('u', 1100)).toBe(true)
    expect(l.allow('u', 1200)).toBe(true)
    expect(l.allow('u', 1300)).toBe(false)
  })

  it('admits new request once window slides', () => {
    const l = new SlidingWindowLimiter({ windowMs: 1000, maxPerWindow: 2 })
    expect(l.allow('u', 1000)).toBe(true)
    expect(l.allow('u', 1500)).toBe(true)
    expect(l.allow('u', 1600)).toBe(false)
    // 1000 + 1000 = 2000 → window slid past first hit
    expect(l.allow('u', 2100)).toBe(true)
  })

  it('scopes per key independently', () => {
    const l = new SlidingWindowLimiter({ windowMs: 1000, maxPerWindow: 1 })
    expect(l.allow('a', 1000)).toBe(true)
    expect(l.allow('a', 1100)).toBe(false)
    expect(l.allow('b', 1100)).toBe(true)
  })

  it('retryAfterMs returns time until earliest hit expires', () => {
    const l = new SlidingWindowLimiter({ windowMs: 1000, maxPerWindow: 1 })
    l.allow('u', 1000)
    expect(l.retryAfterMs('u', 1200)).toBe(800)
  })

  it('reset clears the state', () => {
    const l = new SlidingWindowLimiter({ windowMs: 1000, maxPerWindow: 1 })
    l.allow('u', 1000)
    l.reset('u')
    expect(l.allow('u', 1100)).toBe(true)
  })
})
