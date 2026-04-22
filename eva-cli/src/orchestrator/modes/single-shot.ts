import type { Intent } from '../../types/intent.js'
import type { ModeExecutor, ModeResult, AgentResponse } from './types.js'
import { getBrain } from '../../brains/registry.js'
import { collectText } from '../../lib/streaming.js'

export class SingleShotExecutor implements ModeExecutor {
  async execute(query: string, intent: Intent, options: any): Promise<ModeResult> {
    const start = Date.now()
    const brainId = options.brainId || 'cortex'
    const brain = getBrain(brainId)
    
    const iter = brain.invoke({
      system: options.system || '',
      messages: [{ role: 'user', content: query }],
      temperature: options.temperature ?? 0.3,
    })

    const text = await collectText(iter)
    const latencyMs = Date.now() - start
    
    // Mocking confidence for now — in real implementation, 
    // it should be parsed from structured output or self-reported
    const confidence = 0.85 

    const agentResponse: AgentResponse = {
      answer: text,
      confidence,
      reasoning: 'Single-shot execution via ' + brainId,
      latencyMs,
      costUsd: 0, // Should be calculated from brain.estimateCost
      agentId: 'MSP-AGT-EVA-COWORK', // Default for now
      usedKnowledgeIds: []
    }

    return {
      answer: text,
      confidence,
      mode: 'single_shot',
      agentResponses: [agentResponse],
      latencyMs,
      costUsd: agentResponse.costUsd
    }
  }
}
