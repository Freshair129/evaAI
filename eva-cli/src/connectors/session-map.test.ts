import { describe, expect, it, beforeEach } from 'vitest'
import { resetSessionMap, SessionMap } from './session-map.js'

describe('SessionMap', () => {
  beforeEach(() => resetSessionMap())

  it('creates a fresh session for new chatId', () => {
    const m = new SessionMap({ ttlHours: 1 })
    const session = m.getOrCreate('line', 'U123')
    expect(session.id.startsWith('MSP-SESS-')).toBe(true)
    expect(session.permissions).toBe('auto')
    expect(m.size()).toBe(1)
  })

  it('reuses session for same chatId', () => {
    const m = new SessionMap({ ttlHours: 1 })
    const a = m.getOrCreate('line', 'U123')
    const b = m.getOrCreate('line', 'U123')
    expect(a.id).toBe(b.id)
  })

  it('isolates sessions across platforms', () => {
    const m = new SessionMap({ ttlHours: 1 })
    const a = m.getOrCreate('line', 'same-id')
    const b = m.getOrCreate('telegram', 'same-id')
    expect(a.id).not.toBe(b.id)
  })

  it('forget removes a session', () => {
    const m = new SessionMap({ ttlHours: 1 })
    m.getOrCreate('line', 'X')
    m.forget('line', 'X')
    expect(m.size()).toBe(0)
  })
})

import { isToolAllowedInBot } from './bot-tool-allowlist.js'

describe('isToolAllowedInBot', () => {
  it('allows read tools', () => {
    expect(isToolAllowedInBot('Read')).toBe(true)
    expect(isToolAllowedInBot('Grep')).toBe(true)
    expect(isToolAllowedInBot('GksSearch')).toBe(true)
  })

  it('denies destructive tools', () => {
    expect(isToolAllowedInBot('Write')).toBe(false)
    expect(isToolAllowedInBot('Bash')).toBe(false)
    expect(isToolAllowedInBot('Edit')).toBe(false)
    expect(isToolAllowedInBot('GksPropose')).toBe(false)
  })

  it('denies unknown tool by default', () => {
    expect(isToolAllowedInBot('MysteryTool')).toBe(false)
  })
})
