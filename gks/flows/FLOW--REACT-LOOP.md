---
id: "FLOW--REACT-LOOP"
phase: 2
type: "flow"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.80
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-TRI-BRAIN"]
  implements: ["FRAME--TRI-BRAIN-ARCHITECTURE", "ADR--ROUTING-MATRIX"]
  used_by: []
---

# FLOW--REACT-LOOP — Orchestrator Core Loop

> **Phase:** P2 — Flow Specification
> **Owner:** MSP-USR-BOSS

---

## 1. Pseudocode

```
async function agentLoop(userInput: string, session: Session) {
  // ─── PHASE 1: INTENT EXTRACTION ─────────────────────────────
  const intent = await LIMBIC.parseIntent(userInput)
  // intent = { taskType, urgency, emotion, entities, hidden_concerns }

  if (intent.taskType === 'chat_casual') {
    const reply = await LIMBIC.chat(userInput, session.history)
    emit('message', reply)
    return
  }

  // ─── PHASE 2: MEMORY RETRIEVAL ──────────────────────────────
  const context = await Memory.retrieve({
    query: intent.rewrittenQuery,
    sources: Router.memorySourcesFor(intent.taskType),
    topK: 5
  })

  // ─── PHASE 3: PLAN (CORTEX) ─────────────────────────────────
  const plan = await CORTEX.plan({
    intent,
    context,
    toolManifest: Tools.describe(),
    sessionHistory: session.history.slice(-10)
  })
  emit('plan', plan)

  // Approval gate ถ้า permission = 'plan-only' หรือ risky
  if (session.permissions === 'plan-only' || plan.risky) {
    const approved = await UI.confirmPlan(plan)
    if (!approved) return
  }

  // ─── PHASE 4: EXECUTE STEPS ─────────────────────────────────
  const trace: StepResult[] = []
  for (const step of plan.steps) {
    emit('step_start', step)

    try {
      const result = await executeStep(step, { session, trace })
      trace.push(result)
      emit('step_done', result)

      // Early abort ถ้า Cortex บอกว่า step นี้ critical fail
      if (result.status === 'fail' && step.critical) break

    } catch (e) {
      trace.push({ stepId: step.id, status: 'error', error: e.message })
      emit('step_error', step, e)
      break
    }

    // ─── Mid-loop reflection ถ้า step มี unexpected output ──
    if (result.unexpected) {
      const adjustment = await CORTEX.reflect({ plan, trace, problem: result })
      if (adjustment.newSteps) {
        plan.steps.splice(indexOf(step) + 1, 0, ...adjustment.newSteps)
      }
    }
  }

  // ─── PHASE 5: SYNTHESIZE ────────────────────────────────────
  const summary = await CORTEX.summarize({ plan, trace, intent })

  // ─── PHASE 6: STYLIZE (LIMBIC) ──────────────────────────────
  const reply = await LIMBIC.stylize(summary, {
    tone: deriveTone(intent.emotion),
    formality: 'polite_thai'
  })
  emit('message', reply)

  // ─── PHASE 7: PERSIST ───────────────────────────────────────
  await Memory.appendTrace(session.id, { intent, plan, trace, reply })

  if (shouldConsolidate(session)) {
    await Memory.consolidateToEpisodic(session.id)
  }
}


async function executeStep(step: Step, ctx) {
  switch (step.kind) {
    case 'tool_call':
      if (!await Permissions.allow(step.tool, ctx.session)) {
        return { status: 'denied' }
      }
      return await Tools.execute(step.tool, step.args, ctx)

    case 'brain_call':
      const brain = Router.selectBrain(step.subtype)
      return await brain.invoke(step.prompt, step.context)

    case 'memory_op':
      return await Memory[step.op](step.args)

    case 'user_input':
      return await UI.askUser(step.question)
  }
}
```

---

## 2. Sequence Diagram (Happy Path)

