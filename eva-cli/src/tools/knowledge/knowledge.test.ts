import { describe, expect, it } from 'vitest'
import { gksSearchTool } from './gks-search.js'
import { gksLookupTool } from './gks-lookup.js'
import { gksProposeTool } from './gks-propose.js'
import { createLogger } from '../../lib/logger.js'

const ctx = {
  sessionId: 'MSP-SESS-knowledge' as const,
  cwd: process.cwd(),
  permissions: 'auto' as const,
  logger: createLogger({ minLevel: 'error' }),
}

describe('gksSearchTool', () => {
  it('returns hits for known concept', async () => {
    const result = await gksSearchTool.execute({ query: 'EVA', top_k: 3 }, ctx)
    expect(result.status).toBe('success')
    expect(Array.isArray(result.data?.hits)).toBe(true)
  })

  it('filters by type', async () => {
    const result = await gksSearchTool.execute(
      { query: 'tri-brain', type: 'concept', top_k: 5 },
      ctx,
    )
    expect(result.status).toBe('success')
  })
})

describe('gksLookupTool', () => {
  it('fails gracefully for missing ID', async () => {
    const result = await gksLookupTool.execute({ id: 'NONEXISTENT--XYZ' }, ctx)
    expect(result.status).toBe('fail')
    expect(result.error).toContain('not found')
  })
})

describe('gksProposeTool validation', () => {
  it('rejects mismatched ID prefix', async () => {
    const result = await gksProposeTool.execute(
      {
        kind: 'adr',
        id: 'WRONG-PREFIX',
        content: '---\nid: "WRONG-PREFIX"\n---\n\ntest content long enough',
      },
      ctx,
    )
    expect(result.status).toBe('fail')
    expect(result.error).toContain('prefix')
  })
})
