import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Connector, ConnectorContext, IncomingMessage } from './types.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger({ context: 'line' })

export interface LineConfig {
  channelSecret: string
  channelAccessToken: string
  botUserId?: string
  botName?: string          // mention patterns like @eva
  replyApiBase?: string     // override for tests
  pushApiBase?: string
}

// ─── Signature verification ────────────────────────────────────
export function verifyLineSignature(
  channelSecret: string,
  rawBody: string | Buffer,
  signature: string,
): boolean {
  try {
    const hmac = createHmac('sha256', channelSecret)
    hmac.update(rawBody)
    const computed = hmac.digest('base64')
    const a = Buffer.from(computed, 'base64')
    const b = Buffer.from(signature, 'base64')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// ─── Event parsing ─────────────────────────────────────────────
interface LineSource {
  type: 'user' | 'group' | 'room'
  userId?: string
  groupId?: string
  roomId?: string
}

interface LineMentionee {
  index: number
  length: number
  userId?: string
}

interface LineMention {
  mentionees: LineMentionee[]
}

interface LineTextMessage {
  type: 'text'
  id: string
  text: string
  mention?: LineMention
}

interface LineMessageEvent {
  type: 'message'
  replyToken: string
  source: LineSource
  timestamp: number
  message: LineTextMessage
}

interface LineWebhookBody {
  destination: string
  events: Array<LineMessageEvent | { type: string }>
}

export function normalizeLineEvent(
  event: LineMessageEvent,
  botUserId: string | undefined,
  botName = 'eva',
): IncomingMessage | null {
  if (event.type !== 'message' || event.message.type !== 'text') return null

  const chatType = event.source.type === 'user' ? 'private' : 'group'
  const chatId =
    event.source.groupId ?? event.source.roomId ?? event.source.userId ?? 'unknown'

  const text = event.message.text
  const mentionedBotByUserId =
    botUserId !== undefined &&
    (event.message.mention?.mentionees.some((m) => m.userId === botUserId) ?? false)
  const mentionedByName = new RegExp(`@${botName}\\b`, 'i').test(text)
  const isMention = chatType === 'private' ? true : mentionedBotByUserId || mentionedByName

  return {
    platform: 'line',
    chatId,
    chatType,
    userId: event.source.userId ?? chatId,
    text,
    isMention,
    messageId: event.message.id,
    timestamp: event.timestamp,
    replyContext: { token: event.replyToken },
    raw: event,
  }
}

// ─── LINE client ───────────────────────────────────────────────
export class LineConnector implements Connector {
  readonly platform = 'line' as const
  private running = false
  constructor(
    private cfg: LineConfig,
    private ctx: ConnectorContext,
  ) {}

  async start(): Promise<void> {
    this.running = true
    logger.info('LINE connector started (waits for webhook)')
  }

  async stop(): Promise<void> {
    this.running = false
  }

  isRunning(): boolean {
    return this.running
  }

  async reply(msg: IncomingMessage, text: string): Promise<void> {
    const token = msg.replyContext?.token
    // LINE text message max is 5000 chars
    const body = text.slice(0, 5000)

    if (token) {
      const ok = await this.callReply(token, body)
      if (ok) return
      logger.warn('reply token failed, falling back to push', { chatId: msg.chatId })
    }
    await this.callPush(msg.chatId, body)
  }

  /** Handle raw webhook POST body. Returns HTTP status code. */
  async handleWebhook(
    rawBody: string,
    signature: string,
  ): Promise<{ status: number; body?: string }> {
    if (!verifyLineSignature(this.cfg.channelSecret, rawBody, signature)) {
      logger.warn('Invalid LINE signature')
      return { status: 401, body: 'invalid signature' }
    }

    let parsed: LineWebhookBody
    try {
      parsed = JSON.parse(rawBody) as LineWebhookBody
    } catch {
      return { status: 400, body: 'invalid json' }
    }

    for (const event of parsed.events ?? []) {
      if (event.type !== 'message') continue
      const normalized = normalizeLineEvent(
        event as LineMessageEvent,
        this.cfg.botUserId,
        this.cfg.botName ?? 'eva',
      )
      if (!normalized) continue
      // Process asynchronously — LINE requires 200 within seconds
      void this.ctx.onMessage(normalized).catch((e: unknown) => {
        logger.error('LINE message handler failed', {
          error: e instanceof Error ? e.message : String(e),
        })
      })
    }

    return { status: 200 }
  }

  private async callReply(replyToken: string, text: string): Promise<boolean> {
    const url = (this.cfg.replyApiBase ?? 'https://api.line.me/v2/bot') + '/message/reply'
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cfg.channelAccessToken}`,
        },
        body: JSON.stringify({
          replyToken,
          messages: [{ type: 'text', text }],
        }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        logger.warn('LINE reply non-2xx', { status: res.status, body })
        return false
      }
      return true
    } catch (e) {
      logger.warn('LINE reply network error', {
        error: e instanceof Error ? e.message : String(e),
      })
      return false
    }
  }

  private async callPush(to: string, text: string): Promise<void> {
    const url = (this.cfg.pushApiBase ?? 'https://api.line.me/v2/bot') + '/message/push'
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cfg.channelAccessToken}`,
        },
        body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
      })
      if (!res.ok) {
        logger.warn('LINE push failed', { status: res.status })
      }
    } catch (e) {
      logger.error('LINE push error', { error: e instanceof Error ? e.message : String(e) })
    }
  }
}
