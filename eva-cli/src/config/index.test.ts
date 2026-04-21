import { describe, expect, it } from 'vitest'
import { loadConfig } from './index.js'

describe('loadConfig', () => {
  it('parses models.yaml with required brains', () => {
    const cfg = loadConfig({ reload: true })
    expect(cfg.models.defaults.cortex).toBeTruthy()
    expect(cfg.models.defaults.motor).toBeTruthy()
    expect(cfg.models.defaults.limbic).toBeTruthy()
    expect(cfg.models.models[cfg.models.defaults.cortex]).toBeDefined()
  })

  it('parses routing.yaml with all TaskTypes', () => {
    const cfg = loadConfig({ reload: true })
    const required = [
      'chat_casual',
      'chat_thai_complex',
      'plan_architecture',
      'code_generate',
      'code_edit',
      'code_review',
      'sql_gen',
      'analyze_log',
      'knowledge_recall',
      'knowledge_search',
      'doc_write',
      'write_adr',
    ]
    for (const t of required) {
      expect(cfg.routing.tasks[t], `missing task: ${t}`).toBeDefined()
    }
  })

  it('parses permissions.yaml with safe defaults', () => {
    const cfg = loadConfig({ reload: true })
    expect(cfg.permissions.default_mode).toBe('confirm-each')
    expect(cfg.permissions.tool_overrides.Bash).toBe('confirm')
    expect(cfg.permissions.tool_overrides.Read).toBe('auto')
    expect(cfg.permissions.forbidden.length).toBeGreaterThan(0)
  })
})
