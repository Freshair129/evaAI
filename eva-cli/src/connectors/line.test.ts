import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'
import { normalizeLineEvent, verifyLineSignature } from './line.js'

describe('verifyLineSignature', () => {
  const secret = 'test-channel-secret'
  const body = JSON.stringify({ events: [{ type: 'message' }] })
  const signature = createHmac('sha256', secret).update(body).digest('base64')

  it('accepts valid signature', () => {
    expect(verifyLineSignature(secret, body, signature)).toBe(true)
  })

  it('rejects wrong signature', () => {
    expect(verifyLineSignature(secret, body, 'bogus==')).toBe(false)
  })

  it('rejects wrong secret', () => {
    const bad = createHmac('sha256', 'wrong').update(body).digest('base64')
    expect(verifyLineSignature(secret, body, bad)).toBe(false)
  })

  it('rejects tampered body', () => {
    expect(verifyLineSignature(secret, body + 'x', signature)).toBe(false)
  })
})

describe('normalizeLineEvent', () => {
  it('normalizes private message', () => {
    const event = {
      type: 'message' as const,
      replyToken: 'tok-1',
      source: { type: 'user' as const, userId: 'U1' },
      timestamp: 1700000000000,
      message: { type: 'text' as const, id: 'msg-1', text: 'สวัสดี' },
    }
    const msg = normalizeLineEvent(event, undefined, 'eva')!
    expect(msg.platform).toBe('line')
    expect(msg.chatType).toBe('private')
    expect(msg.isMention).toBe(true)
    expect(msg.chatId).toBe('U1')
    expect(msg.text).toBe('สวัสดี')
  })

  it('detects mention in group by bot user ID', () => {
    const event = {
      type: 'message' as const,
      replyToken: 'tok-1',
      source: { type: 'group' as const, groupId: 'G1', userId: 'U2' },
      timestamp: 1700000000000,
      message: {
        type: 'text' as const,
        id: 'msg-1',
        text: '@eva ช่วยที',
        mention: {
          mentionees: [{ index: 0, length: 4, userId: 'U-BOT' }],
        },
      },
    }
    const msg = normalizeLineEvent(event, 'U-BOT', 'eva')!
    expect(msg.chatType).toBe('group')
    expect(msg.isMention).toBe(true)
  })

  it('detects mention by name when bot user ID unknown', () => {
    const event = {
      type: 'message' as const,
      replyToken: 'tok-1',
      source: { type: 'group' as const, groupId: 'G1' },
      timestamp: 1700000000000,
      message: { type: 'text' as const, id: 'msg-1', text: '@eva hi' },
    }
    const msg = normalizeLineEvent(event, undefined, 'eva')!
    expect(msg.isMention).toBe(true)
  })

  it('does not flag mention when group msg has no mention', () => {
    const event = {
      type: 'message' as const,
      replyToken: 'tok-1',
      source: { type: 'group' as const, groupId: 'G1' },
      timestamp: 1700000000000,
      message: { type: 'text' as const, id: 'msg-1', text: 'hi guys' },
    }
    const msg = normalizeLineEvent(event, 'U-BOT', 'eva')!
    expect(msg.isMention).toBe(false)
  })
})
