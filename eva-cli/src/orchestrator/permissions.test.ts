import { describe, expect, it } from 'vitest'
import { PermissionSystem, autoApprove, autoDeny } from './permissions.js'
import { z } from 'zod'
import type { Tool } from '../types/tool.js'

function makeTool(
  name: string,
  sideEffect: 'read' | 'write' | 'exec' | 'network',
  permission: 'auto' | 'confirm' | 'forbidden' = 'auto',
): Tool<Record<string, unknown>, unknown> {
  return {
    name,
    description: 'test',
    inputSchema: z.object({}),
    permission,
    sideEffect,
    execute: async () => ({ status: 'success', latencyMs: 0 }),
  }
}

describe('PermissionSystem', () => {
  it('auto mode allows all without confirmation', async () => {
    const perm = new PermissionSystem('auto', autoDeny)
    const result = await perm.authorize(makeTool('Bash', 'exec', 'confirm'), {})
    expect(result.proceed).toBe(true)
  })

  it('plan-only mode blocks all writes', async () => {
    const perm = new PermissionSystem('plan-only', autoApprove)
    const result = await perm.authorize(makeTool('Write', 'write'), {})
    expect(result.proceed).toBe(false)
  })

  it('confirm-each allows read without asking', async () => {
    const perm = new PermissionSystem('confirm-each', autoDeny)
    const result = await perm.authorize(makeTool('Read', 'read'), {})
    expect(result.proceed).toBe(true)
  })

  it('confirm-each asks for write and respects deny', async () => {
    const perm = new PermissionSystem('confirm-each', autoDeny)
    const result = await perm.authorize(makeTool('Write', 'write', 'confirm'), {})
    expect(result.proceed).toBe(false)
    expect(result.reason).toBe('User denied')
  })

  it('confirm-each asks for write and respects approve', async () => {
    const perm = new PermissionSystem('confirm-each', autoApprove)
    const result = await perm.authorize(makeTool('Write', 'write', 'confirm'), {})
    expect(result.proceed).toBe(true)
  })

  it('blocks forbidden tools regardless of mode', async () => {
    const perm = new PermissionSystem('auto', autoApprove)
    const result = await perm.authorize(makeTool('Danger', 'exec', 'forbidden'), {})
    expect(result.proceed).toBe(false)
  })
})
