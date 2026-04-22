---
id: "FLOW--MSP-CONTEXT-RESOLVE"
phase: 2
type: "flow"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.80
  source_type: "inference"
crosslinks:
  derived_from: ["ADR--GKS-ARCHITECTURE", "ADR--HYBRID-RETRIEVAL", "ADR--SCORING-FORMULA", "ADR--CONTEXT-WINDOW-STRATEGY"]
  implements: ["ADR--GKS-ARCHITECTURE"]
  supersedes: []
  used_by: []
---

# FLOW--MSP-CONTEXT-RESOLVE — Inbound Query → Packed Context

> **Phase:** P2 · **Date:** 2026-04-21
> **API**: `POST /msp/context.resolve` (conceptual — internal function call in process)

---

## 1. Purpose

Transform raw user query (from Agent layer) into **packed, scored, structured context** ready to feed into a downstream model — without the agent knowing about vector DBs, providers, or scoring.

Corresponds to **steps 1-5 ของ `High-Level Flow.md`** (User Input → Context Packaging).

---

## 2. Signature

```typescript
interface ContextResolveRequest {
  query: Query                       // from ADR--HYBRID-RETRIEVAL
  intent: Intent                     // from Limbic parseIntent
  session: {
    id: SessionId
    history_ids?: string[]           // last N turns' message IDs
  }
  budget?: {
    max_tokens: number
    max_latency_ms: number
  }
  options?: {
    mode?: 'fast' | 'thorough'
    structure?: 'grouped' | 'flat'
    include_relations?: boolean
  }
}

interface ContextResolveResponse {
  packed_context: string              // rendered markdown ready for prompt
  source_ids: string[]                // IDs used
  tokens_used: number
  latency_ms: number
  providers_consulted: string[]
  breakdown: {
    provider: string
    raw_hit_count: number
    selected_count: number
    latency_ms: number
  }[]
}
```

---

## 3. Flow

```
ContextResolveRequest
        │
        ▼
┌─ Step 1: Query Normalization ───────────────────────────┐
│  - Detect query kind (exact ID / keyword / semantic)    │
│  - Determine mode (fast / thorough)                     │
│  - Apply session history if no explicit filter          │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 2: Retrieval Plan (ADR--HYBRID-RETRIEVAL) ────────┐
│  - Cascade decision:                                    │
│      exact ID regex → Atomic only                       │
│      short + filters → Atomic + FTS                     │
│      general → Atomic + FTS (parallel) + Vector if needed│
│  - Graph expansion if relations.expand* set             │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 3: Provider Dispatch (parallel where possible) ───┐
│  - AtomicIndexProvider.search(query)                    │
│  - RipgrepFtsProvider.search(query)                     │
│  - FileVectorProvider.search(query)                     │
│  - BacklinkGraphProvider.expand(seeds) [optional]       │
│  Each returns Hit[] per budget                          │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 4: Score + Rerank (ADR--SCORING-FORMULA) ─────────┐
│  - Normalize per-provider scores → 0-1                  │
│  - Compute graph sub-components (direct/shared/central) │
│  - Weighted sum: finalScore = Σ w_i * S_i              │
│  - Apply status multiplier                              │
│  - Apply diversity penalty                              │
│  - Apply type_boost per intent                          │
│  - Sort by finalScore desc                              │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 5: Context Packing (ADR--CONTEXT-WINDOW-STRATEGY) ┐
│  - Budget split (calc context_budget from model)        │
│  - Top-K per type enforcement                           │
│  - Density-aware selection                              │
│  - Summarization layer (if doc > threshold)             │
│  - Dedup + merge                                        │
│  - Render structure (heading-grouped)                   │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Step 6: Emit Response ─────────────────────────────────┐
│  - ContextResolveResponse with breakdown                │
│  - Log to .eva/logs/resolve.jsonl for observability     │
│  - Cache by query_hash if confidence > 0.9              │
└─────────────────────────────────────────────────────────┘
        │
        ▼
ContextResolveResponse
```

---

## 4. Example trace

Input:
```json
{
  "query": {
    "text": "EVA memory system",
    "mode": "auto",
    "filters": { "phase": 2 },
    "budget": { "maxHits": 5, "maxLatencyMs": 500 }
  },
  "intent": { "taskType": "chat_thai_complex", "urgency": "normal" },
  "session": { "id": "MSP-SESS-260422001" }
}
```

**Step 1 — Normalize**:
- kind: `semantic` (no ID pattern, no filters.tags)
- mode: `thorough` (since semantic required)
- no history filter

**Step 2 — Plan**:
- Cascade: general query → Atomic + FTS parallel
- Top hit score < 0.7 expected → Vector trigger
- No relations → skip Graph

