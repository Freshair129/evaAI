import type { PermissionMode } from '../types/session.js'
import type { Tool } from '../types/tool.js'
import { loadConfig } from '../config/index.js'

export interface PermissionDecision {
  allowed: boolean
  reason?: string
  requiresConfirmation: boolean
}

export type ConfirmCallback = (prompt: ConfirmPrompt) => Promise<boolean>

export interface ConfirmPrompt {
  tool: string
  sideEffect: string
  summary: string
  args: unknown
}

export class PermissionSystem {
  constructor(
    private mode: PermissionMode,
    private confirm: ConfirmCallback,
  ) {}

  setMode(mode: PermissionMode): void {
    this.mode = mode
  }

  getMode(): PermissionMode {
    return this.mode
  }

  /** Pre-check: can this tool potentially run? Returns whether user confirmation is needed. */
  check(tool: Tool<unknown, unknown>): PermissionDecision {
    const cfg = loadConfig()
    const override = cfg.permissions.tool_overrides[tool.name]

    if (override === 'forbidden' || tool.permission === 'forbidden') {
      return { allowed: false, reason: 'Tool is forbidden', requiresConfirmation: false }
    }

    if (this.mode === 'plan-only') {
      return {
        allowed: false,
        reason: 'Plan-only mode: tool execution disabled',
        requiresConfirmation: false,
      }
    }

    if (this.mode === 'auto') {
      return { allowed: true, requiresConfirmation: false }
    }

    // confirm-each
    const effectivePerm = override ?? tool.permission
    if (effectivePerm === 'auto') {
      return { allowed: true, requiresConfirmation: false }
    }

    const promptSides = cfg.permissions.modes[this.mode]?.prompt_for ?? []
    if (promptSides.includes(tool.sideEffect)) {
      return { allowed: true, requiresConfirmation: true }
    }

    return { allowed: true, requiresConfirmation: false }
  }

  /** Ask user for confirmation (delegates to UI callback). */
  async requestConfirm(prompt: ConfirmPrompt): Promise<boolean> {
    return this.confirm(prompt)
  }

  /** Convenience: check + confirm in one call. Returns whether to proceed. */
  async authorize(
    tool: Tool<unknown, unknown>,
    args: unknown,
    summary?: string,
  ): Promise<{ proceed: boolean; reason?: string }> {
    const decision = this.check(tool)
    if (!decision.allowed) {
      return { proceed: false, ...(decision.reason !== undefined && { reason: decision.reason }) }
    }
    if (!decision.requiresConfirmation) {
      return { proceed: true }
    }

    const ok = await this.requestConfirm({
      tool: tool.name,
      sideEffect: tool.sideEffect,
      summary: summary ?? `${tool.name}: ${tool.description}`,
      args,
    })
    return ok ? { proceed: true } : { proceed: false, reason: 'User denied' }
  }
}

/** Default: auto-approve (used in tests only). */
export const autoApprove: ConfirmCallback = async () => true

/** Default: auto-deny (used as safety fallback when no UI is attached). */
export const autoDeny: ConfirmCallback = async () => false
