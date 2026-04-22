import type { Intent } from '../types/intent.js'
import { loadConfig } from '../config/index.js'
import { SingleShotExecutor } from './modes/single-shot.js'
import { ParallelExecutor } from './modes/parallel.js'
import { DebateExecutor } from './modes/debate.js'
import { PipelineExecutor } from './modes/pipeline.js'
import type { ModeExecutor, ExecutionMode } from './modes/types.js'

export class ModeSelector {
  private executors: Record<ExecutionMode, ModeExecutor> = {
    single_shot: new SingleShotExecutor(),
    parallel: new ParallelExecutor(),
    debate: new DebateExecutor(),
    pipeline: new PipelineExecutor()
  }

  select(intent: Intent, confidence: number): { mode: ExecutionMode; executor: ModeExecutor; options: any } {
    const config = loadConfig().multi_agent
    
    // Check rules from config
    for (const rule of config.mode_rules) {
      if (this.evaluateCondition(rule.condition, intent)) {
        return { 
          mode: rule.mode as ExecutionMode, 
          executor: this.executors[rule.mode as ExecutionMode],
          options: { rounds: rule.rounds, pipeline: config.pipelines[rule.pipeline || ''] }
        }
      }
    }

    // Confidence escalation
    if (confidence < config.confidence_escalation.force_debate_threshold) {
      return { mode: 'debate', executor: this.executors.debate, options: { rounds: 2 } }
    }

    // Default
    const defaultMode = config.default_mode as ExecutionMode
    return { mode: defaultMode, executor: this.executors[defaultMode], options: {} }
  }

  private evaluateCondition(condition: string, intent: Intent): boolean {
    // Simple condition evaluator
    // Supports: task.type == '...', task.type in [...], has_sub_concern('...')
    
    if (condition.includes('task.type ==')) {
      const type = condition.match(/'([^']+)'/)?.[1]
      return intent.taskType === type
    }
    
    if (condition.includes('task.type in')) {
      const types = condition.match(/\[([^\]]+)\]/)?.[1].split(',').map(t => t.trim().replace(/'/g, ''))
      return types?.includes(intent.taskType) ?? false
    }

    if (condition.includes('has_sub_concern')) {
      // Logic for sub-concerns (e.g. from entities or intent facets)
      return false // placeholder
    }

    return false
  }
}