**Step 3 — Dispatch** (parallel with 500ms deadline):
- Atomic: 3 hits, best=CONCEPT--EVA-TRI-BRAIN (substring match score 0.4)
- FTS: 2 hits, CONCEPT--EVA-MEMORY-CONNECTORS + ADR--GKS-ARCHITECTURE
- Vector: 5 hits, best=CONCEPT--EVA-TRI-BRAIN (cosine 0.82)
- Latency: 180ms

**Step 4 — Rerank**:
Top 3:
- `CONCEPT--EVA-TRI-BRAIN`: finalScore 0.71
- `ADR--GKS-ARCHITECTURE`: finalScore 0.66
- `FLOW--REACT-LOOP`: finalScore 0.64

**Step 5 — Pack**:
- Budget: 5000 tokens (Qwen 8k - 3k overhead)
- Top-K per type: CONCEPT:3, ADR:2
- No summarization needed (all docs < 800 tokens)
- Render grouped structure

Output packed_context:
```markdown
[CONTEXT — retrieved for: "EVA memory system"]

## Concept (foundational)
- **CONCEPT--EVA-TRI-BRAIN** (score 0.71)
  EVA's 3-brain architecture: Cortex / Motor / Limbic. Memory
  layer is unified via MemoryStore with 4 sources...

## Architecture
- **ADR--GKS-ARCHITECTURE** (score 0.66, raw)
  4-layer KOS: truth → providers → protocol → agents.

## Flow
- **FLOW--REACT-LOOP** (score 0.64)
  Phase 1 intent → 2 route → 3 retrieve → ...

[END CONTEXT]
```

tokens_used: 420
latency_ms: 210

---

## 5. Error Handling

| Error | Behavior |
|---|---|
| Provider A down | Skip, log warning, continue with remaining |
| All providers down | Return empty context + error in `breakdown[]` |
| Embedder unavailable | Skip Vector, use Atomic + FTS only |
| Budget exceeded | Truncate at last-complete section, log warning |
| Query empty | Return empty packed_context, do not consult providers |
| Relations cycle | Depth limit + visited set (handled by graph provider) |
| Summarizer fails | Fall back to first-N-tokens truncation |

---

## 6. Caching

### Resolve-level cache (optional)

```
cache_key = hash(
  query.text + JSON.stringify(query.filters) +
  query.mode + session.id
)
```

- Store in `.eva/cache/resolve/{hash}.json`
- TTL: 10 minutes (short, context evolves with session)
- Invalidate on `atomic_index.jsonl` mtime change

### Provider-level cache (handled per provider)
- Atomic: in-memory Map, invalidated on index file change
- FTS: no cache (ripgrep fast enough)
- Vector: embedding cache for queries
- Graph: in-memory, invalidated on rebuild

---

## 7. Observability

Each call logs to `.eva/logs/resolve.jsonl`:

```jsonl
{"ts":"2026-04-22T08:00:00Z","session":"MSP-SESS-...","query":"EVA memory","latency_ms":210,"providers":["atomic","fts","vector"],"hits_raw":10,"hits_selected":3,"tokens_out":420,"source_ids":["CONCEPT--EVA-TRI-BRAIN","ADR--GKS-ARCHITECTURE","FLOW--REACT-LOOP"]}
```

Metrics derived (by query dashboard):
- p50/p95/p99 latency per mode
- cache hit rate
- avg hits per query
- top-queried atoms (popular context)

---

## 8. Invariants

- **I1**: `resolve()` ไม่เขียน file ใด ๆ (read-only except log append)
- **I2**: `packed_context.length <= budget.max_tokens` เสมอ
- **I3**: ถ้า providers ทั้งหมดล่ม → ตอบว่า empty context + error, **ห้าม** crash caller
- **I4**: `source_ids` ทุกตัวต้อง exist ใน atomic_index (no phantom IDs)
- **I5**: latency total ≤ budget.max_latency_ms (hard cap via deadline)
- **I6**: ไม่ block on slow provider หลัง deadline — cancel + use partial results

---

## 9. Dependencies

- `ADR--HYBRID-RETRIEVAL` — pipeline structure
- `ADR--SCORING-FORMULA` — rank algorithm
- `ADR--CONTEXT-WINDOW-STRATEGY` — packing
- Providers from Wave 1 (T3-T6)
- HybridRetriever from Wave 2 (T7)

---

## 10. Test scenarios

| Test | Input | Expected |
|---|---|---|
| exact ID | "CONCEPT--EVA-TRI-BRAIN" | Atomic only, < 5ms, single hit |
| keyword | "tenantId" | FTS wins, body matches |
| semantic | "how does memory work" | Vector wins, paraphrase hits |
| mixed | "CONCEPT design explain" | all 3 providers contribute |
| relations | seedIds + expand | Graph expands top hits |
| budget squeeze | max_tokens=100 | truncated context, 1 doc |
| all down | providers offline | empty, no crash |
| cache hit | same query twice | 2nd call < 10ms from cache |
