---
id: "ADR--HYBRID-RETRIEVAL"
phase: 2
type: "adr"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.80
  source_type: "inference"
crosslinks:
  derived_from: ["ADR--GKS-ARCHITECTURE"]
  implements: ["ADR--GKS-ARCHITECTURE"]
  supersedes: ["ADR--FILE-BASED-VECTOR"]
  used_by: []
---

# ADR--HYBRID-RETRIEVAL — Pipeline: Exact → FTS → Vector → Graph

> **Status:** Proposed
> **Date:** 2026-04-21
> **Deciders:** MSP-USR-BOSS, MSP-AGT-EVA-COWORK

---

## Context

`ADR--GKS-ARCHITECTURE` กำหนดให้มี abstraction layer และ pluggable providers แต่ยังไม่ได้ลงรายละเอียด **retrieval pipeline**

ปัจจุบัน `MemoryStore.retrieve()` ทำงานแบบ:
1. Atomic: substring match ที่ `id`/`path`
2. Vector: cosine similarity
3. Episodic: substring ใน summary + tags
4. Merge + dedup by path

ข้อจำกัด:
- **Exact ID lookup** ผ่าน substring (O(N)) ทั้งที่ hash O(1) ได้
- **Keyword search** ไม่มี FTS จริง — หาคำ "tenantId" ใน body markdown ไม่ได้ (เพราะ substring match เฉพาะ id/path)
- **Backlink traversal** ไม่มี — หา "ADR ทั้งหมดที่ implement CONCEPT--X" ไม่ได้
- **Budget control** ไม่มี — ยิงทุก backend ทุกครั้ง
- **Reranking** แค่ dedup by path + sort by score ไม่มี cross-provider merge ฉลาด

---

## Decision

ออกแบบ **Hybrid Retrieval Pipeline** 4 provider + orchestrator:

```
                    context.resolve(intent, filters, relations)
                                 ↓
                         ┌─── HybridRetriever ───┐
                         │                        │
                         │  1. Cascade            │
                         │     (short-circuit)    │
                         │                        │
                         │  2. Parallel dispatch  │
                         │     (if needed)        │
                         │                        │
                         │  3. Merge + Rerank     │
                         │                        │
                         │  4. Expand backlinks   │
                         │     (optional)         │
                         └───────────────────────┘
                         ↓       ↓       ↓       ↓
                    ┌────────┬────────┬────────┬────────┐
                    │ Atomic │  FTS   │ Vector │ Graph  │
                    │ Index  │ (rg)   │ (file) │ (edges)│
                    └────────┴────────┴────────┴────────┘
```

### Provider contracts

```typescript
interface RetrievalProvider {
  readonly kind: 'atomic' | 'fts' | 'vector' | 'graph'
  readonly cost: 'O(1)' | 'O(N)' | 'O(log N)'
  capability(q: Query): 'miss' | 'may_hit' | 'definite_hit'
  search(q: Query, opts: SearchOpts): Promise<Hit[]>
  health(): Promise<ProviderHealth>
}

interface Query {
  text: string
  mode: 'auto' | 'exact' | 'keyword' | 'semantic' | 'graph'
  filters?: {
    phase?: number
    type?: string        // CONCEPT / ADR / FLOW / ...
    status?: string
    scope?: 'project' | 'global' | 'all'
    tags?: string[]
  }
  relations?: {
    seedIds?: string[]
    expandBacklinks?: boolean
    expandForwardlinks?: boolean
    depth?: number       // 1-3
  }
  budget?: {
    maxHits?: number     // default 10
    maxLatencyMs?: number  // default 500
  }
}

interface Hit {
  source: 'atomic' | 'fts' | 'vector' | 'graph'
  id: string
  path?: string
  score: number          // 0..1 normalized
  snippet: string
  meta?: Record<string, unknown>
  // provider-specific evidence for rerank
  evidence?: {
    exactMatch?: boolean
    keywordCount?: number
    cosineScore?: number
    graphDistance?: number
  }
}
```

### Cascade order (short-circuit)

```
1. If query looks like exact ID (regex: ^[A-Z]+--[A-Z0-9-]+$):
   → AtomicIndexProvider only  (O(1), stop if found)

2. If query has filters.tags or filters.phase + short text (<20 chars):
   → AtomicIndexProvider.filter + FTS in narrowed set

3. Else (general query):
   → Run AtomicIndexProvider + FTS in parallel (cheap)
   → If top hit score < 0.7, also run Vector
   → Merge

4. If relations.expand* AND top hits exist:
   → BacklinkGraphProvider.expand(top_hit_ids, depth)
   → Append to results (flagged as 'related')
```

### Reranking algorithm

**Weighted sum** (detail spec → `ADR--SCORING-FORMULA`):

```
finalScore =
    w_semantic * S_semantic
  + w_keyword  * S_keyword
  + w_graph    * S_graph
  + w_recency  * S_recency
  + w_type     * S_typeBoost
```

Default weights (initial, tunable):

