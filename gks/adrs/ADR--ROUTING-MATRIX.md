---
id: "ADR--ROUTING-MATRIX"
phase: 2
type: "adr"
status: "stable"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.78
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-TRI-BRAIN"]
  implements: ["FRAME--TRI-BRAIN-ARCHITECTURE"]
  used_by: []
---

# ADR--ROUTING-MATRIX — Task-Based Brain Routing

> **Status:** Proposed
> **Date:** 2026-04-21
> **Deciders:** MSP-USR-BOSS, MSP-AGT-EVA-COWORK

---

## Context

Agent มี 3 สมอง (Cortex / Motor / Limbic) ที่ต้นทุน, ความเร็ว, และความถนัดต่างกัน — จำเป็นต้องมีตัว router กลางที่เลือกสมองที่เหมาะสมโดยอัตโนมัติ โดยไม่ให้ user ต้องเลือกเองเหมือน eva-cli v1

---

## Decision

ใช้ **Task-based Router** (rule-based + LLM-assisted classifier) แทนการให้ user เลือก mode ด้วยมือ

### Stage 1 — Fast Classifier (LIMBIC)
Typhoon (ThaiLLM) รับ input Thai → classify เป็น 1 ใน `TaskType`:

```typescript
type TaskType =
  | 'chat_casual'          // ทักทาย, small talk
  | 'chat_thai_complex'    // คำถามไทยซับซ้อน/วัฒนธรรม
  | 'plan_architecture'    // วางแผน, เลือก approach
  | 'code_generate'        // เขียนโค้ดใหม่
  | 'code_edit'            // แก้โค้ดเล็กน้อย
  | 'code_review'          // รีวิวโค้ด
  | 'sql_gen'              // SQL/Prisma
  | 'analyze_log'          // อ่าน log, debug
  | 'knowledge_recall'     // "เมื่อวานคุยเรื่องอะไร"
  | 'knowledge_search'     // หา ADR/CONCEPT
  | 'doc_write'            // เขียน ADR/SPEC
  | 'write_adr'            // ตัดสินใจใหญ่
```

### Stage 2 — Routing Table

| TaskType | Primary Brain | Secondary | Memory Retrieval |
|---|---|---|---|
| `chat_casual` | LIMBIC | — | none |
| `chat_thai_complex` | LIMBIC → CORTEX | LIMBIC (stylize) | gks_search |
| `plan_architecture` | CORTEX | LIMBIC (final) | atomic + vector |
| `code_generate` | CORTEX (plan) → MOTOR (write) | CORTEX (review) | vector + gks_search |
| `code_edit` | MOTOR | — | gks_lookup (ไฟล์นั้น) |
| `code_review` | CORTEX | — | related ADR |
| `sql_gen` | MOTOR | CORTEX (validate schema) | ENTITY-- |
| `analyze_log` | CORTEX | — | episodic |
| `knowledge_recall` | — (pure memory) | LIMBIC (stylize) | episodic + atomic |
| `knowledge_search` | — | LIMBIC (stylize) | atomic + vector |
| `doc_write` | CORTEX | LIMBIC (tone) | atomic (similar docs) |
| `write_adr` | CORTEX | LIMBIC (Thai polish) | atomic (crosslinks) |

### Stage 3 — CORTEX Model Selection (sub-router)

เมื่อเลือก CORTEX แล้ว ต้องเลือก Opus vs Gemini vs Sonnet:

| Sub-task | Default Model | Rationale |
|---|---|---|
| Complex multi-step plan (>5 steps) | **Opus 4.7** | Deep reasoning |
| Architecture decision / ADR write | **Opus 4.7** | Trade-off analysis |
| Fast code review / single file | **Sonnet 4.6** | Cheaper, still strong |
| Long-context analysis (>50k tokens) | **Gemini 2.5 Pro** | 1M context window |
| Quick plan (<3 steps) | **Haiku 4.5** | Cheapest + fast |

Fallback chain: Opus → Sonnet → Gemini → Haiku (ถ้า upstream ล่ม)

---

## Alternatives Considered

### A. User เลือก mode ด้วยมือ (เหมือน eva-cli v1)
- ❌ UX แย่, ต้องรู้ trade-off ของโมเดลเอง
- ❌ เสีย opportunity ใช้โมเดลถูก/เร็วกว่าเมื่อได้

### B. ใช้ Cortex router ทุก request
- ❌ Latency สูง (ทุก request ต้องเรียก Opus ก่อน)
- ❌ Cost บาน (Opus per-token expensive)

### C. Pure keyword regex router
- ❌ Brittle, ไม่เข้าใจ context ไทย
- ❌ ไม่แยก intent เวลาใช้คำพ้องรูป

### D. Task-based (chosen)
- ✅ LIMBIC ถูกมาก (Typhoon) → ใช้เป็น classifier ไม่เจ็บตัว
- ✅ Cortex เรียกเฉพาะเมื่อจำเป็น
- ✅ Cost/latency predictable จาก routing table

---

## Consequences

### Positive
- ประหยัด API cost 60-80% เทียบการใช้ Cortex ทุก request
- UX: user ไม่ต้องเลือกโมเดลเลย
- Swap model ได้โดยไม่กระทบ caller (เปลี่ยน `routing.yaml`)

### Negative
- Router เป็น critical path — พังแล้ว agent ใช้งานไม่ได้
- Mis-classification → routing ผิด → ผลลัพธ์เพี้ยน
- Typhoon API dependency (แต่มี fallback: route ด้วย keyword regex ถ้า Typhoon ล่ม)

### Mitigation
- Unit test ครอบ `routing.yaml` ทุก TaskType
- Fallback router: keyword regex + default = `CORTEX(Sonnet)`
- Metrics: log task_type + chosen_brain ทุก request → ปรับ table จาก data

---

## Implementation Notes

- Routing table อยู่ใน `src/config/routing.yaml` — เปลี่ยนได้โดยไม่แก้โค้ด
- Classifier prompt อยู่ใน `src/prompts/limbic.system.md`
- Router exported as `Router.route(input: UserInput) → RoutingPlan`

```yaml
# src/config/routing.yaml (excerpt)
tasks:
  code_generate:
    primary: cortex
    cortex_model: opus
    secondary: motor
    memory: [vector, gks_search]
    max_latency_ms: 30000
```

---

## Evolution — Score-based Routing + Multi-agent Modes

**Status**: this ADR (rule-based) is the **v1 baseline**. Full multi-agent routing is specified in `ADR--MULTI-AGENT-MODES`.

### What this ADR covers (v1)
- 1-dim routing: `TaskType → (primary brain + memory sources + latency budget)`
- Deterministic table lookup
- Single-shot execution

### What `ADR--MULTI-AGENT-MODES` adds (v2)
- **4 execution modes**: single-shot / parallel / debate / tool-specialized
- **Score-based agent selection** (within a chosen brain, pick between RWANG vs EVA-Cowork etc.)
- **Confidence escalation**: low confidence → retry with stronger agent or debate
- **Feedback loop**: `/msp/task.complete` updates agent stats → informs future routing

### Compatibility
- v1 table stays as **default fallback** when v2 selector doesn't override
- v2 selector reads same `routing.yaml` + extends with mode rules
- Rollout: v1 shipped (MVP merge); v2 opt-in via `.eva/settings.yaml > multi_agent.default_mode`

### When v2 supersedes v1
- When `agent-stats.jsonl` has ≥ 100 entries per active agent (enough data for `S_past_success`)
- When at least 2 active agents registered (currently EVA-Cowork only; RWANG pending)
- Until then, v2 modes fire only on explicit task type rules (e.g., `write_adr` → debate)
