import { describe, it, expect, vi } from 'vitest'
import { AgentLoop } from './loop.js'
import { getMemoryStore } from '../memory/index.js'

vi.mock('../brains/registry.js', () => ({
  getBrain: vi.fn(() => ({
    invoke: vi.fn(() => (async function*() {
      yield { type: 'text', content: '<plan>{"steps":[]}</plan>' }
    })()),
    invokeText: vi.fn().mockResolvedValue('Mocked response')
  }))
}))

describe('AgentLoop Smoke Test (Hybrid Retrieval)', () => {
  it('should trigger retrieval and include hits in context', async () => {
    const mockSession: any = {
      id: 'test-session',
      history: [],
      traces: [],
      startedAt: new Date().toISOString(),
      stats: { tokensIn: 0, tokensOut: 0, costUsd: 0, brainCalls: {}, toolCalls: 0 }
    }

    const mockSink = vi.fn()
    const loop = new AgentLoop({
      session: mockSession,
      permissions: { canUseTool: () => true } as any,
      sink: mockSink
    })

    // Mock resolveContext to return a known hit
    const store = getMemoryStore()
    const resolveSpy = vi.spyOn(store, 'resolveContext').mockResolvedValue([
      {
        source: 'atomic',
        id: 'CONCEPT--TEST',
        score: 0.9,
        snippet: 'This is a test concept for smoke testing.',
        path: 'gks/concepts/CONCEPT--TEST.md'
      }
    ])

    // Mock invokeBrainText to avoid actual LLM calls
    // @ts-ignore
    const brainSpy = vi.spyOn(loop, 'invokeBrainText').mockResolvedValue('Mocked response')

    const result = await loop.run('Explain CONCEPT--TEST')

    expect(resolveSpy).toHaveBeenCalled()
    expect(mockSink).toHaveBeenCalledWith(expect.objectContaining({
      type: 'retrieval',
      hits: expect.arrayContaining([
        expect.objectContaining({ id: 'CONCEPT--TEST' })
      ])
    }))
    
    expect(result).toBe('Mocked response')
    
    resolveSpy.mockRestore()
    brainSpy.mockRestore()
  })
})