| Component | Weight |
|---|---|
| semantic | 0.45 |
| keyword | 0.20 |
| graph | 0.20 |
| recency | 0.10 |
| type | 0.05 |

**Post-rank penalties**:
- **Diversity penalty**: if doc.cosine vs already-selected > 0.9 → score *= 0.7
- **Status boost** (applied multiplicatively after weighted sum):
  - `stable` → * 1.1
  - `deprecated` → * 0.6

**Graph score breakdown** (เพราะ graph score เป็น composite อยู่แล้ว):
```
S_graph = 0.6 * direct_link + 0.3 * shared_neighbors + 0.1 * centrality
```

Why weighted sum > RRF สำหรับเคสเรา:
- Integrate signals ที่ไม่ใช่ rank ได้ง่าย (recency, type boost)
- Tune ได้ manually เพราะ atom จำนวนน้อย (~500)
- Graph score มี sub-components ที่ weighted sum expose ได้
- RRF เหมาะกับ retrieval systems ใหญ่ที่มี provider score scale ต่างกันมาก — ของเรา normalize ได้ก่อน

**Full formula + examples** → `ADR--SCORING-FORMULA`

---

## Provider specifications

### Provider A: `AtomicIndexProvider`
- **Kind**: exact
- **Cost**: O(1) per ID (hash map in memory)
- **Backed by**: `gks/00_index/atomic_index.jsonl` loaded into `Map<id, entry>`
- **Capability**:
  - `definite_hit` ถ้า query = ID exact
  - `may_hit` ถ้า query เป็น substring ของ ID
  - `miss` otherwise
- **Use case**: exact lookup, fallback ถ้า query คล้าย ID format

