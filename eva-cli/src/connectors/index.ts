import type { Connector, ConnectorContext } from './types.js'
import { LineConnector } from './line.js'
import { TelegramConnector } from './telegram.js'
import { ConnectorHttpServer } from './http-server.js'
import { MessageHandler } from './message-handler.js'
import { loadConfig } from '../config/index.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger({ context: 'serve' })

export interface ServeOptions {
  line?: boolean
  telegram?: boolean
  port?: number
}

export interface ServeRuntime {
  connectors: Connector[]
  httpServer: ConnectorHttpServer | null
  stop: () => Promise<void>
}

export async function startConnectors(opts: ServeOptions = {}): Promise<ServeRuntime> {
  const cfg = loadConfig()
  const { connectors: cc, secrets } = cfg

  const useLine = opts.line ?? cc.line.enabled
  const useTelegram = opts.telegram ?? cc.telegram.enabled

  if (!useLine && !useTelegram) {
    throw new Error('No connectors enabled. Use --line or --telegram, or set enabled: true in connectors.yaml')
  }

  const handler = new MessageHandler({
    ratePerMinute: cc.limits.rate_per_minute,
    maxReplyChars: cc.limits.max_reply_chars,
  })

  const connectors: Connector[] = []

  let lineConnector: LineConnector | null = null
  if (useLine) {
    if (!secrets.lineChannelSecret || !secrets.lineChannelAccessToken) {
      throw new Error(
        'LINE enabled but LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN not set',
      )
    }
    // Build context with a late-bound reference to the connector instance
    const lineCtx: ConnectorContext = {
      onMessage: (msg) => handler.handle(msg, lineConnector as LineConnector),
    }
    lineConnector = new LineConnector(
      {
        channelSecret: secrets.lineChannelSecret,
        channelAccessToken: secrets.lineChannelAccessToken,
        ...(secrets.lineBotUserId !== undefined && { botUserId: secrets.lineBotUserId }),
        botName: cc.line.bot_name,
      },
      lineCtx,
    )
    connectors.push(lineConnector)
    await lineConnector.start()
  }

  let httpServer: ConnectorHttpServer | null = null
  if (lineConnector) {
    httpServer = new ConnectorHttpServer({
      port: opts.port ?? cc.server.port,
      host: cc.server.host,
      line: {
        path: cc.line.webhook_path,
        connector: lineConnector,
      },
    })
    await httpServer.start()
  }

  if (useTelegram) {
    if (!secrets.telegramBotToken) {
      throw new Error('Telegram enabled but TELEGRAM_BOT_TOKEN not set')
    }
    let tg: TelegramConnector | null = null
    const tgCtx: ConnectorContext = {
      onMessage: (msg) => handler.handle(msg, tg as TelegramConnector),
    }
    tg = new TelegramConnector(
      {
        botToken: secrets.telegramBotToken,
        ...(secrets.telegramBotUsername !== undefined && {
          botUsername: secrets.telegramBotUsername,
        }),
        allowedChatIds:
          cc.telegram.allowed_chat_ids.length > 0 ? cc.telegram.allowed_chat_ids : null,
        pollTimeoutSec: cc.telegram.poll_timeout_sec,
      },
      tgCtx,
    )
    connectors.push(tg)
    await tg.start()
  }

  logger.info('Connectors started', {
    line: useLine,
    telegram: useTelegram,
    count: connectors.length,
  })

  const stop = async () => {
    for (const c of connectors) {
      try {
        await c.stop()
      } catch {
        // ignore
      }
    }
    if (httpServer) await httpServer.stop()
  }

  return { connectors, httpServer, stop }
}

export type { Connector, IncomingMessage, ConnectorContext } from './types.js'
export { LineConnector } from './line.js'
export { TelegramConnector } from './telegram.js'
export { ConnectorHttpServer } from './http-server.js'
export { MessageHandler } from './message-handler.js'
export { SessionMap, getSessionMap, resetSessionMap } from './session-map.js'
export { SlidingWindowLimiter } from './rate-limit.js'
export { BOT_ALLOWED_TOOLS, BOT_DENIED_TOOLS, isToolAllowedInBot } from './bot-tool-allowlist.js'
export { verifyLineSignature, normalizeLineEvent } from './line.js'
export { normalizeTelegramMessage } from './telegram.js'
