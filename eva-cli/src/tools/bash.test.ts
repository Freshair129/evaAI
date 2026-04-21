import { describe, expect, it } from 'vitest'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { bashTool, checkBlocklist } from './bash.js'
import { createLogger } from '../lib/logger.js'

describe('checkBlocklist', () => {
  it('blocks rm -rf /', () => {
    expect(checkBlocklist('rm -rf /')).toBeTruthy()
  })

  it('blocks fork bomb', () => {
    expect(checkBlocklist(':(){:|:&};:')).toBeTruthy()
  })

  it('blocks mkfs', () => {
    expect(checkBlocklist('sudo mkfs /dev/sda1')).toBeTruthy()
  })

  it('allows normal ls', () => {
    expect(checkBlocklist('ls -la')).toBeNull()
  })

  it('allows echo', () => {
    expect(checkBlocklist('echo hello')).toBeNull()
  })
})

describe('bashTool.execute', () => {
  const ctx = {
    sessionId: 'MSP-SESS-test' as const,
    cwd: mkdtempSync(join(tmpdir(), 'eva-bash-')),
    permissions: 'auto' as const,
    logger: createLogger({ minLevel: 'error' }),
  }

  it('runs simple echo command', async () => {
    const result = await bashTool.execute({ command: 'echo hi', timeout: 5000 }, ctx)
    expect(result.status).toBe('success')
    expect(result.data?.stdout).toContain('hi')
    expect(result.data?.exitCode).toBe(0)
  })

  it('denies blocklisted command', async () => {
    const result = await bashTool.execute({ command: 'rm -rf /', timeout: 5000 }, ctx)
    expect(result.status).toBe('denied')
  })

  it('reports non-zero exit as fail', async () => {
    const result = await bashTool.execute({ command: 'exit 2', timeout: 5000 }, ctx)
    expect(result.status).toBe('fail')
    expect(result.data?.exitCode).toBe(2)
  })

  it('enforces timeout', async () => {
    const result = await bashTool.execute({ command: 'sleep 5', timeout: 200 }, ctx)
    expect(result.data?.timedOut).toBe(true)
  }, 10000)
})
