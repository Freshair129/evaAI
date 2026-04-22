import { appendFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from '../config/index.js'

export interface AgentTaskResult {
  taskId: string
  agentId: string
  success: boolean
  latencyMs: number
  costUsd: number
  timestamp: string
}

export class AgentStatsStore {
  private filePath: string

  constructor() {
    const config = loadConfig()
    this.filePath = join(config.paths.brainRoot, 'agent-stats.jsonl')
  }

  recordResult(result: AgentTaskResult) {
    const line = JSON.stringify(result) + '\n'
    appendFileSync(this.filePath, line)
  }

  getStats(agentId: string) {
    if (!existsSync(this.filePath)) {
      return {
        agentId,
        successRate: 0.8, // Initial bootstrap
        p50LatencyMs: 5000,
        avgCostUsd: 0.01,
        lastActiveAt: new Date().toISOString()
      }
    }

    const lines = readFileSync(this.filePath, 'utf8').split('\n').filter(Boolean)
    const agentLines = lines
      .map(l => JSON.parse(l) as AgentTaskResult)
      .filter(l => l.agentId === agentId)

    if (agentLines.length === 0) {
      return {
        agentId,
        successRate: 0.8,
        p50LatencyMs: 5000,
        avgCostUsd: 0.01,
        lastActiveAt: new Date().toISOString()
      }
    }

    const recent = agentLines.slice(-20) // Rolling window
    const successCount = recent.filter(r => r.success).length
    const latencies = recent.map(r => r.latencyMs).sort((a, b) => a - b)
    const p50 = latencies[Math.floor(latencies.length / 2)] ?? 5000
    const avgCost = recent.reduce((sum, r) => sum + r.costUsd, 0) / recent.length

    return {
      agentId,
      successRate: successCount / recent.length,
      p50LatencyMs: p50,
      avgCostUsd: avgCost,
      lastActiveAt: recent[recent.length - 1]?.timestamp ?? new Date().toISOString()
    }
  }
}
