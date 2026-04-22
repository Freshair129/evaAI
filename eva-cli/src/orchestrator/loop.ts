import { randomUUID } from 'node:crypto'
import type { Session } from '../types/session.js'
import type { Intent } from '../types/intent.js'
import type { Step, StepTrace } from '../types/plan.js'
import type { BrainAdapter, BrainChunk } from '../types/brain.js'
import type { Hit } from '../types/memory.js'
import { getBrain } from '../brains/registry.js'
import { parseIntent } from '../brains/limbic/intent-extractor.js'
import { appendMessage, appendTrace, setStatus, updateStats } from './session.js'
import { route, fallbackRoute, type RoutingPlan } from './router.js'
import { PermissionSystem } from './permissions.js'
import { ToolExecutor } from './tool-executor.js'
import { bootstrapTools, describeTools } from '../tools/index.js'
import { getMemoryStore } from '../memory/index.js'
import { writeEpisodic } from '../memory/episodic.js'
import { ModeSelector } from './mode-selector.js'
import { FeedbackLoop } from './feedback.js'
import { InsightDetector } from './insight-detector.js'

export type LoopEvent =
  | { type: 'intent'; intent: Intent }
  | { type: 'route'; plan: RoutingPlan }
  | { type: 'retrieval'; hits: Hit[] }
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
  private modeSelector = new ModeSelector()
  private feedbackLoop = new FeedbackLoop()
  private insightDetector = new InsightDetector()

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
        const hits = await getMemoryStore().resolveContext({
          text: intent.rewrittenQuery,
          mode: 'auto',
          budget: {
            maxHits: 5,
            maxLatencyMs: 1000
          }
        })
        sink({ type: 'retrieval', hits: hits as any })
        if (hits.length > 0) {
          retrievalContext =
            'Relevant knowledge:\n' +
            hits
              .map((h) => `- [${h.source}] ${h.id}: ${h.snippet.replace(/\n/g, ' ')}`)
              .join('\n')
        }
      } catch (e) {
        sink({ type: 'error', message: `Memory retrieval failed: ${String(e)}` })
      }
    }

    // ─── PHASE 4: Multi-Agent Execution ──────────────────────
    const { mode, executor, options } = this.modeSelector.select(intent, intent.confidence)
    
    if (mode !== 'single_shot' || intent.taskType === 'write_adr') {
      sink({ type: 'message', role: 'agent', content: `[Mode: ${mode}] Orchestrating agents...` })
      const result = await executor.execute(userInput, intent, { 
        ...options, 
        system: retrievalContext,
        signal 
      })
      
      const finalReply = result.answer
      const msg = appendMessage(session, { role: 'agent', content: finalReply })
      sink({ type: 'message', role: 'agent', content: finalReply })
      
      // Feedback & Insights
      this.feedbackLoop.handleTaskComplete(randomUUID(), result)
      const insights = this.insightDetector.detect(result)
      for (const insight of insights) {
        sink({ type: 'error', message: `Insight: ${insight.description}` })
      }

      return msg.content
    }

    // ─── PHASE 5: Native tool-use loop (single_shot) ─────────
    const cortex = getBrain('cortex', {
      cortex: {
        ...(routing.cortexModel !== undefined && { explicitModel: routing.cortexModel }),
        taskType: intent.taskType,
        contextTokens: Math.ceil(retrievalContext.length / 4),
      },
    })

    const complexTaskTypes = ['write_adr', 'plan_architecture', 'doc_write']
    const enableThinking = complexTaskTypes.includes(intent.taskType)

    const tools = describeTools().map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }))

    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      {
        role: 'user',
        content: [
          `Task: ${intent.rewrittenQuery}`,
          retrievalContext ? `\n${retrievalContext}` : '',
        ].join(''),
      },
    ]

    let finalReply = ''
    let cortexCalls = 0
    const MAX_TOOL_ROUNDS = 10

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      if (signal?.aborted) break

      const toolCallResults: Array<{ callId: string; name: string; result: string }> = []
      const assistantParts: string[] = []

      for await (const chunk of cortex.invoke({
        system: retrievalContext,
        messages,
        tools,
        temperature: 0.3,
        enableThinking,
        ...(signal !== undefined && { signal }),
      })) {
        sink({ type: 'brain_chunk', brain: 'cortex', chunk })

        if (chunk.type === 'text') {
          assistantParts.push(chunk.content)
        } else if (chunk.type === 'tool_call') {
          const fakeStep: Step = {
            id: chunk.callId,
            kind: 'tool_call',
            tool: chunk.name,
            args: chunk.args as Record<string, unknown>,
            critical: false,
          }
          sink({ type: 'step_start', step: fakeStep })
          const trace = await this.executeStep(fakeStep, signal)
          appendTrace(session, trace)
          sink({ type: 'step_done', step: fakeStep, trace })
          toolCallResults.push({
            callId: chunk.callId,
            name: chunk.name,
            result: trace.status === 'success'
              ? JSON.stringify(trace.output).slice(0, 4000)
              : `error: ${trace.error ?? 'unknown'}`,
          })
        }
      }

      cortexCalls++
      const assistantText = assistantParts.join('')
      if (assistantText) finalReply = assistantText

      if (toolCallResults.length === 0) break

      // Append the assistant turn + tool results so the next round has context
      if (assistantText) {
        messages.push({ role: 'assistant', content: assistantText })
      }
      const toolResultContent = toolCallResults
        .map((r) => `[Tool: ${r.name} | id: ${r.callId}]\n${r.result}`)
        .join('\n\n')
      messages.push({ role: 'user', content: toolResultContent })
    }

    updateStats(session, { brainCalls: { cortex: cortexCalls, motor: 0, limbic: 0 } })

    // ─── PHASE 6: Stylize ────────────────────────────────────
    const styledReply = routing.finalize
      ? await this.invokeBrainText(
          routing.finalize,
          `สรุปผลลัพธ์ให้ Boss เป็นภาษาไทยสุภาพ สั้นกระชับ:\n\n${finalReply}`,
        )
      : finalReply
    const msg = appendMessage(session, { role: 'agent', content: styledReply })
    sink({ type: 'message', role: 'agent', content: styledReply })
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
          output = await store.resolveContext({ 
            text: args.text, 
            mode: 'auto',
            budget: { maxHits: args.topK ?? 5 }
          })
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
