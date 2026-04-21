---
id: "CONCEPT--EVA-TRI-BRAIN"
phase: 1
type: "concept"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.82
  source_type: "direct_experience"
crosslinks:
  derived_from: ["IDEA--EVA-HYBRID-CLI"]
  implements: []
  used_by: []
---

# CONCEPT--EVA-TRI-BRAIN — Agentic Agent with 3-Brain Architecture

> **Phase:** P1 — Business/Product Concept
> **Owner:** MSP-USR-BOSS
> **Author:** MSP-AGT-EVA-COWORK
> **Created:** 2026-04-21
> **Supersedes:** `eva-cli/bin/eva.js` v1.0 (CLI-only prototype)

---

## 1. Vision

สร้าง **Agentic Agent** ที่มี runtime และ UX เทียบเคียง **Claude Code / Gemini CLI** แต่ปรับให้เหมาะกับบริบทการทำงานแบบไทย โดยรวมจุดเด่นของโมเดล AI 3 กลุ่มเข้าด้วยกัน และใช้ **GKS + Obsidian** เป็น Second Brain ถาวร

**Core value**: *"หนึ่ง agent สามสมอง — คิด, ทำ, เข้าใจเรา"*

---

## 2. Problem Statement

ระบบ `eva-cli` เดิม (v1.0) มีข้อจำกัด:

1. **Stateless** — ทุกคำสั่งเริ่มจากศูนย์ ไม่มีความจำข้ามเซสชัน
2. **ไม่มี Tool Use Loop** — แค่ถาม-ตอบ 1 ครั้ง, regex จับ command แบบ fragile
3. **เลือก model ด้วยมือ** — user ต้องเลือก Typhoon/Qwen/Gemma เองทุกครั้ง
4. **ไม่มี Knowledge Retrieval** — ไม่ดึงบริบทจาก GKS/Obsidian vault
5. **ไม่เข้าใจบริบทไทย** — ไม่ถอดเจตนาแฝง/อารมณ์/ความเร่งด่วน
6. **Security gap** — `execSync` จาก regex LLM output ไม่มี tool registry

---

## 3. Solution: Tri-Brain Architecture

Agent มี **3 สมอง** ทำงานร่วมกันผ่าน **Orchestrator** กลาง และใช้ **Hippocampus** เป็นความจำร่วม

### 3.1 CORTEX — สมองวิเคราะห์/ให้เหตุผล
- **Model**: Claude Opus 4.7 / Gemini 2.5 Pro (Router เลือกตาม task)
- **Function**: Planning, task decomposition, ADR writing, architecture decisions, code review
- **I/O**: Input = user intent + retrieved context → Output = Plan YAML / structured JSON
- **Activation**: เมื่อ task ต้องการการคิดเชิงสถาปัตยกรรม หรือแตกงาน > 3 ขั้น

### 3.2 MOTOR — สมองอัตโนมัติ/ช่างฝีมือ
- **Model**: Qwen 2.5 Coder 14B (Ollama local, quantized q4_K_M)
- **Function**: Code generation, SQL, Prisma schema, unit test, diff
- **I/O**: Input = blueprint/microtask → Output = code blocks / unified diff
- **Activation**: เมื่อ step ระบุว่า "เขียนโค้ด/แก้ไฟล์/gen SQL"
- **Rationale**: Local = fast + private + ไม่กิน API budget

### 3.3 LIMBIC — สมองภาษา/อารมณ์/บริบทไทย
- **Model**: Typhoon (ThaiLLM) API
- **Function**:
  - Parse Thai input → ถอดเจตนาแฝง (hidden intent)
  - Detect emotion/urgency (เช่น "เอาให้เสร็จวันนี้!" vs "ลองดูเล่นๆ")
  - Style guard output → ภาษาสุภาพ, คำราชาศัพท์, สำนวนไทย
  - Small talk (ไม่ส่งต่อให้ Cortex เปลืองโควต้า)
- **Activation**: ทุก input ที่เป็นภาษาไทย, ทุก output ก่อนส่งกลับ user

### 3.4 HIPPOCAMPUS — ความจำ/Knowledge Base
- **GKS Atomic** (`gks/` + `atomic_index.jsonl`) — Structured long-term memory
- **Obsidian Vault** — Graph-based linking, ผ่าน **MCP + REST API plugin**
- **File-based Vector Store** — embedding index ใน `.brain/msp/vector/*.jsonl` (cosine similarity in-memory)
- **Episodic Memory** — `.brain/msp/projects/evaAI/memory/` (session summaries, rich metadata)

---

## 4. User Experience

### 4.1 Runtime: TUI (Ink-based)

เปิด agent ด้วย `eva` → เต็มจอ terminal

```
┌─ EVA Tri-Brain Agent ──────────────────────── [opus/qwen/typhoon] ─┐
│                                                                     │
│  [Chat Panel]                    │  [Context Panel]                │
│  Boss: ช่วย refactor ฟังก์ชัน...    │  Retrieved:                     │
│  EVA:  ได้ครับ 🔍 กำลังค้นหา...     │  - CONCEPT--POS-SYSTEM          │
│                                    │  - ADR--042 (db naming)         │
│  [Tool: gks_search("refactor")]   │  - FLOW--checkout              │
│  └─ Found 3 atomic notes          │                                │
│                                                                     │
│  [Tool: read("src/pos/cart.ts")]  │  [Brain Activity]              │
│  └─ 240 lines                     │  LIMBIC   ████░░ parsing      │
│                                    │  CORTEX   ██████ planning     │
│  > _                              │  MOTOR    ░░░░░░ idle         │
│                                                                     │
└─ Tab: switch panel · Esc: cancel · Ctrl+P: permissions ────────────┘
```

