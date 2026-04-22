import type { ModeResult } from './modes/types.js'

export interface Insight {
  type: 'recurring_failure' | 'high_confidence_pattern' | 'quality_boost'
  description: string
  metadata: any
}

export class InsightDetector {
  detect(result: ModeResult): Insight[] {
    const insights: Insight[] = []

    // Example 1: Detect high confidence after debate
    if (result.mode === 'debate' && result.confidence > 0.85) {
      insights.push({
        type: 'quality_boost',
        description: 'Debate mode significantly increased confidence for this task type.',
        metadata: { originalMode: 'single_shot' }
      })
    }

    // Example 2: Detect low confidence even after multi-agent
    if (result.confidence < 0.5) {
      insights.push({
        type: 'recurring_failure',
        description: 'Task remains low confidence despite multi-agent effort. May need human intervention.',
        metadata: { mode: result.mode }
      })
    }

    return insights
  }
}
