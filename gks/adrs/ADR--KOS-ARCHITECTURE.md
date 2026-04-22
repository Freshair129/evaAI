---
id: "ADR--KOS-ARCHITECTURE"
phase: 2
type: "adr"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.82
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-TRI-BRAIN", "FRAME--EVA-FILE-TOPOLOGY"]
  implements: ["CONCEPT--EVA-TRI-BRAIN"]
  supersedes: []
  used_by: []
---

# ADR--KOS-ARCHITECTURE — Treat GKS as Knowledge Operating System, not RAG

> **Status:** Proposed
> **Date:** 2026-04-21
> **Deciders:** MSP-USR-BOSS, MSP-AGT-EVA-COWORK

---

## Context

EVA MVP ที่ merge ไป (PR #2) ถูกออกแบบเหมือน **RAG tool**:
- Vector store เป็นหลัก, markdown เป็น source files
- `MemoryStore.retrieve()` ทำ substring + vector, รวม hits อย่างง่าย
- ไม่มี abstraction layer ระหว่าง orchestrator กับ storage backend
- Backlinks / crosslinks ใน frontmatter ไม่ถูก parse
- Indexer (`re-indexer.mjs` + `re-embed` ที่ค้าง) ทำงานระดับ frontmatter เท่านั้น ไม่ chunk body

ปัญหา:
1. **Source of truth ไม่ชัด** — ถ้า vector store corrupt, rebuild จาก markdown ได้ แต่ถ้า markdown หาย embedding ย้อนไม่ได้ → ควร enforce markdown เป็น truth อย่างเข้มงวด
2. **Vector DB lock-in** — ถ้าอยาก swap file-based → pgvector / Pinecone ต้องแก้โค้ดหลายจุด
3. **Semantic search miss exact IDs** — ค้น "CONCEPT--POS" ด้วย vector ให้ผลแย่กว่า exact lookup
4. **ไม่มี graph query** — ค้น "ADR ทั้งหมดที่ derive จาก CONCEPT--X" ต้อง scan file ทั้งหมดเอง
5. **ไม่มี formal context API** — agent เรียก `retrieve()` ตรง ๆ ไม่มีชั้น abstraction สำหรับ budget / relations / intent

ขณะเดียวกัน Boss ใช้ระบบ MSP ข้ามหลาย project (เห็นจาก other-system permissions schema) — EVA ควรเป็น **infrastructure ที่หลาย agent ใช้ร่วม** ไม่ใช่เครื่องมือเฉพาะหน้าเดียว

---

## Decision

**ออกแบบ EVA เป็น "Knowledge Operating System" (KOS) ไม่ใช่ RAG tool**

### นิยาม KOS ในบริบทนี้

ระบบ 4 ชั้นที่แยก concern:

```
┌─────────────────────────────────────────────────────┐
│ 4. AGENT LAYER                                      │
│    CORTEX / MOTOR / LIMBIC / Connectors            │
│    → เรียก MSP API เท่านั้น                         │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│ 3. MSP ABSTRACTION LAYER                            │
│    • context.resolve(intent, filters, relations)    │
│    • knowledge.propose(atom)                        │
│    • knowledge.promote(inbound_id)                  │
│    • memory.recall(session_id)                      │
│    • audit.append(event)                            │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│ 2. RETRIEVAL / STORAGE PROVIDERS (pluggable)        │
│    • AtomicIndexProvider       — exact ID O(1)      │
│    • RipgrepFtsProvider        — keyword search     │
│    • FileVectorProvider        — semantic search    │
│    • BacklinkGraphProvider     — relation traversal │
│    • (future) PgVectorProvider, ObsidianProvider    │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│ 1. TRUTH STORE (read-only from layer 2's POV)       │
│    • gks/**/*.md           — atoms (markdown+YAML)  │
│    • ~/.gks/**/*.md        — global atoms           │
│    • CHANGELOG.jsonl       — release log            │
│    • .eva/memory/*.md      — episodic (summaries)   │
│    • .eva/sessions/**      — session transcripts    │
└─────────────────────────────────────────────────────┘
```

### กฎ (invariants)

**I1. Truth split by data class**:
- **Atoms** (concepts, decisions, designs) → **Markdown** = truth
- **Events/records/logs** (changelog, traces, audit) → **JSONL** = truth
- Vector embedding / graph edges / FTS index = **always derivable**, never truth

**I2. Write path**:
- Agent เขียน truth ตรงไม่ได้ — ต้องผ่าน `knowledge.propose()` → `.msp/inbound/`
- Human (Boss) เท่านั้นที่ promote `.msp/inbound/*.md` → `gks/**/*.md`
- Indexer (deterministic script) reads truth → writes index files

**I3. Read path**:
- Agent ถามผ่าน `context.resolve()` เท่านั้น
- `context.resolve` orchestrates providers → merge + rerank
- Agent **ห้าม** อ่าน vector files / index files ตรง — ต้องผ่าน MSP API

**I4. Pluggability**:
- ทุก provider implement `RetrievalProvider` interface
- Swap provider = แก้ config, ไม่แตะ agent code
- Test: swap `FileVectorProvider` ↔ mock ใน tests ได้

**I5. Hot-swap without loss**:
- ถ้า vector index corrupt / provider เปลี่ยน → `npm run msp:index` rebuild ได้เต็ม จาก truth
- ถ้า markdown หาย = สูญเสีย (truth หาย)

---

## Alternatives Considered

### A. คง RAG pattern เดิม (status quo)
- ✅ Simple, ทำงานได้แล้ว
- ❌ Lock-in กับ file-based vector
- ❌ ไม่รองรับ multi-agent ระยะยาว
- ❌ ต้องแก้โครงสร้างใหญ่เมื่อ scale

### B. ใช้ Vector DB เป็น source of truth (Pinecone/Qdrant only)
- ✅ Performance, scalability
- ❌ Audit trail หาย (embedding ย้อนไม่ได้)
- ❌ Human readability = 0 (JSONL ยังดีกว่า)
- ❌ Migration risk (lock-in vendor)

### C. Pure Obsidian / Pure Logseq
- ✅ Human UX ดี, มี graph view
- ❌ ไม่ programmable เท่า
- ❌ ไม่มี multi-agent primitive

### D. KOS architecture (chosen)
- ✅ Truth portable (markdown + jsonl)
- ✅ Provider swappable
- ✅ Multi-agent ready
- ✅ Hybrid retrieval = precision + recall ดีกว่า pure vector
- ❌ Complexity สูงกว่า RAG อย่างง่าย
- ❌ ต้อง maintain abstraction layer

---

## Consequences

### Positive
- Agent code แยก concern ชัด — ไม่รู้ว่า backend เป็น file หรือ cloud
- Swap vector DB ได้ (local → Supabase pgvector → Pinecone) โดยไม่แตะ agent
- Hybrid retrieval = precision ดีกว่า pure vector (เฉพาะ acronym, exact ID, named entity)
- Graph query เปิดความสามารถใหม่ ("หา ADR ที่ derive จาก X")
- MSP API เป็น contract stable — future agents ทั้ง RWANG + อนาคต consume ได้
- Audit trail ชัด: truth = markdown/jsonl committed ใน git

### Negative
- เพิ่ม 5 provider classes + 1 resolver + 1 indexer pipeline
- Latency overhead จาก orchestration layer (~10-30ms)
- Learning curve สูงขึ้นสำหรับ contributor
- ต้อง maintain interface contract — เปลี่ยน signature = breaking

### Neutral
- Code footprint โต ~1500 บรรทัด (estimate)
- Tests เพิ่ม — ทุก provider ต้องมี contract test

---

## Implementation

ดู:
- **`ADR--HYBRID-RETRIEVAL`** — รายละเอียด hybrid pipeline + cascade + rerank
- **`MSP-IMP-260421001-kos-upgrade`** — implementation plan + task checklist
- **`FRAME--EVA-FILE-TOPOLOGY`** — file layout (already merged)

---

## Success Metrics

หลัง implement ต้อง measure:

| Metric | Target |
|---|---|
| Exact ID lookup latency | < 5ms (p99) |
| FTS keyword search | < 50ms (p99) |
| Vector search (top-5) | < 200ms (p99) |
| Full hybrid resolve (all providers) | < 300ms (p99) |
| Provider swap (file → pgvector) | 0 agent code change |
| Context precision (human eval) | > 90% relevant in top-5 |
| `msp:index` full rebuild (~500 atoms) | < 2 min |

---

## Rollback

ถ้า KOS architecture complex เกินไป:
1. Keep `RetrievalProvider` interface + `FileVectorProvider` (proven value)
2. Drop graph provider (BacklinkGraphProvider) if unused
3. Keep `context.resolve()` API but simplify internals
4. ไม่ต้อง rollback full — refactor incrementally

---

## Open Questions (→ ADRs ถัดไป)

1. Reranking algorithm? (RRF / weighted sum / learned) → `ADR--RERANK-STRATEGY` (optional, future)
2. FTS backend: ripgrep (spawn) vs SQLite FTS5 vs duckdb? → `ADR--FTS-BACKEND`
3. Backlink graph persistence: JSONL vs SQLite vs in-memory? → ตัดสินใน `ADR--HYBRID-RETRIEVAL`
4. Context cache TTL? → defer, measure ก่อน
