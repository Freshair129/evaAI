---
id: "ENTITY--SESSION-STATE"
phase: 2
type: "entity"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.82
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-TRI-BRAIN"]
  implements: ["FLOW--REACT-LOOP"]
  used_by: []
---

# ENTITY--SESSION-STATE — Session Data Model

> **Phase:** P2 — Entity Definition

---

## 1. Core Types

```typescript
// sessionId follows MSP-SESS-YYMMDDXXX format per registry.yaml
type SessionId = `MSP-SESS-${string}`

interface Session {
  id: SessionId
  startedAt: string           // ISO timestamp
  endedAt?: string
  userId: string              // e.g., MSP-USR-BOSS
  agentId: string             // e.g., MSP-AGT-EVA-COWORK
  workspace: string           // absolute path

  permissions: PermissionMode
  history: Message[]
  traces: StepTrace[]

  // Statistics
  stats: {
    tokens_in: number
    tokens_out: number
    cost_usd: number
    tool_calls: number
    brain_calls: Record<BrainId, number>
  }

  // Current state
  status: 'active' | 'waiting_user' | 'ended' | 'cancelled'
  currentPlan?: Plan
  currentBrain?: BrainId
}

type PermissionMode = 'auto' | 'confirm-each' | 'plan-only'
type BrainId = 'cortex' | 'motor' | 'limbic'
```

---

## 2. Message

```typescript
interface Message {
  id: string                  // ULID
  sessionId: SessionId
  role: 'user' | 'agent' | 'system' | 'tool'
  content: string
  intent?: Intent             // ถ้า role = 'user'
  createdAt: string
  tokens?: number
}

interface Intent {
  taskType: TaskType
  urgency: 'low' | 'normal' | 'high' | 'critical'
  emotion: 'neutral' | 'happy' | 'frustrated' | 'urgent' | 'curious'
  entities: Array<{ kind: string; value: string }>
  hidden_concerns?: string[]  // ที่ LIMBIC อ่านระหว่างบรรทัด
  rewrittenQuery: string      // รูปแบบที่ CORTEX ใช้ค้น
  confidence: number          // 0-1
}
```

---

## 3. Plan & Step

```typescript
interface Plan {
  id: string
  goal: string
  reasoning: string           // Chain-of-thought จาก CORTEX
  steps: Step[]
  estimated: {
    duration_ms: number
    cost_usd: number
    tokens: number
  }
  risky: boolean              // true ถ้ามี write/exec/network
  createdBy: BrainId
  createdAt: string
}

type Step =
  | ToolCallStep
  | BrainCallStep
  | MemoryOpStep
  | UserInputStep

interface ToolCallStep {
  id: string
  kind: 'tool_call'
  tool: string                // 'bash' | 'read' | 'edit' | ...
  args: unknown
  critical: boolean           // fail = abort loop
}

interface BrainCallStep {
  id: string
  kind: 'brain_call'
  subtype: 'code_gen' | 'review' | 'summarize' | 'thai_stylize'
  prompt: string
  context: string[]           // IDs of atomic notes to include
}

interface MemoryOpStep {
  id: string
  kind: 'memory_op'
  op: 'search' | 'recall' | 'write_episodic' | 'propose_inbound'
  args: unknown
}

interface UserInputStep {
  id: string
  kind: 'user_input'
  question: string
  schema?: unknown            // zod schema ของคำตอบที่คาด
}
```

---

## 4. Step Trace

```typescript
interface StepTrace {
  stepId: string
  startedAt: string
  endedAt: string
  status: 'success' | 'fail' | 'denied' | 'error' | 'cancelled'
  input: unknown
  output?: unknown
  error?: string
  unexpected?: boolean        // trigger reflection
  metrics: {
    latency_ms: number
    tokens?: number
    cost_usd?: number
  }
}
```

---

## 5. Persistence Layout

```
.brain/msp/projects/evaAI/
├── sessions/
│   └── MSP-SESS-260421001/
│       ├── session.json           # Session meta
│       ├── messages.jsonl         # chronological messages
│       ├── traces.jsonl           # step traces
│       └── plan-<id>.json         # snapshots
├── memory/
│   └── MSP-SESS-260421001.md      # consolidated episodic (markdown)
├── vector/
│   ├── atomic.jsonl
│   ├── obsidian.jsonl
│   └── episodic.jsonl
└── logs/
    └── 260421.jsonl               # all structured logs
```

---

## 6. Lifecycle

```
 CREATE ──▶ ACTIVE ──▶ WAITING_USER ──▶ ACTIVE ──▶ ENDED
                │                                   ▲
                └──── CANCELLED ────────────────────┘
```

| Event | State Change | Side Effect |
|---|---|---|
| `eva start` | create → ACTIVE | write `session.json` |
| user message | — | append `messages.jsonl` |
| tool call needs confirm | ACTIVE → WAITING_USER | show dialog |
| user approves | WAITING_USER → ACTIVE | — |
| `exit` / `Ctrl+D` | → ENDED | consolidate memory |
| `Esc` during step | → CANCELLED | abort, save partial |
| idle 30min | → ENDED (auto) | consolidate |

---

## 7. Session ID Generation

ตาม `registry.yaml` format `MSP-SESS-[YYMMDD][SERIAL]`:

```typescript
function generateSessionId(date = new Date()): SessionId {
  const yymmdd = date.toISOString().slice(2,10).replace(/-/g,'')
  const existing = readdirSync(`.brain/msp/projects/evaAI/sessions`)
    .filter(d => d.startsWith(`MSP-SESS-${yymmdd}`))
  const serial = String(existing.length + 1).padStart(3, '0')
  return `MSP-SESS-${yymmdd}${serial}`
}
```

---

## 8. Invariants

- `session.id` immutable after creation
- `messages.jsonl` append-only
- `stats.cost_usd` monotonically increases
- ไม่มี 2 session ใช้ `id` เดียวกัน (serial check)
- `status === 'ended'` → must have `endedAt`
- `permissions` เปลี่ยนกลางเซสชันได้ แต่ log event
