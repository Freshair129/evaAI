import { randomUUID } from 'node:crypto'
import type { Session } from '../types/session.js'
import type { Intent } from '../types/intent.js'
import type { Plan, Step, StepTrace } from '../types/plan.js'
import type { BrainAdapter, BrainChunk } from '../types/brain.js'
import type { Hit } from '../types/memory.js'
import { getBrain } from '../brains/registry.js'
import { parseIntent } from '../brains/limbic/intent-extractor.js'
import { collectText } from '../lib/streaming.js'
import { appendMessage, appendTrace, setStatus, updateStats } from './session.js'
import { route, fallbackRoute, type RoutingPlan } from './router.js'
import { PermissionSystem } from './permissions.js'
import { ToolExecutor } from './tool-executor.js'
import { bootstrapTools } from '../tools/index.js'
import { getMemoryStore } from '../memory/index.js'
import { writeEpisodic } from '../memory/episodic.js'

export type LoopEvent =
  | { type: 'intent'; intent: Intent }
  | { type: 'route'; plan: RoutingPlan }
  | { type: 'retrieval'; hits: Hit[] }
  | { type: 'plan'; plan: Plan }
  | { type: 'step_start'; step: Step }
  | { type: 'step_done'; step: Step; trace: StepTrace }
  | { type: 'brain_chunk'; brain: string; chunk: BrainChunk }
  | { type: 'message'; role: 'agent'; content: string }
  | { type: 'error'; message: string }

export type EventSink = (event: LoopEvent) => void

export interface LoopOptions {
  session: Session
  permissions: PermissionSystem
  sink: EventSink
  signal?: AbortSignal
}

export class AgentLoop {
  private executor: ToolExecutor
  constructor(private opts: LoopOptions) {
    bootstrapTools()
    this.executor = new ToolExecutor(opts.session, opts.permissions)
  }

