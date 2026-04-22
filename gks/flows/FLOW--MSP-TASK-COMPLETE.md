---
id: "FLOW--MSP-TASK-COMPLETE"
phase: 2
type: "flow"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.80
  source_type: "inference"
crosslinks:
  derived_from: ["ADR--GKS-ARCHITECTURE", "ADR--MULTI-AGENT-MODES", "FRAME--EVA-FILE-TOPOLOGY"]
  implements: ["ADR--GKS-ARCHITECTURE"]
  supersedes: []
  used_by: []
---

# FLOW--MSP-TASK-COMPLETE — Post-response Feedback Loop & Knowledge Update

> **Phase:** P2 · **Date:** 2026-04-21
> **API**: `POST /msp/task.complete` (conceptual — internal event emission)

---

## 1. Purpose

After EVA finishes responding, MSP performs **post-processing**:
- Update agent performance stats (feedback loop for routing)
- Extract new knowledge from session (propose to inbound)
- Append audit log
- Update episodic memory (session summary)
- Append CHANGELOG.jsonl if delivery

Corresponds to **steps 7-8 ของ `High-Level Flow.md`**.

Differentiator: นี่คือที่ระบบเราเหนือ RAG tool ทั่วไป — **"learn from every turn"**

---

## 2. Signature

```typescript
interface TaskCompleteRequest {
  task_id: string                    // MSP-ACT-XXX or MSP-TSK-XXX
  session_id: SessionId
  mode: 'single_shot' | 'parallel' | 'debate' | 'tool_specialized'
  agents: string[]                   // agent IDs that participated
  
  outcome: {
    success: boolean
    confidence: number                // 0-1 from agent self-report
    response: string                  // final user-facing text
    used_knowledge_ids: string[]      // atoms consulted
  }
  
  metrics: {
    latency_ms: number
    cost_usd: number
    tokens_in: number
    tokens_out: number
    rounds?: number                   // for debate mode
  }
  
  user_feedback?: {                   // optional, filled async
    thumbs: 'up' | 'down' | null
    comment?: string
  }
}

interface TaskCompleteResponse {
  ok: boolean
  actions_taken: string[]             // what MSP did as a result
}
```

---

## 3. Flow

