import { createServer, type IncomingMessage as HttpIncoming, type ServerResponse, type Server } from 'node:http'
import { createLogger } from '../lib/logger.js'
import type { LineConnector } from './line.js'

const logger = createLogger({ context: 'http' })

export interface HttpServerOptions {
  port: number
  host?: string
  line?: {
    path: string
    connector: LineConnector
  }
}

export class ConnectorHttpServer {
  private server: Server | null = null
  constructor(private opts: HttpServerOptions) {}

  async start(): Promise<void> {
    const { port, host = '0.0.0.0' } = this.opts
    this.server = createServer((req, res) => void this.handle(req, res))
    await new Promise<void>((resolve, reject) => {
      this.server?.once('error', reject)
      this.server?.listen(port, host, () => {
        logger.info('HTTP server listening', { port, host })
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (!this.server) return
    await new Promise<void>((resolve, reject) => {
      this.server?.close((err) => (err ? reject(err) : resolve()))
    })
    this.server = null
  }

  private async handle(req: HttpIncoming, res: ServerResponse): Promise<void> {
    const url = req.url ?? '/'
    const method = req.method ?? 'GET'

    if (method === 'GET' && url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }))
      return
    }

    if (this.opts.line && method === 'POST' && url === this.opts.line.path) {
      const rawBody = await readBody(req, 1_000_000)
      const signature = String(req.headers['x-line-signature'] ?? '')
      const outcome = await this.opts.line.connector.handleWebhook(rawBody, signature)
      res.writeHead(outcome.status, { 'Content-Type': 'text/plain' })
      res.end(outcome.body ?? '')
      return
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  }
}

async function readBody(req: HttpIncoming, maxBytes: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}