  async run(userInput: string): Promise<string> {
    const { session, sink, signal } = this.opts

    appendMessage(session, { role: 'user', content: userInput })

    // ─── PHASE 1: Intent ──────────────────────────────────────
    let intent: Intent
    let routing: RoutingPlan
    try {
      const limbic = getBrain('limbic')
      intent = await parseIntent(
        limbic,
        userInput,
        session.history
          .slice(-6)
          .filter((m) => m.role === 'user' || m.role === 'agent')
          .map((m) => ({
            role: m.role === 'agent' ? ('assistant' as const) : ('user' as const),
            content: m.content,
          })),
      )
      sink({ type: 'intent', intent })
      routing = route(intent)
    } catch {
      routing = fallbackRoute(userInput)
      intent = {
        taskType: routing.taskType,
        urgency: 'normal',
        emotion: 'neutral',
        entities: [],
        rewrittenQuery: userInput,
        confidence: 0.2,
      }
      sink({ type: 'intent', intent })
    }
    sink({ type: 'route', plan: routing })

    // ─── PHASE 2: Casual chat fast path ───────────────────────
    if (routing.primary === 'limbic' && routing.taskType === 'chat_casual') {
      const reply = await this.invokeBrainText('limbic', userInput)
      const msg = appendMessage(session, { role: 'agent', content: reply })
      sink({ type: 'message', role: 'agent', content: reply })
      updateStats(session, { brainCalls: { cortex: 0, motor: 0, limbic: 1 } })
      return msg.content
    }

    // ─── PHASE 3: Memory retrieval ────────────────────────────
    let retrievalContext = ''
    if (routing.memorySources.length > 0) {
      try {
        const result = await getMemoryStore().retrieve({
          text: intent.rewrittenQuery,
          sources: routing.memorySources,
          topK: 5,
        })
        sink({ type: 'retrieval', hits: result.hits })
        if (result.hits.length > 0) {
          retrievalContext =
            'Relevant knowledge:\n' +
            result.hits
              .map((h) => `- [${h.source}] ${h.id}: ${h.snippet.replace(/\n/g, ' ')}`)
              .join('\n')
        }
      } catch (e) {
        sink({ type: 'error', message: `Memory retrieval failed: ${String(e)}` })
      }
    }

    // ─── PHASE 4: Plan (Cortex or Motor direct) ───────────────
    if (routing.primary === 'none') {
      // Pure memory recall — no planning needed
      const summary = retrievalContext || 'ไม่พบความจำที่เกี่ยวข้อง'
      const finalReply = routing.finalize
        ? await this.invokeBrainText(
            routing.finalize,
            `สรุปให้ Boss เป็นภาษาไทย:\n\n${summary}`,
          )
        : summary
      const msg = appendMessage(session, { role: 'agent', content: finalReply })
      sink({ type: 'message', role: 'agent', content: finalReply })
      return msg.content
    }

    if (routing.primary === 'motor') {
      const prompt = `${retrievalContext ? retrievalContext + '\n\n' : ''}User request: ${
        intent.rewrittenQuery
      }\n\nOriginal: ${userInput}`
      const code = await this.invokeBrainText('motor', prompt)
      const finalReply = routing.finalize
        ? await this.invokeBrainText(
            routing.finalize,
            `อธิบายสั้นๆ เป็นภาษาไทยเกี่ยวกับโค้ดนี้ (คงโค้ดไว้):\n\n${code}`,
          )
        : code
      const msg = appendMessage(session, { role: 'agent', content: finalReply })
      sink({ type: 'message', role: 'agent', content: finalReply })
      return msg.content
    }

    // primary = cortex
    const planPrompt = buildPlanPrompt(userInput, intent, retrievalContext)
    const cortex = getBrain('cortex', {
      cortex: {
        ...(routing.cortexModel !== undefined && { explicitModel: routing.cortexModel }),
        taskType: intent.taskType,
        contextTokens: Math.ceil(retrievalContext.length / 4),
      },
    })
    const rawPlan = await collectText(
      cortex.invoke({
        system: '',
        messages: [{ role: 'user' as const, content: planPrompt }],
        temperature: 0.3,
        ...(signal !== undefined && { signal }),
      }),
    )
    updateStats(session, { brainCalls: { cortex: 1, motor: 0, limbic: 0 } })

    const plan = parsePlan(rawPlan, cortex, intent)
    sink({ type: 'plan', plan })

    // ─── PHASE 5: Execute steps ───────────────────────────────
    for (const step of plan.steps) {
      if (signal?.aborted) break
      sink({ type: 'step_start', step })
      const trace = await this.executeStep(step, signal)
      appendTrace(session, trace)
      sink({ type: 'step_done', step, trace })
      if (trace.status === 'error' && step.kind === 'tool_call' && step.critical) break
    }

    // ─── PHASE 6: Synthesize + stylize ────────────────────────
    const summary = summarizeTraces(plan, session.traces)
    const finalReply = routing.finalize
      ? await this.invokeBrainText(
          routing.finalize,
          `สรุปผลลัพธ์ให้ Boss เป็นภาษาไทยสุภาพ สั้นกระชับ:\n\n${summary}`,
        )
      : summary
    const msg = appendMessage(session, { role: 'agent', content: finalReply })
    sink({ type: 'message', role: 'agent', content: finalReply })
    return msg.content
  }

  async end(): Promise<void> {
    const { session } = this.opts
    setStatus(session, 'ended')

    const durationMs = Date.now() - new Date(session.startedAt).getTime()
    try {
      writeEpisodic({
        sessionId: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt ?? new Date().toISOString(),
        durationMin: Math.round(durationMs / 60000),
        tokensTotal: session.stats.tokensIn + session.stats.tokensOut,
        costUsd: session.stats.costUsd,
        tags: extractTags(session.history),
        linkedAtoms: [],
        emotionSummary: 'neutral',
        outcomes: [`${session.stats.toolCalls} tool calls`, `${session.history.length} messages`],
        summary: summarizeSession(session),
      })
    } catch {
      // episodic write failure is non-fatal
    }
  }

