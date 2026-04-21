---
id: "FRAME--TRI-BRAIN-ARCHITECTURE"
phase: 2
type: "framework"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.80
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-TRI-BRAIN"]
  implements: ["CONCEPT--EVA-TRI-BRAIN"]
  used_by: []
---

# FRAME--TRI-BRAIN-ARCHITECTURE — โครงสร้างโมดูลระดับระบบ

> **Phase:** P2 — Architecture Framework
> **Owner:** MSP-USR-BOSS
> **Author:** MSP-AGT-EVA-COWORK
> **Created:** 2026-04-21

---

## 1. Module Map

```
eva-cli/
├── bin/
│   └── eva.js                         # Ink renderer + CLI entry
├── src/
│   ├── orchestrator/
│   │   ├── loop.ts                    # ReAct main loop (agent kernel)
│   │   ├── router.ts                  # Task → Brain routing matrix
│   │   ├── session.ts                 # MSP-SESS lifecycle
│   │   ├── permissions.ts             # auto / confirm / plan-only
│   │   └── tool-executor.ts           # Safe tool dispatch + sandbox
│   │
│   ├── brains/
│   │   ├── types.ts                   # BrainAdapter interface
│   │   ├── cortex/
│   │   │   ├── opus.ts                # Anthropic client
│   │   │   ├── gemini.ts              # Google client
│   │   │   └── model-router.ts        # เลือก Opus vs Gemini ตาม task
│   │   ├── motor/
│   │   │   └── qwen.ts                # Ollama client (stream)
│   │   └── limbic/
│   │       ├── typhoon.ts             # ThaiLLM client
│   │       └── intent-extractor.ts    # parse → {action, urgency, emotion}
│   │
│   ├── memory/
│   │   ├── gks.ts                     # atomic_index.jsonl reader
│   │   ├── obsidian-mcp.ts            # MCP client → Obsidian REST API
│   │   ├── vector/
│   │   │   ├── embedder.ts            # text → float[]
│   │   │   ├── index.ts               # .brain/msp/vector/*.jsonl store
│   │   │   └── similarity.ts          # cosine in-memory top-k
│   │   ├── episodic.ts                # .brain/msp/.../memory/ writer
│   │   └── consolidator.ts            # session end → compress to atomic
│   │
│   ├── tools/
│   │   ├── registry.ts                # tool name → handler
│   │   ├── bash.ts
│   │   ├── fs/
│   │   │   ├── read.ts
│   │   │   ├── write.ts
│   │   │   ├── edit.ts
│   │   │   ├── glob.ts
│   │   │   └── grep.ts
│   │   ├── knowledge/
│   │   │   ├── gks-search.ts
│   │   │   ├── gks-lookup.ts
│   │   │   └── obsidian-link.ts
│   │   └── schemas.ts                 # zod schemas for each tool
│   │
│   ├── ui/
│   │   ├── app.tsx                    # Ink <App/> root
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ContextPanel.tsx
│   │   │   ├── BrainActivity.tsx
│   │   │   ├── ToolCall.tsx
│   │   │   └── PermissionDialog.tsx
│   │   ├── hooks/
│   │   │   ├── use-session.ts
│   │   │   └── use-brain-stream.ts
│   │   └── theme.ts
│   │
│   ├── prompts/
│   │   ├── cortex.system.md
│   │   ├── motor.system.md
│   │   ├── limbic.system.md
│   │   └── tool-descriptions.md
│   │
│   ├── config/
│   │   ├── models.yaml                # model endpoints + defaults
│   │   ├── routing.yaml               # task → brain mapping rules
│   │   └── permissions.yaml           # per-tool default permission
│   │
│   └── lib/
│       ├── logger.ts
│       ├── doppler.ts                 # load secrets
│       └── streaming.ts               # SSE helpers
│
├── test/
│   ├── brains/
│   ├── memory/
│   └── e2e/
│
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 2. Layering (Dependency Direction)

```
        ┌──────────────┐
        │   UI (Ink)   │           — top layer, pure rendering
        └──────┬───────┘
               │ events
        ┌──────▼───────┐
        │ Orchestrator │           — ReAct loop + router
        └──┬───┬───┬───┘
           │   │   │
     ┌─────▼┐ ┌▼──┐ ┌▼──────┐
     │Brains│ │Tools│ │Memory│    — interchangeable adapters
     └──────┘ └─────┘ └──────┘
           │                │
        ┌──▼────────────────▼──┐
        │   External Services   │  — Anthropic/Google/Ollama/ThaiLLM/FS
        └───────────────────────┘