```
TaskCompleteRequest (from AgentLoop after response sent)
        │
        ▼
┌─ Step 1: Validate ──────────────────────────────────────┐
│  - session_id exists                                    │
│  - agents all registered                                │
│  - used_knowledge_ids all in atomic_index               │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 2: Audit Log (always) ────────────────────────────┐
│  append to .eva/logs/{session_id}.jsonl                 │
│  + tool_call_trail in .eva/logs/tools.jsonl            │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 3: Agent Stats (ADR--MULTI-AGENT-MODES) ──────────┐
│  for each agent in request.agents:                      │
│    update rolling window (last 30 days):                │
│      S_past_success += (1 if success else 0)           │
│      S_latency_samples.push(latency_ms)                 │
│      S_cost_samples.push(cost_usd)                     │
│  write ~/.msp/agent-stats.jsonl                         │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 4: Knowledge Extraction (if insight detected) ────┐
│  if session produced new ADR-worthy reasoning:          │
│    draft CONCEPT/ADR → .msp/inbound/                    │
│    frontmatter: status=raw, reviewer=MSP-USR-BOSS       │
│  (heuristic: response contained "I should", "consider   │
│   writing ADR", or structured analysis patterns)        │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 5: Episodic Memory (end of session or N turns) ───┐
│  trigger:                                               │
│    - session ending (Ctrl+D / exit)                    │
│    - idle > 30min                                       │
│    - > 30 messages accumulated                          │
│  action:                                                │
│    - Cortex summarize last N turns                      │
│    - write .eva/memory/{session_id}.md                  │
│    - tags: distilled from used_knowledge_ids + intents  │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 6: Delivery Detection (WKT + CHANGELOG) ──────────┐
│  if session produced a tangible delivery (commit, PR):  │
│    draft MSP-WKT- in gks/14_devlog/walkthrough/         │
│    append to CHANGELOG.jsonl                            │
│    if breaking or major: prompt for ~/.msp/CHANGELOG    │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 7: Emit response ─────────────────────────────────┐
│  TaskCompleteResponse with actions_taken[]              │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Trigger Conditions per Step

| Step | Always | Condition |
|---|---|---|
| Audit log | ✅ | — |
| Agent stats | ✅ | — |
| Knowledge extraction | ❌ | heuristic fires (see §5) |
| Episodic memory | ❌ | session end OR idle 30min OR 30 msgs |
| Delivery (WKT/CHANGELOG) | ❌ | git commit detected OR user typed "done" / "ship" / "deliver" |

---

## 5. Knowledge Extraction Heuristic

MSP detects "insight moments" that should become atoms:

```typescript
function isInsightMoment(response: string, context: Context): boolean {
  const signals = [
    /\bshould (we|I)\b/i,
    /\bdecide\b.*\bbetween\b/i,
    /\btrade[- ]?off\b/i,
    /\bnew ADR\b/i,
    /\bpattern\b.*\bworth\b/i,
    /\b(architect|design) decision\b/i,
  ]
  const hitCount = signals.filter((s) => s.test(response)).length
  return hitCount >= 2
}
```

If fires:
1. Cortex extracts candidate atom (CONCEPT/ADR) with frontmatter
2. Write to `.msp/inbound/<auto-id>.md`
3. Add to `TaskCompleteResponse.actions_taken`: `"proposed_atom:<id>"`
4. Human review gate (Boss manually promotes later)

---

## 6. Episodic Memory Schema

```yaml
---
id: "SESS--{session_id}"
session_id: "MSP-SESS-260422001"
started_at: 2026-04-22T08:00:00Z
ended_at: 2026-04-22T09:15:00Z
duration_min: 75
participants:
  - MSP-USR-BOSS
  - MSP-AGT-EVA-COWORK
tokens_total: 12450
cost_usd: 0.42
tags: [architecture, scoring-formula, context-packing]
linked_atoms:
  - ADR--SCORING-FORMULA
  - ADR--CONTEXT-WINDOW-STRATEGY
emotion_summary: "focused design discussion, boss engaged and productive"
outcomes:
  - Approved ADR--SCORING-FORMULA for merge
  - Identified 3 tasks for Wave 3 indexer
  - Deferred ADR--MULTI-AGENT-MODES details until after Wave 2
---

# Session Summary

## Key Decisions
- Weighted sum chosen over RRF for reranking...

## Knowledge Created
- ...

