import type { Intent } from '../../types/intent.js'
import type { ModeExecutor, ModeResult, AgentResponse } from './types.js'
import { getBrain } from '../../brains/registry.js'
import { collectText } from '../../lib/streaming.js'

export class DebateExecutor implements ModeExecutor {
  async execute(query: string, intent: Intent, options: any): Promise<ModeResult> {
    const start = Date.now()
    const maxRounds = options.rounds ?? 3
    
    let currentAnswer = ''
    let agentResponses: AgentResponse[] = []
    
    const agentA = getBrain('cortex') // Proponent
    const agentB = getBrain('cortex') // Opponent/Critique (could be different model)

    for (let round = 1; round <= maxRounds; round++) {
      const roundStart = Date.now()
      
      // Round N: Agent A proposes/revises
      const proposalPrompt = currentAnswer 
        ? `Revise your previous answer based on the critique.\nOriginal query: ${query}\nPrevious answer: ${currentAnswer}\nCritique: ${agentResponses[agentResponses.length - 1].answer}`
        : query
        
      currentAnswer = await collectText(agentA.invoke({
        system: 'You are an expert proponent. Provide the best possible answer.',
        messages: [{ role: 'user', content: proposalPrompt }]
      }))

      agentResponses.push({
        answer: currentAnswer,
        confidence: 0.8, // placeholder
        reasoning: `Debate Round ${round} Proposal`,
        latencyMs: Date.now() - roundStart,
        costUsd: 0,
        agentId: 'Agent-A',
        usedKnowledgeIds: []
      })

      // Round N: Agent B critiques
      const critiqueStart = Date.now()
      const critique = await collectText(agentB.invoke({
        system: 'You are a critical reviewer. Identify factual errors, architectural concerns, and missing considerations.',
        messages: [{ role: 'user', content: `Critique this answer for the query: "${query}"\n\nAnswer: ${currentAnswer}` }]
      }))

      agentResponses.push({
        answer: critique,
        confidence: 0.9,
        reasoning: `Debate Round ${round} Critique`,
        latencyMs: Date.now() - critiqueStart,
        costUsd: 0,
        agentId: 'Agent-B',
        usedKnowledgeIds: []
      })

      // Check for convergence (simplified)
      if (critique.toLowerCase().includes('looks good') || critique.toLowerCase().includes('no issues found')) {
        break
      }
    }

    const latencyMs = Date.now() - start
    return {
      answer: currentAnswer,
      confidence: 0.9, // Improved through debate
      mode: 'debate',
      agentResponses,
      latencyMs,
      costUsd: agentResponses.reduce((sum, r) => sum + r.costUsd, 0)
    }
  }
}