### 4.2 Permission Modes (เหมือน Claude Code)

| Mode | Behavior |
|---|---|
| `auto` | รันทุก tool โดยไม่ถาม (เหมาะ trusted workflow) |
| `confirm-each` | ถาม y/N ทุกครั้งก่อนรัน tool ที่เสี่ยง (Bash/Write/Edit) |
| `plan-only` | แสดง plan อย่างเดียว ไม่รัน tool |

---

## 5. Scope — เฟสแรก (MVP)

### In Scope
- ✅ TUI ด้วย Ink + React
- ✅ 3 brain adapters + task-based router
- ✅ File-based vector store (no external DB)
- ✅ Tool registry: Bash, Read, Write, Edit, Grep, Glob, GKS_Search, Obsidian_MCP
- ✅ MSP Session tracking (MSP-SESS-YYMMDD-XXX)
- ✅ Episodic memory write-back
- ✅ Permission system (3 modes)

### Out of Scope (Phase 2+)
- ❌ Multi-user / remote agent
- ❌ Browser automation tool
- ❌ Image/multimodal input
- ❌ Fine-tuning local models
- ❌ Cloud-hosted version

---

## 6. Success Metrics

| Metric | Target |
|---|---|
| Time-to-first-response | < 2s (LIMBIC only) |
| Time-to-code-artifact | < 15s (Cortex plan → Motor code, 1 file) |
| Context recall accuracy | > 85% (retrieve relevant GKS atom given Thai query) |
| Thai intent classification | > 90% (action / question / chat / complaint) |
| Tool call safety | 0 destructive commands executed without confirm |

---

## 7. Key User Stories

- **US-01** — *"Boss พิมพ์ภาษาไทยโยนงาน → agent เข้าใจเจตนา + แตกงาน + ลงมือ"*
- **US-02** — *"agent จำได้ว่าเคยคุยเรื่อง POS กับ Boss เมื่อวาน → ดึง context มาใช้ต่อ"*
- **US-03** — *"agent เขียนโค้ดใหม่ → อ้าง ADR/CONCEPT ที่เกี่ยวข้องในคอมเมนต์ commit"*
- **US-04** — *"agent ตรวจพบว่า code ขัดกับ ADR → เตือน Boss ก่อนแก้"*
- **US-05** — *"agent ปิด session → เขียน Episodic memory + อัปเดต atomic_index อัตโนมัติ"*

---

## 8. Dependencies

### Technical
- Node.js ≥ 20, TypeScript 5+
- Ollama running locally (qwen2.5-coder:14b-instruct-q4_K_M)
- API keys via Doppler: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `THAILLM_API_KEY`
- Obsidian Local REST API plugin + MCP connector

### Knowledge
- `registry.yaml` — ID conventions
- `Metadata Standard.md` — frontmatter schema
- `FRAMEWORK_MASTER_SPEC.md` — overall governance

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Local Qwen 14B ใช้ VRAM เกิน 12GB | High | Quantize q4_K_M + sequential (ไม่โหลดคู่ Gemma) |
| API cost บาน (Opus) | Medium | Router เลือก Sonnet/Haiku ถ้า task เบา |
| ThaiLLM rate limit | Medium | Cache common intents + fallback Opus Thai |
| Tool call ทำลายไฟล์ | Critical | Permission system + dry-run preview + git safety |
| Obsidian vault corrupt | High | เขียนผ่าน inbound queue (human review), ไม่เขียน vault ตรง |

---

## 10. Next Artifacts (ที่จะสร้างต่อ)

- [ ] `FRAME--TRI-BRAIN-ARCHITECTURE.md` (P2) — สถาปัตยกรรมระดับโมดูล
- [ ] `ADR--ROUTING-MATRIX.md` (P2) — กฎการเลือกสมอง
- [ ] `ADR--FILE-BASED-VECTOR.md` (P2) — เหตุผลเลือก file-based ไม่ใช้ Qdrant
- [ ] `ADR--TUI-INK-STACK.md` (P2) — เลือก Ink + React
- [ ] `FLOW--REACT-LOOP.md` (P2) — flow การทำงานรอบหนึ่ง
- [ ] `FLOW--MEMORY-RECALL.md` (P2) — flow ดึงความจำ
- [ ] `ENTITY--SESSION-STATE.md` (P2) — schema ของ session
- [ ] `BLUEPRINT--brains.yaml` (P3) — brain adapter spec
- [ ] `BLUEPRINT--tools.yaml` (P3) — tool registry spec
- [ ] `BLUEPRINT--memory.yaml` (P3) — memory layer spec
- [ ] Microtasks T1–T20 (P4)

---

## 11. Approval Gate

- [ ] Boss review & approve
- [ ] Move status `raw` → `stable` before writing P2 artifacts
