import { describe, expect, it } from 'vitest'
import { normalizeTelegramMessage } from './telegram.js'

describe('normalizeTelegramMessage', () => {
  const baseMsg = {
    message_id: 10,
    date: 1700000000,
    chat: { id: 100, type: 'private' as const },
    from: { id: 200, is_bot: false, username: 'boss' },
    text: 'hi',
  }

  it('normalizes private message as mention', () => {
    const msg = normalizeTelegramMessage(baseMsg, 'eva_bot')!
    expect(msg.platform).toBe('telegram')
    expect(msg.chatType).toBe('private')
    expect(msg.isMention).toBe(true)
  })

  it('detects @mention in group via text', () => {
    const msg = normalizeTelegramMessage(
      {
        ...baseMsg,
        chat: { id: -100, type: 'group' as const, title: 'Team' },
        text: '@eva_bot help me',
      },
      'eva_bot',
    )!
    expect(msg.chatType).toBe('group')
    expect(msg.isMention).toBe(true)
  })

  it('detects mention via entities', () => {
    const msg = normalizeTelegramMessage(
      {
        ...baseMsg,
        chat: { id: -100, type: 'supergroup' as const },
        text: 'hey @eva_bot!',
        entities: [{ type: 'mention', offset: 4, length: 8 }],
      },
      'eva_bot',
    )!
    expect(msg.isMention).toBe(true)
  })

  it('detects reply-to-bot as mention', () => {
    const msg = normalizeTelegramMessage(
      {
        ...baseMsg,
        chat: { id: -100, type: 'group' as const },
        text: 'thanks',
        reply_to_message: {
          message_id: 9,
          date: 1700000000,
          chat: { id: -100, type: 'group' as const },
          from: { id: 999, is_bot: true, username: 'eva_bot' },
          text: 'previous bot message',
        },
      },
      'eva_bot',
    )!
    expect(msg.isMention).toBe(true)
  })

  it('group msg without mention is not flagged', () => {
    const msg = normalizeTelegramMessage(
      {
        ...baseMsg,
        chat: { id: -100, type: 'group' as const },
        text: 'just chatting',
      },
      'eva_bot',
    )!
    expect(msg.isMention).toBe(false)
  })

  it('returns null for non-text message', () => {
    const msg = normalizeTelegramMessage(
      { message_id: 1, date: 1, chat: { id: 1, type: 'private' as const } },
      'eva_bot',
    )
    expect(msg).toBeNull()
  })
})
