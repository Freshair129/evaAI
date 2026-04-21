import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface ModelsConfig {
  models: Record<string, {
    provider: 'anthropic' | 'google' | 'ollama' | 'thaillm' | 'openai'
    model: string
    envKey?: string
    endpoint?: string
    maxTokensDefault?: number
    contextWindow?: number
    thinkingEnabled?: boolean
    supports: string[]
  }>
  defaults: {
    cortex: string
    motor: string
    limbic: string
    embedder: string
  }
  fallback_chain: Record<string, string[]>
}

export interface RoutingRule {
  primary: string
  secondary?: string
  cortex_model?: string
  delegate?: string
  review?: string
  validator?: string
  finalize?: string
  memory: string[]
  maxLatencyMs: number
}

export interface RoutingConfig {
  tasks: Record<string, RoutingRule>
  cortex_selection: {
    rules: Array<{ condition: string; use: string }>
    default: string
  }
  fallback: {
    default_task: string
    keyword_rules: Array<{ match: string[]; task: string }>
  }
}

export interface PermissionsConfig {
  default_mode: 'auto' | 'confirm-each' | 'plan-only'
  modes: Record<string, { description: string; prompt_for: string[] }>
  tool_overrides: Record<string, 'auto' | 'confirm' | 'forbidden'>
  forbidden: Array<{ pattern: string }>
  read_forbidden_paths: string[]
}

export interface ConnectorsConfig {
  line: {
    enabled: boolean
    webhook_path: string
    bot_name: string
  }
  telegram: {
    enabled: boolean
    poll_timeout_sec: number
    allowed_chat_ids: number[]
  }
  server: {
    port: number
    host: string
  }
  limits: {
    rate_per_minute: number
    max_reply_chars: number
    session_ttl_hours: number
  }
  thai_reply: boolean
}

export interface EvaConfig {
  models: ModelsConfig
  routing: RoutingConfig
  permissions: PermissionsConfig
  connectors: ConnectorsConfig
  secrets: {
    anthropicApiKey?: string | undefined
    geminiApiKey?: string | undefined
    thaillmApiKey?: string | undefined
    openaiApiKey?: string | undefined
    obsidianApiKey?: string | undefined
    lineChannelSecret?: string | undefined
    lineChannelAccessToken?: string | undefined
    lineBotUserId?: string | undefined
    telegramBotToken?: string | undefined
    telegramBotUsername?: string | undefined
  }
  paths: {
    workspace: string
    gksRoot: string
    brainRoot: string
    sessionsDir: string
    memoryDir: string
    vectorDir: string
    inboundDir: string
  }
}

let cached: EvaConfig | null = null

export function loadConfig(opts: { workspace?: string; reload?: boolean } = {}): EvaConfig {
  if (cached && !opts.reload) return cached

  const configDir = __dirname
  const models = parseYaml(readFileSync(resolve(configDir, 'models.yaml'), 'utf8')) as ModelsConfig
  const routing = parseYaml(readFileSync(resolve(configDir, 'routing.yaml'), 'utf8')) as RoutingConfig
  const permissions = parseYaml(
    readFileSync(resolve(configDir, 'permissions.yaml'), 'utf8'),
  ) as PermissionsConfig
  const connectors = parseYaml(
    readFileSync(resolve(configDir, 'connectors.yaml'), 'utf8'),
  ) as ConnectorsConfig

  const workspace = opts.workspace ?? process.cwd()
  const brainRoot = resolve(workspace, '.brain/msp/projects/evaAI')

  const next: EvaConfig = {
    models,
    routing,
    permissions,
    connectors,
    secrets: {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
      thaillmApiKey: process.env.THAILLM_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      obsidianApiKey: process.env.OBSIDIAN_API_KEY,
      lineChannelSecret: process.env.LINE_CHANNEL_SECRET,
      lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      lineBotUserId: process.env.LINE_BOT_USER_ID,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME,
    },
    paths: {
      workspace,
      gksRoot: resolve(workspace, 'gks'),
      brainRoot,
      sessionsDir: resolve(brainRoot, 'sessions'),
      memoryDir: resolve(brainRoot, 'memory'),
      vectorDir: resolve(brainRoot, 'vector'),
      inboundDir: resolve(brainRoot, 'inbound'),
    },
  }

  cached = next
  return next
}

export function getModelSpec(modelId: string) {
  const cfg = loadConfig()
  const spec = cfg.models.models[modelId]
  if (!spec) throw new Error(`Unknown model: ${modelId}`)
  return spec
}

export function requireSecret(key: keyof EvaConfig['secrets']): string {
  const cfg = loadConfig()
  const val = cfg.secrets[key]
  if (!val) throw new Error(`Missing secret: ${key} — set via Doppler or .env`)
  return val
}
