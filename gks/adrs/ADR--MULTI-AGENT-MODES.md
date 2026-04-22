---
id: "ADR--MULTI-AGENT-MODES"
phase: 2
type: "adr"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.75
  source_type: "inference"
crosslinks:
  derived_from: ["ADR--ROUTING-MATRIX", "ADR--GKS-ARCHITECTURE"]
  implements: ["ADR--ROUTING-MATRIX"]
  supersedes: []
  used_by: []
---

# ADR--MULTI-AGENT-MODES — Single-shot / Parallel / Debate / Tool-specialized + Confidence Escalation

> **Status:** Proposed · **Date:** 2026-04-21

---

## Context

`ADR--ROUTING-MATRIX` ระบุ rule-based routing: TaskType → brain (cortex/motor/limbic). แต่ ไม่รองรับ:
- **Parallel** agents (2 ตัวทำคนละงานพร้อมกัน)
- **Debate** (agent A โต้แย้ง agent B)
- **Tool-specialized** (agent A retrieve, agent B reason, agent C format)
- **Confidence escalation** (ต่ำ → agent แรง, สูง → agent เร็ว)
- Multi-registry future (RWANG ใน Antigravity + EVA ใน Claude + อนาคต)

ปัจจุบัน loop ทำแค่ **single-shot** — 1 query → 1 brain chain — ไม่ใช้ศักยภาพ multi-agent ของ registry ที่ Boss ออกแบบไว้

---

## Decision

รองรับ **4 modes** + **confidence escalation** + **score-based agent selection**

### 4 Modes

```
┌─────────────────────────────────────────────────────────┐
│ A. Single-shot (default)                                │
│    query → 1 agent → response                           │
│    ใช้เมื่อ: confidence > 0.8, task ไม่ซับซ้อน          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ B. Parallel (fan-out/fan-in)                            │
│    query → split → [agent A, agent B] → merge → response│
│    ใช้เมื่อ: task มี sub-concerns อิสระ                 │
│    เช่น: "explain + give code example"                  │
│          → EVA-Cortex (explain) // RWANG (code)         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ C. Debate (critique loop)                               │
│    A.answer → B.critique → A.revise → [loop N rounds]   │
│    ใช้เมื่อ: high-stakes, ADR decision, code review     │
│    budget: max 3 rounds (cost + latency cap)            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ D. Tool-specialized (pipeline)                          │
│    query → retriever-agent → reasoner-agent → formatter │
│    ใช้เมื่อ: แต่ละ step ต้องการ specialized skill       │
│    future: separate brains ต่าง specialize              │
└─────────────────────────────────────────────────────────┘
```

### Mode selection

```
function selectMode(intent, confidence, complexity, cost_budget):
  if task.is_adr_decision or task.is_architecture:
    return 'debate' if cost_budget >= threshold else 'single_shot'

  if intent == 'code' and has_sub_concern('explain'):
    return 'parallel'   # code + explain in parallel

  if intent in ['search', 'recall']:
    return 'tool_specialized'   # retriever-heavy

  if confidence < 0.6:
    return escalate()   # see below

  return 'single_shot'   # default
```

---

## Confidence Escalation

```
Initial: route per TaskType (existing ROUTING-MATRIX)
  → run agent
  → measure response.confidence
  
if response.confidence < 0.6:
  → escalate:
     option 1: retry with stronger model (Haiku→Sonnet→Opus)
     option 2: switch to debate mode
     option 3: request user clarification
  
if response.confidence < 0.4:
  → force debate mode (2 strong agents must agree)
  
if response.confidence > 0.9 AND task.risk = 'low':
  → cache response 24h (skip re-run for similar query)
```

**Confidence source**: agent self-reports via structured output:
```json
{
  "answer": "...",
  "confidence": 0.72,
  "reasoning": "...",
  "caveats": [...]
}
```

---

## Score-based Agent Selection

For each mode, MSP picks concrete agent via:

```
agentScore =
    W.skill_match   * S_skill
  + W.past_success  * S_past_success
  + W.latency_pref  * S_latency      (negative weight — lower latency better)
  + W.cost_pref     * S_cost         (negative — cheaper better)
  + W.freshness     * S_freshness    (positive — recent activity)
```

### Default weights

| Component | Weight |
|---|---|
| `W.skill_match` | 0.40 |
| `W.past_success` | 0.30 |
| `W.latency_pref` | -0.15 |
| `W.cost_pref` | -0.10 |
| `W.freshness` | 0.05 |

### Component definitions

