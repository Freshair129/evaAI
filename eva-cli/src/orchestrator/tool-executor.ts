import type { Tool, ToolContext, ToolResult } from '../types/tool.js'
import type { Session } from '../types/session.js'
import { getTool } from '../tools/registry.js'
import { writeAudit } from '../tools/audit.js'
import { createLogger } from '../lib/logger.js'
import { PermissionSystem } from './permissions.js'
import { loadConfig } from '../config/index.js'

export interface ToolExecuteRequest {
  toolName: string
  args: unknown
  summary?: string
}

export interface ToolExecuteOutcome {
  toolName: string
  result: ToolResult<unknown>
  skipped: boolean
  skipReason?: string
}

export class ToolExecutor {
  constructor(
    private session: Session,
    private permissions: PermissionSystem,
  ) {}

  async execute(
    req: ToolExecuteRequest,
    signal?: AbortSignal,
  ): Promise<ToolExecuteOutcome> {
    const tool = getTool(req.toolName) as Tool<unknown, unknown> | undefined
    if (!tool) {
      return {
        toolName: req.toolName,
        result: {
          status: 'error',
          error: `Unknown tool: ${req.toolName}`,
          latencyMs: 0,
        },
        skipped: true,
        skipReason: 'unknown-tool',
      }
    }

    const auth = await this.permissions.authorize(tool, req.args, req.summary)
    if (!auth.proceed) {
      const result: ToolResult<unknown> = {
        status: 'denied',
        ...(auth.reason !== undefined && { error: auth.reason }),
        latencyMs: 0,
      }
      writeAudit(this.session.id, tool.name, req.args, result)
      return {
        toolName: tool.name,
        result,
        skipped: true,
        ...(auth.reason !== undefined && { skipReason: auth.reason }),
      }
    }

    let parsed: unknown
    try {
      parsed = tool.inputSchema.parse(req.args)
    } catch (e) {
      const result: ToolResult<unknown> = {
        status: 'fail',
        error: e instanceof Error ? e.message : 'Invalid input',
        latencyMs: 0,
      }
      writeAudit(this.session.id, tool.name, req.args, result)
      return { toolName: tool.name, result, skipped: true, skipReason: 'invalid-input' }
    }

    const cfg = loadConfig()
    const ctx: ToolContext = {
      sessionId: this.session.id,
      cwd: this.session.workspace ?? cfg.paths.workspace,
      permissions: this.session.permissions,
      ...(signal !== undefined && { signal }),
      logger: createLogger({
        sessionId: this.session.id,
        context: tool.name,
        file: `${cfg.paths.brainRoot}/logs/${this.session.id}.jsonl`,
      }),
    }

    const result = await tool.execute(parsed, ctx)
    writeAudit(this.session.id, tool.name, parsed, result)
    this.session.stats.toolCalls += 1
    return { toolName: tool.name, result, skipped: false }
  }
}
