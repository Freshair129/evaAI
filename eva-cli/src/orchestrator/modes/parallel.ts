import type { Intent } from '../../types/intent.js'
import type { ModeExecutor, ModeResult, AgentResponse } from './types.js'
import { SingleShotExecutor } from './single-shot.js'

export class ParallelExecutor implements ModeExecutor {
  private singleShot = new SingleShotExecutor()

  async execute(query: string, intent: Intent, options: any): Promise<ModeResult> {
    const start = Date.now()
    
    // In a real implementation, we would use a specialized brain (e.g. Limbic)
    // to split the query into sub-queries. 
    // For now, we simulate with a simple split if multiple intents are detected
    // or just run two specialized agents on the same query if it's "code + explain".
    
    const subQueries = [
      { role: 'reasoner', query, brainId: 'cortex' },
      { role: 'coder', query, brainId: 'motor' }
    ]

    const results = await Promise.all(
      subQueries.map(sq => this.singleShot.execute(sq.query, intent, { ...options, brainId: sq.brainId }))
    )

    const latencyMs = Date.now() - start
    const agentResponses = results.flatMap(r => r.agentResponses)
    
    // Merge strategy: concat for now
    const answer = agentResponses
      .map(r => `### ${r.agentId} (${r.reasoning})\n\n${r.answer}`)
      .join('\n\n')

    return {
      answer,
      confidence: Math.min(...agentResponses.map(r => r.confidence)),
      mode: 'parallel',
      agentResponses,
      latencyMs,
      costUsd: agentResponses.reduce((sum, r) => sum + r.costUsd, 0)
    }
  }
}
