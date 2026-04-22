import { loadConfig } from '../config/index.js'
import type { Intent } from '../types/intent.js'

export interface AgentStats {
  agentId: string
  successRate: number
  p50LatencyMs: number
  avgCostUsd: number
  lastActiveAt: string
}

export class AgentScorer {
  calculateScore(agentId: string, taskType: string, skills: Record<string, number>, stats: AgentStats): number {
    const config = loadConfig().multi_agent.scoring.weights
    
    const sSkill = skills[taskType] ?? 0.5
    const sSuccess = stats.successRate
    const sLatency = 1.0 - Math.min(stats.p50LatencyMs / 30000, 1.0)
    const sCost = 1.0 - Math.min(stats.avgCostUsd / 0.50, 1.0)
    
    const lastActive = new Date(stats.lastActiveAt).getTime()
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const sFreshness = lastActive > weekAgo ? 1.0 : 0.5

    const score = 
        config.skill_match  * sSkill
      + config.past_success * sSuccess
      + config.latency_pref * sLatency
      + config.cost_pref    * sCost
      + config.freshness    * sFreshness

    return score
  }
}
