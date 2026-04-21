import type { Connector, IncomingMessage } from './types.js'
import { getSessionMap } from './session-map.js'
import { SlidingWindowLimiter } from './rate-limit.js'
import { AgentLoop, type LoopEvent } from '../orchestrator/loop.js'
import { PermissionSystem } from '../orchestrator/permissions.js'
import type { Tool } from '../types/tool.js'
import { isToolAllowedInBot } from './bot-tool-allowlist.js'
import { bootstrapTools } from '../tools/index.js'
import { listTools } from '../tools/registry.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger({ context: 'connector' })

export interface MessageHandlerOptions {
  ratePerMinute?: number
  maxReplyChars?: number
}

export class MessageHandler {
  private sessions = getSessionMap()
  private limiter: SlidingWindowLimiter
  private maxReplyChars: number
  private loopCache = new Map<string, AgentLoop>()

  constructor(opts: MessageHandlerOptions = {}) {
    this.limiter = new SlidingWindowLimiter({
      windowMs: 60_000,
      maxPerWindow: opts.ratePerMinute ?? 5,
    })
    this.maxReplyChars = opts.maxReplyChars ?? 4000
    bootstrapTools()
    applyBotToolGuards()
  }

  async handle(msg: IncomingMessage, connector: Connector): Promise<void> {
    try {
      // Group chat: must be mentioned
      if (msg.chatType === 'group' && !msg.isMention) {
        logger.debug('Skip group message without mention', { chatId: msg.chatId })
        return
      }

      // Rate limit per chat
      const rateKey = `${msg.platform}:${msg.chatId}`
      if (!this.limiter.allow(rateKey)) {
        const retry = Math.ceil(this.limiter.retryAfterMs(rateKey) / 1000)
        await connector.reply(
          msg,
          `ขออภัย Boss กำลังยุ่งอยู่ครับ ขอ ${retry} วินาทีแล้วลองอีกครั้งนะครับ (limit 5 msg/min)`,
        )
        return
      }

      const session = this.sessions.getOrCreate(msg.platform, msg.chatId)
      const permissions = new PermissionSystem('auto', async () => false)

      let loop = this.loopCache.get(rateKey)
      if (!loop) {
        loop = new AgentLoop({
          session,
          permissions,
          sink: (event: LoopEvent) => this.onLoopEvent(event),
        })
        this.loopCache.set(rateKey, loop)
      }

      const reply = await loop.run(msg.text)
      const clipped = reply.slice(0, this.maxReplyChars)
      await connector.reply(msg, clipped || 'ขออภัย ระบบไม่มีข้อความตอบกลับ')
    } catch (err) {
      logger.error('Message handling failed', {
        error: err instanceof Error ? err.message : String(err),
        chatId: msg.chatId,
      })
      try {
        await connector.reply(msg, 'ขออภัย ระบบมีปัญหาชั่วคราว ลองใหม่อีกครั้งนะครับ')
      } catch {
        // ignore
      }
    }
  }

  clearLoop(platform: string, chatId: string): void {
    this.loopCache.delete(`${platform}:${chatId}`)
  }

  private onLoopEvent(event: LoopEvent): void {
    if (event.type === 'error') {
      logger.warn('Loop error event', { message: event.message })
    }
  }
}

/**
 * Wraps denied tools so their execute() always returns 'denied'.
 * Defense-in-depth on top of permission mode.
 */
let guardsApplied = false
function applyBotToolGuards(): void {
  if (guardsApplied) return
  guardsApplied = true

  for (const t of listTools()) {
    const tool = t as Tool<unknown, unknown>
    if (!isToolAllowedInBot(tool.name)) {
      tool.execute = async () => ({
        status: 'denied',
        error: `Tool ${tool.name} is not allowed in bot mode`,
        latencyMs: 0,
      })
    }
  }
}
