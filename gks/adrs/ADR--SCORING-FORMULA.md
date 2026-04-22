---
id: "ADR--SCORING-FORMULA"
phase: 2
type: "adr"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.78
  source_type: "inference"
crosslinks:
  derived_from: ["ADR--HYBRID-RETRIEVAL", "ADR--GKS-ARCHITECTURE"]
  implements: ["ADR--HYBRID-RETRIEVAL"]
  supersedes: []
  used_by: []
---

# ADR--SCORING-FORMULA — Hybrid Weighted Sum + Graph Breakdown + Recency + Type Boost + Diversity Penalty

> **Status:** Proposed · **Date:** 2026-04-21

---

## Context

`ADR--HYBRID-RETRIEVAL` เลือก weighted sum เป็น reranking algorithm แต่ยังไม่ได้กำหนดรายละเอียด:
- สูตรเต็ม
- Graph score sub-components
- Recency decay function
- Type boost values
- Diversity penalty threshold
- Normalization strategy per provider

ADR นี้ระบุทั้งหมด — เป็น single source ของ scoring formula

**เป้าหมาย** (จาก Boss's score.md): *"ไม่ใช่หาเอกสารที่คล้ายที่สุด แต่หา context ที่ตอบคำถามได้ดีที่สุด"*

---

## Decision

### Master formula

```
finalScore = baseScore × statusMultiplier × diversityPenalty

baseScore =
    W.semantic * S_semantic
  + W.keyword  * S_keyword
  + W.graph    * S_graph
  + W.recency  * S_recency
  + W.type     * S_typeBoost

statusMultiplier =
    1.0 if status == "raw"
  | 1.1 if status == "stable"
  | 1.2 if status == "verified"
  | 0.6 if status == "deprecated"

diversityPenalty = 0.7 if cosine_to_selected > 0.9 else 1.0
```

### Default weights (v1 — tunable)

| Component | Weight |
|---|---|
| `W.semantic` | 0.45 |
| `W.keyword` | 0.20 |
| `W.graph` | 0.20 |
| `W.recency` | 0.10 |
| `W.type` | 0.05 |
| **Total** | **1.00** |

---

## Component Details

### 1. Semantic Score `S_semantic`

```
S_semantic = cosine_similarity(query_embedding, doc_chunk_embedding)
```

- **Range**: 0 → 1 (cosine already in this range when vectors normalized)
- **Normalization**: none needed (bge-m3 produces normalized vectors)
- **Aggregation per doc**: `max` across chunks ของเอกสารนั้น (best chunk represents doc)
- **Strength**: เข้าใจ paraphrase, concept similarity
- **Weakness**: hallucinate exact-term matches, miss acronyms

### 2. Keyword Score `S_keyword`

```
S_keyword = normalize(BM25(query, doc), scale="linear")
```

**BM25 formula** (ripgrep ไม่มี BM25 ตรง ๆ — เราคำนวณจาก count + doc length ด้วยตัวเอง):

```
BM25(q, d) = Σ over terms t in q:
    idf(t) × (tf(t,d) × (k1 + 1)) / (tf(t,d) + k1 × (1 - b + b × |d| / avgdl))

where:
  k1 = 1.2         (term frequency saturation)
  b  = 0.75        (length normalization)
  idf(t) = log((N - n(t) + 0.5) / (n(t) + 0.5))
  N = total docs
  n(t) = docs containing term t
  tf(t,d) = raw frequency of t in d
  |d| = length of d in tokens
  avgdl = average doc length
```

**Normalization**: linear scale BM25 scores to 0-1 via `min-max` **ภายใน query** (per-query normalization)

- **Fallback (if ripgrep only, no BM25)**: count-based approximation `match_count / (match_count + 1)` → logistic clamp to 0-1

### 3. Graph Score `S_graph`

```
S_graph = 0.6 * direct_link + 0.3 * shared_neighbors + 0.1 * centrality
```

| Sub-component | Meaning | Computation |
|---|---|---|
| `direct_link` | เอกสารนี้มี backlink หรือ forward-link ไปที่ top-hit หรือ seedId ของ query หรือไม่ | 1 if direct edge, 0.5 if 2-hop, 0 otherwise |
| `shared_neighbors` | Overlap ระหว่าง neighbor set ของเอกสารนี้ กับ neighbor set ของ top-hit | Jaccard(N(doc), N(seed)) — 0 to 1 |
| `centrality` | Importance ใน graph โดยรวม | `log(1 + degree(doc)) / log(1 + max_degree)` — normalized 0 to 1 |

**Computation budget**:
- `direct_link`: O(1) (hash lookup ใน backlinks.jsonl)
- `shared_neighbors`: O(k) where k = |N(doc)| — typically < 20
- `centrality`: precomputed ตอน index, cached in `.eva/vector/graph-stats.json`

**Activation**: S_graph = 0 ถ้า query ไม่มี `relations.seedIds` หรือ top-hit ยังไม่รู้ — ส่วนนี้รันหลัง phase 1 (atomic+fts) เท่านั้น

### 4. Recency Score `S_recency`

```
S_recency = exp(-λ × age_in_days)

where λ = 0.02 (default)
```

- **Half-life**: ~34.7 days (age ที่ S_recency = 0.5)
- **Age source**: `last_updated` ใน frontmatter, fallback เป็น file mtime
- **Special cases**:
  - Atoms ที่ `status == "verified"` → ignore recency (set S_recency = 0.8 constant)
  - Atoms ที่ `status == "deprecated"` → S_recency = 0 (ไม่ boost)
- **λ tuning**:
  - 0.01 → half-life ~69 วัน (stable, slow-moving knowledge)
  - 0.02 → half-life ~35 วัน (default, balanced)
  - 0.05 → half-life ~14 วัน (fast-moving project)

### 5. Type Boost `S_typeBoost`

```
S_typeBoost = lookup(intent, doc_type)
```

| Intent | CONCEPT | ADR | FRAME | FLOW | ENTITY | BLUEPRINT | PARAMS | FEAT | (other) |
|---|---|---|---|---|---|---|---|---|---|
| `explain` | **1.0** | 0.7 | 0.8 | 0.6 | 0.5 | 0.3 | 0.3 | 0.6 | 0.2 |
| `design` | 0.6 | **1.0** | 0.9 | 0.7 | 0.6 | 0.4 | 0.3 | 0.5 | 0.2 |
| `code` | 0.3 | 0.5 | 0.6 | 0.6 | 0.7 | **1.0** | 0.8 | 0.7 | 0.2 |
| `debug` | 0.4 | 0.6 | 0.5 | **1.0** | 0.8 | 0.6 | 0.5 | 0.7 | 0.2 |
| `search` | 0.6 | 0.6 | 0.6 | 0.6 | 0.6 | 0.6 | 0.6 | 0.6 | 0.5 |
| `default` | 0.7 | 0.7 | 0.7 | 0.6 | 0.5 | 0.5 | 0.4 | 0.6 | 0.2 |

- **Intent source**: Limbic intent-extractor (existing)
- **Rationale**: "explain" → concepts, "code" → blueprints, "debug" → flows

### 6. Status Multiplier

```
statusMultiplier(status) =
    stub        → 0.7
    raw         → 1.0
    stable      → 1.1
    verified    → 1.2
    deprecated  → 0.6
```

Multiplier **หลัง** weighted sum (ไม่ใช่ใน baseScore) เพื่อไม่ให้ค่าสูงเกิน 1.0 ก่อน normalize

### 7. Diversity Penalty

```
for each doc in sorted_by_score:
    for each selected_doc in selected[]:
        if cosine(doc.embedding, selected_doc.embedding) > 0.9:
            doc.score *= 0.7
            break
    selected.append(doc) if doc.score >= threshold
```

- **Threshold**: 0.9 cosine
- **Penalty**: 0.7 (reduce 30%)
- **Applied order**: หลัง weighted sum + status multiplier, ก่อน final sort
- **Effect**: Top-K จะไม่มี near-duplicate docs

### 8. Top-K per Type (diversity guard)

After scoring, enforce per-type caps:

```yaml
default_caps:
  CONCEPT: 3
  ADR: 2
  FRAME: 2
  FLOW: 2
  ENTITY: 2
  BLUEPRINT: 2
  FEAT: 2
  (other): 1
```

Algorithm:
```
sort all by finalScore desc
for doc in sorted:
  if cap[doc.type] > 0:
    select(doc)
    cap[doc.type] -= 1
  if selected.length >= maxHits: break
```

---

## Worked Example

Query: *"อธิบาย EVA memory system"*
Intent: `explain` (from Limbic)

Candidates:

| Doc | Semantic | Keyword | Graph | Age | Status | Type |
|---|---|---|---|---|---|---|
| `CONCEPT--EVA-TRI-BRAIN` | 0.82 | 0.6 | 0.0 | 5d | raw | CONCEPT |
| `ADR--GKS-ARCHITECTURE` | 0.68 | 0.3 | 0.8 | 1d | raw | ADR |
| `FLOW--REACT-LOOP` | 0.75 | 0.4 | 0.5 | 5d | raw | FLOW |
| `BLUEPRINT--memory.yaml` | 0.60 | 0.7 | 0.3 | 10d | raw | BLUEPRINT |

Compute (using defaults, no recency special cases):

**CONCEPT--EVA-TRI-BRAIN**:
- S_semantic = 0.82, S_keyword = 0.6, S_graph = 0.0
- S_recency = exp(-0.02 × 5) = 0.905
- S_typeBoost = 1.0 (explain × CONCEPT)
- baseScore = 0.45(0.82) + 0.20(0.6) + 0.20(0.0) + 0.10(0.905) + 0.05(1.0)
            = 0.369 + 0.120 + 0.0 + 0.0905 + 0.05 = **0.629**
- finalScore = 0.629 × 1.0 (status=raw) = **0.629**

**ADR--GKS-ARCHITECTURE**:
- baseScore = 0.45(0.68) + 0.20(0.3) + 0.20(0.8) + 0.10(exp(-0.02×1)) + 0.05(0.7)
            = 0.306 + 0.060 + 0.160 + 0.098 + 0.035 = **0.659**
- finalScore = 0.659 × 1.0 = **0.659**

**FLOW--REACT-LOOP**:
- baseScore = 0.45(0.75) + 0.20(0.4) + 0.20(0.5) + 0.10(0.905) + 0.05(0.6)
            = 0.3375 + 0.080 + 0.100 + 0.0905 + 0.030 = **0.638**
- finalScore = **0.638**

**BLUEPRINT--memory.yaml**:
- baseScore = 0.45(0.60) + 0.20(0.7) + 0.20(0.3) + 0.10(exp(-0.2)) + 0.05(0.3)
            = 0.270 + 0.140 + 0.060 + 0.0819 + 0.015 = **0.567**
- finalScore = **0.567**

**Ranked**:
1. ADR--GKS-ARCHITECTURE (0.659) — graph boost ทำให้ชนะ
2. FLOW--REACT-LOOP (0.638)
3. CONCEPT--EVA-TRI-BRAIN (0.629) — type boost 1.0 สำหรับ explain แต่ graph score 0
4. BLUEPRINT--memory.yaml (0.567)

**Interpretation**: แม้ CONCEPT จะได้ type boost สูงสุด แต่ ADR + FLOW มี graph connection (อ้าง CONCEPT นี้ผ่าน `implements`) จึงขึ้นนำ — แสดงว่าระบบเข้าใจ structure

---

## Normalization Strategy

Each provider outputs score ใน range ต่างกัน ต้อง normalize **ก่อน** weighted sum:

| Provider | Raw range | Normalization |
|---|---|---|
| AtomicIndex | 1.0 (exact) or 0.5 (substring) | pass-through (already 0-1) |
| FTS (BM25) | unbounded positive | per-query min-max → 0-1 |
| Vector (cosine) | -1 to 1 (typically 0 to 1 for normalized) | clamp negative to 0, pass-through |
| Graph | 0 to 1 by construction | pass-through |

---

## Alternatives Considered

### A. RRF (Reciprocal Rank Fusion)
- ✅ No normalization
- ❌ ผสม non-rank signals ไม่ได้ง่าย
- ❌ Tune hard
- Status: moved to `ADR--HYBRID-RETRIEVAL §Alternatives`

### B. Pure cosine (vector only)
- ❌ Miss exact IDs, keyword queries
- ❌ No governance signals (status, recency)

### C. Learned-to-rank
- ❌ Overkill for 500 atoms
- Revisit when > 5k

### D. Weighted sum with graph breakdown (chosen)
- ✅ All signals captured
- ✅ Tunable
- ✅ Interpretable (debug ง่าย — เห็นแต่ละ component)
- ❌ Normalize per provider required

---

## Consequences

### Positive
- Interpretable: each hit มี breakdown `{semantic, keyword, graph, recency, type}` ใส่ log ได้
- Tunable: ปรับ weight แล้ว re-evaluate ข้อมูล human-eval set
- Incremental: เริ่มด้วย default weights, ค่อยเรียนรู้จาก feedback
- Cross-signal integration ชัด

### Negative
- Weight tuning ต้องใช้ data (manual ในช่วงแรก)
- Normalization per-provider เพิ่ม complexity
- Graph score ต้อง precompute centrality (1 pass ทุก rebuild)

### Risks
- **Weight imbalance** ทำให้ bias → A/B test กับ 20 Thai queries
- **Graph score degenerate** ถ้าไม่มี relations ใน query → fallback ที่ S_graph = 0 handled
- **Type taxonomy เปลี่ยน** (เพิ่ม type ใหม่) → table ต้อง update พร้อม

---

## Implementation

- **File**: `eva-cli/src/memory/reranker.ts`
- **Function**: `scoreDocument(rawHits: Hit[], query: Query, context: RerankContext): RankedHit[]`
- **Config**: weights loaded from `.eva/settings.yaml` → `scoring:` section
- **Graph stats**: precomputed in `.eva/vector/graph-stats.json` at index time
- **Tests**: unit — each component function pure, testable with fixture data

Maps to IMP tasks:
- **T8**: RRF reranker → **rename to Weighted Sum reranker**
- Add T8a: graph stats precomputation
- Add T8b: per-query BM25 normalization
- Add T8c: diversity penalty + top-K per type

---

## Tuning Protocol

1. Build eval set: 20 Thai queries with human-labeled "top 3 correct hits"
2. Run current weights → measure precision@3
3. Grid search: vary `W.semantic` in `[0.3, 0.4, 0.45, 0.5, 0.55]`, keep others proportional
4. Pick weights maximizing precision@3
5. Re-run after every major atom addition (> 10% growth)

Log weights in `.eva/vector/scoring-stats.jsonl` per query → observability

---

## Rollback

- Drop graph score (w_graph → 0, redistribute to semantic) — works fine without graph
- Drop recency (w_recency → 0) — OK for stable knowledge bases
- Drop diversity penalty (no-op) — safe
- Drop top-K per type (emit raw ranking) — safe

Each component independent and can be disabled via weight = 0