**`S_skill`**: lookup from agent registry
```yaml
# registry.yaml (per-agent skills)
agents:
  MSP-AGT-EVA-COWORK:
    skills:
      planning: 0.95
      reasoning: 0.90
      code_gen: 0.60     # delegate to Motor
      thai_nlu: 0.95     # via Limbic
      review: 0.85
  MSP-AGT-RWANG-IDE:
    skills:
      planning: 0.75
      reasoning: 0.70
      code_gen: 0.90     # Antigravity native
      code_edit: 0.95
      review: 0.75
```

`S_skill(agent, task)` = lookup `agent.skills[task.required_skill]`

**`S_past_success`**: rolling window (last 30 days)
```
S_past_success = successful_completions / total_attempts
```
Tracked in `~/.msp/agent-stats.jsonl` per-agent

**`S_latency`**: normalized inverse of agent's p50 latency
```
S_latency = 1.0 - (p50_latency_ms / 30000)   # clamped to 0
```

**`S_cost`**: normalized inverse of per-task cost (USD)
```
S_cost = 1.0 - (cost_per_task / 0.50)
```

**`S_freshness`**: has agent been active?
```
S_freshness = 1.0 if active_within_7_days else 0.5
```

---

## Mode Specifications (detailed)

### A. Single-shot

```
runSingleShot(query, agent):
  result = agent.invoke(query)
  if result.confidence < 0.6: consider_escalation()
  return result
```

**Invariants**:
- 1 brain call total
- No cross-agent communication
- Cheapest mode

### B. Parallel

```
runParallel(query, agents[], split_strategy):
  sub_queries = split(query, split_strategy)   # e.g., by intent facet
  results = await Promise.all(
    sub_queries.map((sq, i) => agents[i].invoke(sq))
  )
  return merge(results)
```

**Split strategies**:
- `by_intent_facet`: Limbic extracts multiple intents → each to specialized agent
- `by_scope`: global knowledge vs project-specific → different agents
- `by_modality`: explanation vs code example

**Merge strategies**:
- `concat`: join outputs with headings
- `rerank`: combine hits and rerank by coverage
- `synthesize`: Limbic writes final prose from sub-results

**Budget**: parallel ≤ 2x single-shot latency, cost = sum

### C. Debate

```
runDebate(query, agentA, agentB, rounds=3):
  answerA = await agentA.invoke(query)
  for round in 1..rounds:
    critique = await agentB.critique(query, answerA)
    if critique.agrees(): break
    answerA = await agentA.revise(query, answerA, critique)
    answerB = await agentB.invoke(query)      # optional parallel
    if convergence(answerA, answerB) > 0.85: break
  return merge(answerA, answerB, critique)
```

**Invariants**:
- Max 3 rounds (configurable, default 3)
- Cost/latency upper bound: 6x single-shot (3 × 2 calls per round)
- Early stop on convergence

**Critique prompt template**:
```
You are reviewing Agent A's answer to the user's question.
Question: {query}
Answer A: {answerA}

Identify:
1. Factual errors
2. Missing considerations
3. Architectural concerns
4. Alternative approaches

Output structured:
{
  "agrees": bool,
  "issues": [...],
  "suggested_revisions": [...]
}
```

**Use case**: ADR writing, architecture decisions, security reviews

### D. Tool-specialized (pipeline)

```
runPipeline(query, stages[]):
  state = { query, intermediate: {} }
  for stage in stages:
    state = await stage.agent.invoke(stage.prompt(state))
  return state.final
```

**Example pipeline for "explain X with code"**:
```yaml
stages:
  - role: retriever
    agent: EVA-Limbic
    prompt: "identify ID and scope"
  - role: reasoner
    agent: EVA-Cortex (Opus)
    prompt: "design approach with context {retrieved}"
  - role: coder
    agent: RWANG or EVA-Motor (Qwen)
    prompt: "implement per design {design}"
  - role: formatter
    agent: EVA-Limbic
    prompt: "present to Boss in Thai"
```

**Invariants**:
- Each stage has **structured output** (schema contract)
- Stage failure = abort pipeline (no partial results)
- Budget per stage declared; total cap enforced

---

## Feedback Loop

Every mode emits `/msp/task.complete` event:

```json
{
  "task_id": "MSP-ACT-...",
  "mode": "debate",
  "agent_ids": ["MSP-AGT-EVA-COWORK", "MSP-AGT-RWANG-IDE"],
  "success": true,
  "confidence": 0.91,
  "latency_ms": 12400,
  "cost_usd": 0.08,
  "rounds": 2,
  "used_knowledge_ids": ["CONCEPT--EVA-TRI-BRAIN", "ADR--GKS-ARCHITECTURE"],
  "user_satisfaction": null          # optional, filled async
}
```