### Provider B: `RipgrepFtsProvider`
- **Kind**: fts (keyword)
- **Cost**: O(N) per search (fast thanks to ripgrep)
- **Backed by**: spawn `rg --json -n <pattern> gks/` + parse
- **Alt backend** (if rg unavailable): in-memory inverted index via `gks/00_index/fts.sqlite` (FTS5)
- **Capability**: always `may_hit` (can't know without running)
- **Use case**: search by keyword in body (technical terms, code snippets, proper nouns)
- **Performance target**: < 50ms p99 on ~500 atoms

### Provider C: `FileVectorProvider`
- **Kind**: vector (semantic)
- **Cost**: O(N·D) brute force cosine (D = 1024)
- **Backed by**: `.eva/vector/atomic.jsonl` (already exists)
- **Embedding**: bge-m3 via Ollama (primary), OpenAI text-embedding-3-small (fallback)
- **Capability**: always `may_hit` (semantic is probabilistic)
- **Use case**: paraphrase, semantic similarity, intent-based search
- **Performance target**: < 200ms p99 on ~500 chunks

### Provider D: `BacklinkGraphProvider`
- **Kind**: graph
- **Cost**: O(1) lookup + O(k) expansion (k = neighbors per node)
- **Backed by**:
  - `.eva/vector/backlinks.jsonl` — forward edges `{from, to, type}`
  - `.eva/vector/backref.jsonl` — reverse edges `{to, from, type}`
- **Extracted from**:
  - Frontmatter: `derived_from`, `implements`, `supersedes`, `used_by`
  - Body: `[[wikilinks]]` (optional, v2)
- **Capability**:
  - `definite_hit` ถ้ามี seedIds + relations specified
  - `miss` otherwise (graph only activates with relations)
- **Use case**: "ADR ที่ implement CONCEPT--X", "ไฟล์อะไรที่ ref ADR--Y บ้าง"

---

## Budget enforcement

```typescript
class HybridRetriever {
  async resolve(q: Query): Promise<ResolvedContext> {
    const budget = q.budget ?? { maxHits: 10, maxLatencyMs: 500 }
    const deadline = Date.now() + budget.maxLatencyMs

    // Phase 1: cheap cascade (atomic + maybe FTS)
    const phase1 = await this.runProviders(['atomic', 'fts'], q, deadline)
    if (phase1.topScore >= 0.9 && phase1.hits.length >= budget.maxHits / 2) {
      return this.rank(phase1.hits)   // short-circuit
    }

    // Phase 2: add vector if budget allows
    if (Date.now() < deadline - 200) {
      const phase2 = await this.runProviders(['vector'], q, deadline)
      phase1.hits.push(...phase2.hits)
    }

    // Phase 3: graph expansion
    if (q.relations?.expandBacklinks && phase1.hits.length > 0) {
      const seeds = phase1.hits.slice(0, 3).map((h) => h.id)
      const expanded = await this.providers.graph.search(
        { ...q, relations: { seedIds: seeds, depth: q.relations.depth ?? 1 } },
        { deadline },
      )
      phase1.hits.push(...expanded)
    }

    return this.rank(phase1.hits)
  }
}
```

---

## Alternatives Considered

### A. Pure vector (status quo)
- ✅ Simple
- ❌ Miss exact ID, acronym, proper noun
- ❌ Cold start: vector store ว่างเปล่า = no results

### B. Pure keyword (ripgrep only)
- ✅ Fast, deterministic
- ❌ Miss paraphrase, semantic intent
- ❌ No graph query

### C. RRF (Reciprocal Rank Fusion)
- ✅ No score normalization needed
- ✅ Industry standard (Elasticsearch, Vespa)
- ❌ ผสม non-rank signals (recency/type) ไม่ flexible
- ❌ Tune hard-score manually ยากกว่า
- ⚠️ Revisit ถ้าเกิน 10k atoms หรือ provider score scale เพี้ยน

### D. Learned-to-rank (LTR)
- ✅ Potentially best precision
- ❌ Overkill for ~500 atoms
- ❌ Needs training data we don't have
- ⚠️ Revisit ถ้าเกิน 5k atoms

### E. Hybrid 4-provider + Weighted Sum (chosen)
- ✅ Covers all query types (exact/keyword/semantic/graph)
- ✅ Weighted sum = explicit control, easy to add recency/type
- ✅ Budget + cascade = latency predictable
- ✅ Graph sub-components (direct/shared/centrality) exposed
- ❌ Complexity สูงขึ้น
- ❌ ต้อง normalize score ข้าม provider ก่อน weighted sum
- ❌ Tests เพิ่ม ~30 cases

---

## Consequences

### Positive
- Exact ID lookup: **40× faster** (O(1) hash vs O(N) substring)
- Keyword precision: ~95% (ripgrep ถูก) vs ~60% (substring ของเดิม)
- Graph query เป็นไปได้ (ไม่เคยทำมาก่อน)
- Budget control → agent ทำ context query ใน loop ได้ (ไม่กลัว O(N²))
- RRF = swap provider ง่าย (ไม่ต้อง tune threshold เดิม)

### Negative
- 4 provider + orchestrator = ~800 บรรทัดใหม่
- Cascade logic ต้อง test ทุกกิ่ง (8 path: atomic hit/miss × fts hit/miss × vector hit/miss)
- Graph index ต้อง rebuild ทุกครั้งที่แก้ frontmatter (`postToolUse` hook)

### Neutral
- `retrieve()` API เก่าต้อง mark deprecated — ให้เวลา 1 week migrate ไป `resolveContext()`
- Tests: +40 cases estimate (contract tests per provider + integration)

---

## FTS backend choice

เลือกระหว่าง:

| Backend | Pro | Con |
|---|---|---|
| **ripgrep** (spawn) | ติดตั้งง่าย (dev ส่วนใหญ่มี), เร็ว, no index | ไม่มี ranked relevance (แค่ match count) |
| **SQLite FTS5** | Ranked (BM25), offline-safe, มีใน Node ผ่าน `better-sqlite3` | ต้องสร้าง index, +1 native dep |
| **DuckDB FTS** | เร็วกว่า SQLite, bulk insert ดี | dep ใหญ่, ยังใหม่ |
| **In-memory JS inverted index** | Zero dep, test ง่าย | Slow > 10k docs, re-parse ทุกครั้ง |

**Decision**: **primary = ripgrep spawn** (tool `Grep` ของเรา spawn อยู่แล้ว — reuse); **fallback = SQLite FTS5** ถ้า rg ไม่มี

เหตุผล:
- ripgrep เร็วพอ (~10-30ms ต่อ query บน ~500 atoms)
- ไม่เพิ่ม native dep
- Unix-style composable
- ranked-relevance ทำใน rerank step ได้ (count + position)

---

## Graph persistence

```
.eva/vector/backlinks.jsonl    — forward edges (from → to)
{"from":"ADR--ROUTING-MATRIX","to":"CONCEPT--EVA-TRI-BRAIN","type":"derived_from"}
{"from":"ADR--ROUTING-MATRIX","to":"FRAME--TRI-BRAIN-ARCHITECTURE","type":"implements"}

.eva/vector/backref.jsonl      — reverse edges (to → from)
{"to":"CONCEPT--EVA-TRI-BRAIN","from":"ADR--ROUTING-MATRIX","type":"derived_from"}
```

Both files generated by indexer from frontmatter. Load to `Map<string, Edge[]>` on startup.

---

## Implementation

See `MSP-IMP-260421001-kos-upgrade` for task breakdown.

---

## Rollback

- **All providers optional** — disable BacklinkGraphProvider ก่อนได้ (drop relations feature)
- **Cascade can degrade to single provider** — ถ้า provider A ล่ม → fall through to B
- Keep old `MemoryStore.retrieve()` as `@deprecated` ให้อย่างน้อย 1 release cycle

---

## Test Plan

| Test | Provider | Case |
|---|---|---|
| Unit | Atomic | exact ID hit / miss / substring |
| Unit | FTS | keyword hit / no rg fallback |
| Unit | Vector | cosine + top-K + threshold |
| Unit | Graph | 1-hop / 2-hop / cycle / orphan |
| Unit | Reranker | RRF math / boost logic |
| Integration | HybridRetriever | cascade short-circuit |
| Integration | HybridRetriever | budget enforcement |
| Integration | HybridRetriever | all providers down → graceful |
| E2E | resolveContext | real atom query returns correct hits |