```

**Rule**: Upper layers depend on lower. Lower layers MUST NOT import from upper.

---

## 3. Core Interfaces

### 3.1 BrainAdapter

```typescript
interface BrainAdapter {
  readonly id: 'cortex' | 'motor' | 'limbic'
  readonly model: string
  readonly capabilities: Capability[]

  invoke(input: BrainInput): AsyncIterable<BrainChunk>
  estimateCost(input: BrainInput): Cost
}

type Capability =
  | 'reasoning' | 'planning' | 'code_gen' | 'sql_gen'
  | 'thai_nlu' | 'intent_extraction' | 'tool_use'

interface BrainInput {
  system: string
  messages: Message[]
  tools?: ToolDescriptor[]
  stream?: boolean
  maxTokens?: number
}

interface BrainChunk {
  type: 'text' | 'tool_call' | 'thinking' | 'done'
  content: string
  metadata?: Record<string, unknown>
}
```

### 3.2 Tool

```typescript
interface Tool<I, O> {
  name: string
  description: string
  inputSchema: z.ZodSchema<I>
  permission: 'auto' | 'confirm' | 'forbidden'
  sideEffect: 'read' | 'write' | 'exec' | 'network'

  execute(input: I, ctx: ToolContext): Promise<O>
}

interface ToolContext {
  sessionId: string
  cwd: string
  permissions: PermissionMode
  logger: Logger
}
```

### 3.3 Memory Layer

```typescript
interface MemoryStore {
  // Retrieval
  searchAtomic(query: string, limit?: number): Promise<AtomicHit[]>
  searchVector(embedding: number[], topK: number): Promise<VectorHit[]>
  searchObsidian(query: string): Promise<ObsidianHit[]>
  getEpisodic(sessionId: string): Promise<EpisodicMemory | null>

  // Write
  writeEpisodic(memory: EpisodicMemory): Promise<void>
  proposeInbound(artifact: Artifact): Promise<{ path: string; reviewId: string }>
}
```

---

## 4. Data Flow (Happy Path)

```
[User types Thai]
      │
      ▼
LIMBIC.invoke()
      │ → intent: {action: "refactor", urgency: "normal", target: "cart.ts"}
      ▼
Router.route(intent)
      │ → plan needed? YES → CORTEX
      ▼
Memory.searchAtomic("refactor cart") + searchVector(embed)
      │ → [CONCEPT--POS, ADR--042, FLOW--checkout]
      ▼
CORTEX.invoke(intent + context)
      │ → Plan { steps: [read, analyze, propose_diff] }
      ▼
Orchestrator loop:
  for step in plan:
    if step.tool:
      Tools.execute(step.tool, step.args)   ← permission check
    else if step.brain == 'motor':
      MOTOR.invoke(step.prompt)
    Memory.appendTrace(step.result)
      │
      ▼
LIMBIC.stylize(final_result, style="polite_thai")
      │
      ▼
[Stream to Ink UI]
      │
      ▼
Session.end()
  → Episodic.write()
  → Consolidator.proposeIfNew()
```

---

## 5. Concurrency Model

- **Single active brain at a time** (VRAM constraint บน 12GB)
- **CORTEX API** + **MOTOR local** **ห้ามทำงานพร้อมกัน** (swap VRAM)
- **LIMBIC API** สามารถทำงานคู่ขนานกับ local ได้ (network ไม่ใช้ VRAM)
- Tool execution: **sequential** ใน 1 step, **parallel** เฉพาะเมื่อ Cortex ระบุชัด

---

## 6. Configuration Source Priority

1. CLI flag (`--model=opus`)
2. Environment variable (`EVA_BRAIN_CORTEX=gemini`)
3. `src/config/*.yaml` (project defaults)
4. Hard-coded fallback

Secrets: **Doppler only**, ไม่มีใน YAML

---

## 7. Observability

- **Structured logs** → `.brain/msp/projects/evaAI/logs/[sessionId].jsonl`
- **Brain activity stream** → UI panel (real-time)
- **Tool audit trail** → `gks/audits/AUDIT--<date>-<session>.md`
- **Token/cost tracking** → session summary

---

## 8. Testing Strategy

| Layer | Test Type | Framework |
|---|---|---|
| `lib/`, `memory/vector/` | Unit | Vitest |
| Brain adapters | Mock + contract | Vitest + MSW |
| Tools | Integration (real FS, sandboxed) | Vitest + tmp-dir |
| Orchestrator loop | Scenario-based | Vitest |
| UI | Component snapshot | ink-testing-library |
| E2E | Record & replay prompts | Custom harness |

---

## 9. Non-Goals (ยืนยันเฟสแรก)

- ไม่มี persistent DB (ใช้ file ทั้งหมด)
- ไม่มี web server / HTTP API
- ไม่มี multi-tenancy
- ไม่มี plugin system (tools เป็น static registry)