## Next Actions
- ...
```

---

## 7. Agent Stats Schema

`~/.msp/agent-stats.jsonl` (append-only, analyzed on read)

```jsonl
{"ts":"2026-04-22T09:15:00Z","agent":"MSP-AGT-EVA-COWORK","task_id":"MSP-ACT-...","success":true,"confidence":0.91,"latency_ms":12400,"cost_usd":0.08,"mode":"debate"}
{"ts":"2026-04-22T09:30:00Z","agent":"MSP-AGT-RWANG-IDE","task_id":"...","success":true,"confidence":0.85,"latency_ms":8200,"cost_usd":0.00,"mode":"single_shot"}
```

On read (for routing decisions):
```typescript
function getAgentStats(agentId: string, windowDays = 30): AgentStats {
  const cutoff = Date.now() - windowDays * 86400000
  const entries = tailJsonl('~/.msp/agent-stats.jsonl')
    .filter((e) => e.agent === agentId && Date.parse(e.ts) > cutoff)
  return {
    success_rate: sum(e => e.success) / entries.length,
    p50_latency: percentile(entries.map(e => e.latency_ms), 0.5),
    avg_cost: avg(entries.map(e => e.cost_usd)),
    sample_size: entries.length,
  }
}
```

---

## 8. Audit Log

`.eva/logs/{session_id}.jsonl` — one event per task/turn:

```jsonl
{"ts":"2026-04-22T08:15:00Z","event":"task_complete","task_id":"MSP-ACT-260422001","mode":"single_shot","agents":["MSP-AGT-EVA-COWORK"],"success":true,"confidence":0.88,"latency_ms":4200,"tokens_in":850,"tokens_out":420,"cost_usd":0.015,"knowledge_ids":["CONCEPT--EVA-TRI-BRAIN"]}
```

**Query examples** (via jq):
```bash
# cost per day
jq -c 'select(.event=="task_complete")' .eva/logs/*.jsonl | jq -s 'group_by(.ts[:10]) | .[] | {day: .[0].ts[:10], total_usd: ([.[] | .cost_usd] | add)}'

# failure patterns
jq -c 'select(.success==false)' .eva/logs/*.jsonl | head
```

---

## 9. Consequences

### Positive
- **Continuous learning**: agent performance tracked, routing improves over time
- **Knowledge compounds**: every session can create atoms (if insight detected)
- **Audit complete**: every action traceable
- **Session memory**: future sessions can recall past decisions
- **Delivery formal**: WKT + CHANGELOG consistent

### Negative
- Post-processing adds ~100-500ms latency (ส่งก่อน user เห็น response = OK ถ้า async)
- Agent stats disk writes per task (mitigated by append-only jsonl)
- Insight heuristic may miss or false-positive (Boss can review inbound)

### Risks
- **Heuristic false positive** → inbound queue fills with junk → mitigate with Boss's periodic review + auto-expire after 30 days
- **Agent stats write contention** (if multi-agent writes same file) → use file locks or partition by agent
- **Episodic memory bloat** → summarize-summaries after 100 sessions

---

## 10. Invariants

- **I1**: task_complete is **idempotent** — calling twice with same task_id is no-op after first
- **I2**: audit log append-only (never mutate past entries)
- **I3**: failure in any step **does not** block user from seeing response (all async after response rendered)
- **I4**: knowledge extraction **never** writes to `gks/` directly (always `.msp/inbound/`)
- **I5**: agent stats truncate at 90 days (rolling window, compact at 100MB)

---

## 11. Error Handling

| Error | Action |
|---|---|
| Audit log write fails | Log to stderr, continue (not fatal) |
| Agent stats file locked | Retry 3x with backoff, then skip |
| Insight heuristic throws | Skip extraction, continue |
| Episodic summarize fails | Fall back to concatenated message tails |
| WKT write fails | Warn user, suggest manual creation |
| CHANGELOG append conflict | Use advisory lock (fcntl), retry |

---

## 12. Implementation

**Files**:
- `eva-cli/src/orchestrator/feedback.ts` — task_complete entry point
- `eva-cli/src/orchestrator/insight-detector.ts` — heuristic fire
- `eva-cli/src/memory/agent-stats.ts` — append + query
- `eva-cli/src/memory/consolidator.ts` — episodic summary (exists, extend)
- `scripts/msp/write-wkt.mjs` — triggered by Stop hook

**Maps to IMP**:
- (new wave) Wave 6: Governance & Learning
- T28: task.complete event handler
- T29: insight detector + auto-propose
- T30: agent-stats store
- T31: WKT auto-draft
- T32: CHANGELOG.jsonl append

**Triggered from**: AgentLoop.end() after response sent (`FLOW--REACT-LOOP` Phase 7)

---

## 13. Test scenarios

| Test | Mode | Scenario |
|---|---|---|
| unit | insight-detector | multi-signal regex triggers correctly |
| unit | agent-stats | window rollover works, concurrent writes ordered |
| integration | task.complete | all 7 steps execute in order |
| integration | task.complete | idempotent (run twice) |
| integration | episodic | triggered at session end, not mid-session |
| E2E | full loop | response → task.complete → audit file grows |
