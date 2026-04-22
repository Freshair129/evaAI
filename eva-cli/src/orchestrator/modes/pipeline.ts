import type { Intent } from '../../types/intent.js'
import type { ModeExecutor, ModeResult, AgentResponse } from './types.js'
import { getBrain } from '../../brains/registry.js'
import { collectText } from '../../lib/streaming.js'

export class PipelineExecutor implements ModeExecutor {
  async execute(query: string, _intent: Intent, options: any): Promise<ModeResult> {
    const start = Date.now()
    const pipeline = options.pipeline || []
    
    let context = query
    let agentResponses: AgentResponse[] = []

    for (const stage of pipeline) {
      const stageStart = Date.now()
      const brain = getBrain(stage.agent === 'MSP-AGT-EVA-COWORK' ? 'cortex' : 'motor')
      
      const prompt = `Stage: ${stage.role}\nInput: ${context}\n\nTask: Process the input according to your role.`
      const output = await collectText(brain.invoke({
        system: `You are in a pipeline as a ${stage.role}.`,
        messages: [{ role: 'user', content: prompt }]
      }))

      agentResponses.push({
        answer: output,
        confidence: 0.85,
        reasoning: `Pipeline stage: ${stage.role}`,
        latencyMs: Date.now() - stageStart,
        costUsd: 0,
        agentId: stage.agent,
        usedKnowledgeIds: []
      })

      context = output // Pass to next stage
    }

    const latencyMs = Date.now() - start
    return {
      answer: context,
      confidence: 0.85,
      mode: 'pipeline',
      agentResponses,
      latencyMs,
      costUsd: agentResponses.reduce((sum, r) => sum + r.costUsd, 0)
    }
  }
}