```
┌─────┐   ┌────┐  ┌──────┐ ┌──────┐ ┌─────┐ ┌──────┐ ┌─────┐
│User │   │UI  │  │Orch. │ │LIMBIC│ │Mem. │ │CORTEX│ │MOTOR│
└──┬──┘   └─┬──┘  └──┬───┘ └──┬───┘ └──┬──┘ └──┬───┘ └──┬──┘
   │ input  │        │        │        │       │        │
   │───────▶│ submit │        │        │       │        │
   │        │───────▶│        │        │       │        │
   │        │        │ parse  │        │       │        │
   │        │        │───────▶│        │       │        │
   │        │        │◀───────│ intent │       │        │
   │        │        │ retrieve        │       │        │
   │        │        │────────────────▶│       │        │
   │        │        │◀────────────────│ ctx   │        │
   │        │        │ plan            │       │        │
   │        │        │────────────────────────▶│        │
   │        │        │◀────────────────────────│ plan   │
   │        │ show   │                         │        │
   │        │◀───────│                         │        │
   │        │        │ exec: Read src/cart.ts  │        │
   │        │        │─── Tools.read ──────────────┐    │
   │        │        │◀────────────────────────────┘    │
   │        │        │ exec: MOTOR code                 │
   │        │        │─────────────────────────────────▶│
   │        │        │◀─────────────────────────────────│ diff
   │        │        │ review (CORTEX)         │        │
   │        │        │────────────────────────▶│        │
   │        │        │◀────────────────────────│ OK     │
   │        │        │ stylize                 │        │
   │        │        │───────▶│                │        │
   │        │        │◀───────│ Thai reply     │        │
   │        │ render │        │                │        │
   │        │◀───────│                         │        │
   │◀───────│        │                         │        │
   │        │        │ write episodic + vector │        │
   │        │        │───────────▶ Memory               │
```

---

## 3. Error Handling Matrix

| Failure | Action | User sees |
|---|---|---|
| LIMBIC API timeout | Retry 2x, fallback keyword router | "Intent parsing ช้า ขอลองอีกครั้ง" |
| CORTEX API 429 | Fallback to Sonnet → Haiku → Gemini | Warning log, no interrupt |
| Ollama (Motor) down | Try reload, else ask to use Cortex for code | "Local model ล่ม จะใช้ Opus เขียนแทน OK?" |
| Tool denied by permission | Pause, show confirm dialog | Permission prompt |
| Memory file corrupt | Skip that source, log warning | "ส่วนความจำเสีย ข้ามไปก่อน" |
| Step unexpected result | Mid-loop reflect, adjust plan | "เจอปัญหา กำลังคิดแผนใหม่..." |
| Plan has 0 valid steps | Abort, ask clarification | "ยังไม่เข้าใจงาน ขอข้อมูลเพิ่ม" |

---

## 4. Cancellation

- User กด `Esc` → emit `abort_signal`
- ทุก `executeStep` เช็ค `signal.aborted` ก่อน/ระหว่าง IO
- Tool running (e.g., bash) → kill child process
- API call → AbortController.abort()
- Session state: `cancelled` — Memory ยังบันทึก trace ที่ทำแล้ว

---

## 5. Streaming

- LIMBIC stylize → **token stream** ไป UI
- CORTEX plan → **chunked JSON** (parse partial พร้อม stream)
- MOTOR code → **line-by-line** (ดู progress)
- Tool output → **line buffer** (flush ทุก 100ms)

---

## 6. Invariants (ต้องจริงตลอดเวลา)

- ไม่มี step ไหนรันโดยไม่ผ่าน permission check
- Trace ทุก step ถูกบันทึก (แม้ fail/cancel)
- Session.id ไม่ซ้ำ
- หลังจบ loop: episodic memory ถูก flush
- ไม่มี 2 brain ทำงานพร้อมกันถ้าตัวนึงเป็น local (VRAM)