  private async invokeBrainText(brainId: 'cortex' | 'motor' | 'limbic', prompt: string): Promise<string> {
    const brain: BrainAdapter = getBrain(brainId)
    const { session, signal, sink } = this.opts
    const iter = brain.invoke({
      system: '',
      messages: [{ role: 'user' as const, content: prompt }],
      ...(signal !== undefined && { signal }),
    })

    const parts: string[] = []
    for await (const chunk of iter) {
      sink({ type: 'brain_chunk', brain: brainId, chunk })
      if (chunk.type === 'text') parts.push(chunk.content)
    }
    updateStats(session, {
      brainCalls: {
        cortex: brainId === 'cortex' ? 1 : 0,
        motor: brainId === 'motor' ? 1 : 0,
        limbic: brainId === 'limbic' ? 1 : 0,
      },
    })
    return parts.join('')
  }

  private async executeStep(step: Step, signal?: AbortSignal): Promise<StepTrace> {
    const start = Date.now()
    try {
      if (step.kind === 'tool_call') {
        const outcome = await this.executor.execute(
          { toolName: step.tool, args: step.args },
          signal,
        )
        return {
          stepId: step.id,
          startedAt: new Date(start).toISOString(),
          endedAt: new Date().toISOString(),
          status: outcome.result.status,
          input: step.args,
          output: outcome.result.data,
          ...(outcome.result.error !== undefined && { error: outcome.result.error }),
          metrics: { latencyMs: outcome.result.latencyMs },
        }
      }

      if (step.kind === 'brain_call') {
        const text = await this.invokeBrainText(step.brain, step.prompt)
        return {
          stepId: step.id,
          startedAt: new Date(start).toISOString(),
          endedAt: new Date().toISOString(),
          status: 'success',
          input: step.prompt,
          output: text,
          metrics: { latencyMs: Date.now() - start },
        }
      }

      if (step.kind === 'memory_op') {
        const store = getMemoryStore()
        let output: unknown = null
        if (step.op === 'search') {
          const args = step.args as { text: string; topK?: number }
          output = await store.retrieve({ text: args.text, topK: args.topK ?? 5 })
        } else if (step.op === 'lookup') {
          const args = step.args as { id: string }
          output = store.lookup(args.id)
        }
        return {
          stepId: step.id,
          startedAt: new Date(start).toISOString(),
          endedAt: new Date().toISOString(),
          status: 'success',
          input: step.args,
          output,
          metrics: { latencyMs: Date.now() - start },
        }
      }

      // user_input
      return {
        stepId: step.id,
        startedAt: new Date(start).toISOString(),
        endedAt: new Date().toISOString(),
        status: 'success',
        input: step.kind === 'user_input' ? step.question : null,
        metrics: { latencyMs: Date.now() - start },
      }
    } catch (e) {
      return {
        stepId: step.id,
        startedAt: new Date(start).toISOString(),
        endedAt: new Date().toISOString(),
        status: 'error',
        input: null,
        error: e instanceof Error ? e.message : String(e),
        metrics: { latencyMs: Date.now() - start },
      }
    }
  }
}

function buildPlanPrompt(userInput: string, intent: Intent, context: string): string {
  const parts = [
    `User request: ${userInput}`,
    `Rewritten query: ${intent.rewrittenQuery}`,
    `Task type: ${intent.taskType}`,
    `Urgency: ${intent.urgency}`,
  ]
  if (context) parts.push('', context)
  parts.push('', 'Produce a <plan>...</plan> JSON block per the system contract.')
  return parts.join('\n')
}