**Writes to** `~/.msp/agent-stats.jsonl` (global) — updates `S_past_success`, `S_latency`

**After N=20 tasks per agent**: recompute running average, feed into `agentScore`

---

## Config Schema

```yaml
# .eva/settings.yaml
multi_agent:
  default_mode: single_shot
  
  mode_rules:
    - condition: "task.type == 'write_adr'"
      mode: debate
      rounds: 3
    - condition: "task.type == 'code_generate' && has_sub_concern('explain')"
      mode: parallel
    - condition: "task.type in ['knowledge_search', 'knowledge_recall']"
      mode: tool_specialized
      pipeline: default_retrieval_pipeline

  confidence_escalation:
    low_threshold: 0.6
    force_debate_threshold: 0.4
    cache_on_high: 0.9
    cache_ttl_hours: 24

  scoring:
    weights:
      skill_match: 0.40
      past_success: 0.30
      latency_pref: -0.15
      cost_pref: -0.10
      freshness: 0.05

  budgets:
    single_shot_max_ms: 15000
    parallel_max_ms: 30000
    debate_max_rounds: 3
    debate_max_ms: 60000
    pipeline_max_ms: 45000

  pipelines:
    default_retrieval_pipeline:
      - { role: retriever, agent: EVA-Limbic }
      - { role: reasoner, agent: EVA-Cortex }
      - { role: formatter, agent: EVA-Limbic }
```

---

## Alternatives Considered

### A. Keep single-shot only (status quo)
- ✅ Simple
- ❌ Under-uses multi-agent registry
- ❌ No debate for high-stakes
- Status: fallback if ADR rejected

### B. Always multi-agent (debate default)
- ✅ Highest quality
- ❌ Cost 6x per task
- ❌ Latency unacceptable for chat_casual
- Rejected

### C. User picks mode explicitly
- ✅ Transparent
- ❌ UX friction (every message ต้องเลือก)
- Hybrid: allow override but auto by default

### D. 4-mode auto-selection (chosen)
- ✅ Right mode for right task
- ✅ Cost-aware
- ✅ Multi-agent ready
- ❌ Mode selection logic complex
- ❌ Debate testing non-trivial

---

## Consequences

### Positive
- Multi-agent **actually used** (not just declared in registry)
- High-stakes tasks get debate = better quality
- Cheap tasks stay cheap (single-shot default)
- Cost/latency predictable per mode

### Negative
- Complexity: 4 modes × testing = many cases
- Debate budget can explode if convergence never hits
- Score-based agent selection needs bootstrap data

### Risks
- **Debate doesn't converge** → force-stop at max rounds, return best-so-far with caveat
- **Cost overrun** → budget gates per mode (hard cap)
- **Stale past_success data** → weight decays by age (1-week window)

---

## Implementation

**Files**:
- `eva-cli/src/orchestrator/modes/single-shot.ts`
- `eva-cli/src/orchestrator/modes/parallel.ts`
- `eva-cli/src/orchestrator/modes/debate.ts`
- `eva-cli/src/orchestrator/modes/pipeline.ts`
- `eva-cli/src/orchestrator/mode-selector.ts`
- `eva-cli/src/orchestrator/agent-scorer.ts`
- `eva-cli/src/orchestrator/feedback.ts`

**Maps to IMP tasks** (additions):
- New T25: mode-selector + 4 mode impls
- New T26: agent-scorer
- New T27: feedback/task.complete

**Dependencies**: requires `context.resolve()` (T9) + ToolExecutor (T17)

---

## Test Plan

| Test | Mode | Scenario |
|---|---|---|
| unit | selector | task.type==write_adr → debate |
| unit | scorer | agent A wins when skill=1.0 beats agent B skill=0.5 |
| integration | single-shot | baseline latency/quality |
| integration | parallel | fan-out + merge correctness |
| integration | debate | 3-round convergence + non-convergence |
| integration | pipeline | stage schema contract failures abort |
| E2E | debate | mock 2 agents, verify cost budget enforced |
| E2E | escalation | confidence 0.3 → triggers debate |

---

## Rollback

- Default mode = `single_shot` → backward compat (current behavior)
- Turn off escalation: `low_threshold: 0.0`
- Disable per-mode rules independently
- Feedback loop optional (don't crash if agent-stats.jsonl missing)
