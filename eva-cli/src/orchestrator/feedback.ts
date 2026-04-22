import { AgentStatsStore, type AgentTaskResult } from '../memory/agent-stats.js'
import type { ModeResult } from './modes/types.js'

export class FeedbackLoop {
  private statsStore = new AgentStatsStore()

  handleTaskComplete(taskId: string, result: ModeResult) {
    for (const response of result.agentResponses) {
      const record: AgentTaskResult = {
        taskId,
        agentId: response.agentId,
        success: result.confidence > 0.6, // Simple heuristic
        latencyMs: response.latencyMs,
        costUsd: response.costUsd,
        timestamp: new Date().toISOString()
      }
      this.statsStore.recordResult(record)
    }
  }
}
