export type Platform = 'line' | 'telegram'

export type ChatType = 'private' | 'group'

export interface IncomingMessage {
  platform: Platform
  chatId: string          // unique per chat (user or group)
  chatType: ChatType
  userId: string          // sender user id
  userName?: string
  text: string
  isMention: boolean      // true ถ้ามี @eva หรือ group ที่ bot ถูก mention
  messageId: string
  timestamp: number       // epoch ms
  raw?: unknown           // original payload for debugging
  replyContext?: {
    token?: string        // LINE reply token
    chatNumId?: number    // TG chat.id as number
  }
}

export interface OutgoingReply {
  text: string
  chatId: string
  replyContext?: IncomingMessage['replyContext']
}

export interface Connector {
  readonly platform: Platform
  start(): Promise<void>
  stop(): Promise<void>
  reply(msg: IncomingMessage, text: string): Promise<void>
  isRunning(): boolean
}

export interface ConnectorContext {
  onMessage: (msg: IncomingMessage) => Promise<void>
}