function parsePlan(raw: string, cortex: BrainAdapter, intent: Intent): Plan {
  const match = raw.match(/<plan>\s*(\{[\s\S]*?\})\s*<\/plan>/)
  const fallback: Plan = {
    id: randomUUID(),
    goal: intent.rewrittenQuery,
    reasoning: raw.slice(0, 500),
    steps: [],
    estimated: { durationMs: 5000, costUsd: 0, tokens: 0 },
    risky: false,
    createdBy: 'cortex',
    createdAt: new Date().toISOString(),
  }
  if (!match?.[1]) return fallback
  try {
    const parsed = JSON.parse(match[1]) as Partial<Plan> & { steps?: Step[] }
    return {
      id: randomUUID(),
      goal: parsed.goal ?? intent.rewrittenQuery,
      reasoning: parsed.reasoning ?? '',
      steps: Array.isArray(parsed.steps) ? normalizeSteps(parsed.steps) : [],
      estimated: parsed.estimated ?? fallback.estimated,
      risky: parsed.risky ?? false,
      createdBy: 'cortex',
      createdAt: new Date().toISOString(),
    }
  } catch {
    void cortex
    return fallback
  }
}

function normalizeSteps(raw: unknown[]): Step[] {
  const out: Step[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const s = item as Record<string, unknown>
    const id = (s.id as string) ?? randomUUID()
    const kind = s.kind as string

    if (kind === 'tool_call') {
      const step: Step = {
        id,
        kind: 'tool_call',
        tool: String(s.tool ?? ''),
        args: s.args ?? {},
        critical: Boolean(s.critical),
      }
      out.push(step)
    } else if (kind === 'brain_call') {
      const step: Step = {
        id,
        kind: 'brain_call',
        brain: (s.brain as 'cortex' | 'motor' | 'limbic') ?? 'motor',
        subtype:
          (s.subtype as 'code_gen' | 'code_edit' | 'review' | 'summarize' | 'stylize_thai') ??
          'code_gen',
        prompt: String(s.prompt ?? ''),
      }
      out.push(step)
    } else if (kind === 'memory_op') {
      const step: Step = {
        id,
        kind: 'memory_op',
        op:
          (s.op as
            | 'search'
            | 'lookup'
            | 'recall_episodic'
            | 'write_episodic'
            | 'propose_inbound') ?? 'search',
        args: s.args ?? {},
      }
      out.push(step)
    } else if (kind === 'user_input') {
      const step: Step = {
        id,
        kind: 'user_input',
        question: String(s.question ?? ''),
      }
      out.push(step)
    }
  }
  return out
}

function summarizeTraces(plan: Plan, traces: StepTrace[]): string {
  const lines = [`Goal: ${plan.goal}`, `Steps executed: ${traces.length}`]
  for (const t of traces.slice(-plan.steps.length)) {
    const step = plan.steps.find((s) => s.id === t.stepId)
    const name =
      step?.kind === 'tool_call'
        ? step.tool
        : step?.kind === 'brain_call'
          ? `${step.brain}:${step.subtype}`
          : step?.kind ?? '?'
    lines.push(`- [${t.status}] ${name} (${t.metrics.latencyMs}ms)`)
    if (t.error) lines.push(`    error: ${t.error}`)
    if (typeof t.output === 'string' && t.output) {
      lines.push(`    output: ${t.output.slice(0, 400)}`)
    }
  }
  return lines.join('\n')
}

function extractTags(history: Session['history']): string[] {
  const tags = new Set<string>()
  for (const m of history) {
    if (m.intent?.taskType) tags.add(m.intent.taskType)
  }
  return [...tags]
}

function summarizeSession(session: Session): string {
  const userMsgs = session.history.filter((m) => m.role === 'user').map((m) => m.content)
  const agentMsgs = session.history.filter((m) => m.role === 'agent').map((m) => m.content)
  return [
    `Session ${session.id} (${session.userId})`,
    '',
    '## User requests',
    ...userMsgs.map((m, i) => `${i + 1}. ${m.slice(0, 160)}`),
    '',
    '## Agent outcomes',
    ...agentMsgs.slice(-5).map((m, i) => `${i + 1}. ${m.slice(0, 200)}`),
  ].join('\n')
}

export { bootstrapTools }
