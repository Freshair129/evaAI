import type { Connector, ConnectorContext, IncomingMessage } from './types.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger({ context: 'telegram' })

export interface TelegramConfig {
  botToken: string
  botUsername?: string
  allowedChatIds?: number[] | null   // null = all
  apiBase?: string                   // override for tests
  pollTimeoutSec?: number
}

interface TgUser {
  id: number
  is_bot: boolean
  username?: string
  first_name?: string
  last_name?: string
}

interface TgChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  username?: string
  title?: string
}

interface TgMessageEntity {
  type: string          // 'mention' | 'bot_command' | ...
  offset: number
  length: number
  user?: TgUser
}

interface TgMessage {
  message_id: number
  date: number
  chat: TgChat
  from?: TgUser
  text?: string
  entities?: TgMessageEntity[]
  reply_to_message?: TgMessage
}

interface TgUpdate {
  update_id: number
  message?: TgMessage
  edited_message?: TgMessage
}

interface TgGetUpdatesResponse {
  ok: boolean
  result?: TgUpdate[]
  description?: string
}

export function normalizeTelegramMessage(
  msg: TgMessage,
  botUsername: string | undefined,
): IncomingMessage | null {
  if (!msg.text) return null
  const chatType = msg.chat.type === 'private' ? 'private' : 'group'
  const text = msg.text

  let isMention = chatType === 'private'
  if (!isMention && botUsername) {
    const atMention = `@${botUsername}`
    isMention =
      text.includes(atMention) ||
      (msg.entities?.some(
        (e) => e.type === 'mention' && text.slice(e.offset, e.offset + e.length) === atMention,
      ) ??
        false)
    // Replying directly to bot counts as mention
    if (!isMention && msg.reply_to_message?.from?.username === botUsername) {
      isMention = true
    }
  }

  return {
    platform: 'telegram',
    chatId: String(msg.chat.id),
    chatType,
    userId: String(msg.from?.id ?? msg.chat.id),
    ...(msg.from?.username !== undefined && { userName: msg.from.username }),
    text,
    isMention,
    messageId: String(msg.message_id),
    timestamp: msg.date * 1000,
    replyContext: { chatNumId: msg.chat.id },
    raw: msg,
  }
}

export class TelegramConnector implements Connector {
  readonly platform = 'telegram' as const
  private running = false
  private offset = 0
  private backoffMs = 2000
  private maxBackoffMs = 30_000
  private base: string

  constructor(
    private cfg: TelegramConfig,
    private ctx: ConnectorContext,
  ) {
    this.base = (cfg.apiBase ?? 'https://api.telegram.org') + `/bot${cfg.botToken}`
  }

  isRunning(): boolean {
    return this.running
  }

  async start(): Promise<void> {
    this.running = true
    if (!this.cfg.botUsername) {
      try {
        const me = await this.call<{ username?: string }>('getMe', {})
        if (me.username) this.cfg.botUsername = me.username
      } catch {
        // ignore — mention detection will miss without username
      }
    }
    logger.info('Telegram connector started', {
      username: this.cfg.botUsername ?? 'unknown',
    })
    void this.pollLoop()
  }

  async stop(): Promise<void> {
    this.running = false
  }

  async reply(msg: IncomingMessage, text: string): Promise<void> {
    const chatNumId = msg.replyContext?.chatNumId ?? Number(msg.chatId)
    const body = text.slice(0, 4096)
    try {
      await this.call('sendMessage', {
        chat_id: chatNumId,
        text: body,
      })
    } catch (e) {
      logger.warn('TG sendMessage failed', {
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  private async pollLoop(): Promise<void> {
    while (this.running) {
      try {
        const updates = await this.call<TgUpdate[]>('getUpdates', {
          offset: this.offset,
          timeout: this.cfg.pollTimeoutSec ?? 25,
          allowed_updates: ['message'],
        })
        this.backoffMs = 2000 // reset on success

        for (const upd of updates) {
          this.offset = upd.update_id + 1
          const msg = upd.message
          if (!msg) continue
          if (
            this.cfg.allowedChatIds &&
            this.cfg.allowedChatIds.length > 0 &&
            !this.cfg.allowedChatIds.includes(msg.chat.id)
          ) {
            continue
          }
          const normalized = normalizeTelegramMessage(msg, this.cfg.botUsername)
          if (!normalized) continue
          void this.ctx.onMessage(normalized).catch((e: unknown) => {
            logger.error('TG message handler failed', {
              error: e instanceof Error ? e.message : String(e),
            })
          })
        }
      } catch (e) {
        logger.warn('TG poll error', {
          error: e instanceof Error ? e.message : String(e),
          backoff: this.backoffMs,
        })
        await sleep(this.backoffMs)
        this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs)
      }
    }
  }

  private async call<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.base}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = (await res.json()) as TgGetUpdatesResponse & { result?: unknown }
    if (!data.ok) throw new Error(data.description ?? `TG ${method} failed`)
    return data.result as T
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
