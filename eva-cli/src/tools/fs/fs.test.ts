import { describe, expect, it, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readTool } from './read.js'
import { writeTool } from './write.js'
import { editTool } from './edit.js'
import { globTool } from './glob.js'
import { clearReadsForSession, markRead } from './read-tracker.js'
import { createLogger } from '../../lib/logger.js'

function makeCtx(sessionId: string) {
  return {
    sessionId: sessionId as `MSP-SESS-${string}`,
    cwd: process.cwd(),
    permissions: 'auto' as const,
    logger: createLogger({ minLevel: 'error' }),
  }
}

describe('readTool', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eva-fs-'))
  const file = join(tmp, 'hello.txt')
  writeFileSync(file, 'line1\nline2\nline3\n')

  beforeEach(() => clearReadsForSession('MSP-SESS-read'))

  it('reads file with line numbers', async () => {
    const result = await readTool.execute({ file_path: file }, makeCtx('MSP-SESS-read'))
    expect(result.status).toBe('success')
    expect(result.data?.content).toContain('line1')
    expect(result.data?.totalLines).toBe(4)
  })

  it('rejects relative paths', async () => {
    const result = await readTool.execute({ file_path: 'relative.txt' }, makeCtx('MSP-SESS-read'))
    expect(result.status).toBe('fail')
  })

  it('honors offset and limit', async () => {
    const result = await readTool.execute(
      { file_path: file, offset: 1, limit: 1 },
      makeCtx('MSP-SESS-read'),
    )
    expect(result.status).toBe('success')
    expect(result.data?.content).toContain('line2')
    expect(result.data?.content).not.toContain('line3')
  })
})

describe('writeTool', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eva-fs-'))

  it('creates new file without prior read', async () => {
    const file = join(tmp, 'new.txt')
    const result = await writeTool.execute(
      { file_path: file, content: 'hello' },
      makeCtx('MSP-SESS-write'),
    )
    expect(result.status).toBe('success')
    expect(result.data?.created).toBe(true)
    expect(readFileSync(file, 'utf8')).toBe('hello')
  })

  it('denies overwrite without prior read', async () => {
    const file = join(tmp, 'existing.txt')
    writeFileSync(file, 'old')
    const result = await writeTool.execute(
      { file_path: file, content: 'new' },
      makeCtx('MSP-SESS-write-2'),
    )
    expect(result.status).toBe('denied')
    expect(readFileSync(file, 'utf8')).toBe('old')
  })

  it('allows overwrite after read', async () => {
    const file = join(tmp, 'existing2.txt')
    writeFileSync(file, 'old')
    markRead('MSP-SESS-write-3', file)
    const result = await writeTool.execute(
      { file_path: file, content: 'new' },
      makeCtx('MSP-SESS-write-3'),
    )
    expect(result.status).toBe('success')
    expect(readFileSync(file, 'utf8')).toBe('new')
  })
})

describe('editTool', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eva-fs-'))

  it('replaces unique string', async () => {
    const file = join(tmp, 'edit.txt')
    writeFileSync(file, 'hello world')
    markRead('MSP-SESS-edit', file)
    const result = await editTool.execute(
      { file_path: file, old_string: 'world', new_string: 'friend', replace_all: false },
      makeCtx('MSP-SESS-edit'),
    )
    expect(result.status).toBe('success')
    expect(readFileSync(file, 'utf8')).toBe('hello friend')
  })

  it('rejects non-unique without replace_all', async () => {
    const file = join(tmp, 'edit2.txt')
    writeFileSync(file, 'foo bar foo')
    markRead('MSP-SESS-edit2', file)
    const result = await editTool.execute(
      { file_path: file, old_string: 'foo', new_string: 'baz', replace_all: false },
      makeCtx('MSP-SESS-edit2'),
    )
    expect(result.status).toBe('fail')
  })

  it('replaces all with flag', async () => {
    const file = join(tmp, 'edit3.txt')
    writeFileSync(file, 'foo bar foo')
    markRead('MSP-SESS-edit3', file)
    const result = await editTool.execute(
      { file_path: file, old_string: 'foo', new_string: 'baz', replace_all: true },
      makeCtx('MSP-SESS-edit3'),
    )
    expect(result.status).toBe('success')
    expect(result.data?.replacements).toBe(2)
    expect(readFileSync(file, 'utf8')).toBe('baz bar baz')
  })

  it('rejects identical strings', async () => {
    const file = join(tmp, 'edit4.txt')
    writeFileSync(file, 'hello')
    markRead('MSP-SESS-edit4', file)
    const result = await editTool.execute(
      { file_path: file, old_string: 'hello', new_string: 'hello', replace_all: false },
      makeCtx('MSP-SESS-edit4'),
    )
    expect(result.status).toBe('fail')
  })
})

describe('globTool', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eva-fs-'))
  writeFileSync(join(tmp, 'a.ts'), '')
  writeFileSync(join(tmp, 'b.ts'), '')
  writeFileSync(join(tmp, 'c.md'), '')

  it('matches by extension', async () => {
    const result = await globTool.execute(
      { pattern: '*.ts', path: tmp },
      makeCtx('MSP-SESS-glob'),
    )
    expect(result.status).toBe('success')
    expect(result.data?.count).toBe(2)
    expect(result.data?.matches.every((p) => p.endsWith('.ts'))).toBe(true)
  })
})

describe('registry bootstrap', () => {
  it('registers all tools without duplicate errors', async () => {
    const { resetTools, bootstrapTools, listTools } = await import('../index.js')
    resetTools()
    bootstrapTools()
    const tools = listTools()
    expect(tools.length).toBeGreaterThanOrEqual(10)
    expect(tools.some((t) => t.name === 'Read')).toBe(true)
    expect(tools.some((t) => t.name === 'Bash')).toBe(true)
    expect(tools.some((t) => t.name === 'GksSearch')).toBe(true)
    expect(existsSync('.')).toBe(true) // smoke
  })
})
