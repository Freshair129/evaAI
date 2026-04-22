import type { Intent } from '../types/intent.js'
import type { ModeCondition } from '../config/index.js'
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

  select(intent: Intent, confidence: number): { mode: ExecutionMode; executor: ModeExecutor; options: Record<string, unknown> } {
    const config = loadConfig().multi_agent

    for (const rule of config.mode_rules) {
      if (this.matches(rule.condition, intent)) {
        const mode = rule.mode as ExecutionMode
        return {
          mode,
          executor: this.executors[mode],
          options: { rounds: rule.rounds, pipeline: config.pipelines[rule.pipeline ?? ''] }
        }
      }
    }

    if (confidence < config.confidence_escalation.force_debate_threshold) {
      return { mode: 'debate', executor: this.executors.debate, options: { rounds: 2 } }
    }

    const defaultMode = config.default_mode as ExecutionMode
    return { mode: defaultMode, executor: this.executors[defaultMode], options: {} }
  }

  private matches(condition: ModeCondition, intent: Intent): boolean {
    if (condition.task_type !== undefined && !condition.task_type.includes(intent.taskType)) {
      return false
    }
    return true
  }
}
