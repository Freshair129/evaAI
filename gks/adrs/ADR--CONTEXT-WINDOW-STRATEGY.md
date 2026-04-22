---
id: "ADR--CONTEXT-WINDOW-STRATEGY"
phase: 2
type: "adr"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.78
  source_type: "inference"
crosslinks:
  derived_from: ["ADR--GKS-ARCHITECTURE", "ADR--SCORING-FORMULA"]
  implements: ["ADR--GKS-ARCHITECTURE"]
  supersedes: []
  used_by: []
---

# ADR--CONTEXT-WINDOW-STRATEGY — Token Budget + Density + Summarization + Structure

> **Status:** Proposed · **Date:** 2026-04-21

---

## Context

หลัง scoring + rerank แล้ว ต้องตัดสินใจว่า **จะยัด doc อะไรเข้า context window เท่าไหร่** ถึงจะ "ฉลาดที่สุด ไม่ใช่เยอะที่สุด"

ปัจจุบัน:
- MemoryStore ส่ง top-K แบบ blind (5 hits × snippet 300 chars) โดยไม่คิด token budget
- ไม่มี summarization สำหรับ doc ใหญ่
- ไม่มี dedup/merge ระหว่าง overlap docs
- ไม่มี structure → dump markdown ทั้งก้อน model อ่านไม่เข้าใจ
- ไม่มี diversity guard (top-K มี ADR ล้วน → bias)

ผลลัพธ์: context window เสียเปล่า, model ได้ context ที่ซ้ำซ้อน, precision ต่ำ

---

## Decision

ใช้ **5-stage context optimization pipeline**:

```
Ranked Hits (จาก ADR--SCORING-FORMULA)
        ↓
┌─────────────────────────────┐
│ 1. Budget Split              │  — แบ่ง token ระหว่าง system/user/context/response
├─────────────────────────────┤
│ 2. Top-K per Type            │  — กัน type bias (ทำใน reranker แล้ว แต่ซ้ำที่นี่)
├─────────────────────────────┤
│ 3. Information Density       │  — เลือก doc ที่คุ้ม token มากกว่า
├─────────────────────────────┤
│ 4. Summarization (if needed) │  — doc > threshold → summarize
├─────────────────────────────┤
│ 5. Dedup / Merge             │  — overlap > threshold → merge
├─────────────────────────────┤
│ 6. Structure                 │  — จัด section พร้อม heading
└─────────────────────────────┘
        ↓
Packed Context (≤ token budget)
```

---

## Stage 1: Budget Split

```yaml
# default for 200k-token Opus
total_budget: 200000

system_prompt:   3000      # EVA.md + tool descriptions
user_turns:      20000     # conversation history (last 20 msg ~1k each)
response_reserve: 4000     # max_tokens for reply
context_budget:  170000    # left for retrieval context
thinking:        3000      # Anthropic thinking tokens
```

```yaml
# default for 8k-token Haiku or local Qwen
total_budget: 8000

system_prompt:  1000
user_turns:     500
response_reserve: 1500
context_budget: 5000
```

**Rule**: `context_budget = total - (system + user + response + thinking)`

Config source: `.eva/settings.yaml` → `context:`

---

## Stage 2: Top-K per Type (enforced in reranker)

`ADR--SCORING-FORMULA` ระบุ default_caps แล้ว — ADR นี้แค่ reuse:

```yaml
CONCEPT: 3
ADR: 2
FRAME: 2
FLOW: 2
ENTITY: 2
BLUEPRINT: 2
FEAT: 2
(other): 1
```

**Intent override**:
- `intent == "code"` → BLUEPRINT: 4, CONCEPT: 1
- `intent == "design"` → ADR: 4, FRAME: 3, CONCEPT: 1
- `intent == "debug"` → FLOW: 3, AUDIT: 2, INC: 2

---

## Stage 3: Information Density Score

```
density(doc) = info_units(doc) / token_count(doc)
```

**`info_units`** = จำนวน "atomic facts" ใน doc — approximation:

```
info_units ≈
    count(headings)          * 1.5
  + count(list_items)        * 1.0
  + count(code_blocks)       * 2.0
  + count(tables)            * 3.0
  + count(id_references)     * 0.5   # [[CONCEPT--X]] etc
  + count(key_terms)         * 0.3
  + Math.log(body_paragraphs + 1) * 2.0
```

**Token count** = approx `text.length / 4` (rough for mixed Thai/English)

**Use case**: เมื่อ token budget จำกัด เลือก doc ที่ `density` สูง (คุ้ม token) ก่อน แม้ finalScore เท่ากัน:

```
for doc in ranked_hits:
  if tokens_used + doc.tokens > budget:
    # try substitute with denser doc
    candidate = find_higher_density_within(doc.type, remaining_budget)
    if candidate: pick(candidate)
  else:
    pick(doc)
```

---

## Stage 4: Summarization Layer

**Trigger**: `doc.tokens > SUMMARIZATION_THRESHOLD` (default 800)

**Strategy** (ลำดับลำดับ):

```
if doc.has_structured_summary (frontmatter.summary or first ## section):
  → use that (cheapest, deterministic)

elif doc.size <= 2×threshold:
  → extract_headings_plus_first_sentence() (heuristic, fast)

else:
  → LLM summarize via Haiku (cheap)
     prompt: "Summarize focusing on: {query_terms}"
     target_tokens: 200
```

**Cache**: LLM summaries keyed by `hash(doc_content) + hash(query_terms)` in `.eva/cache/summaries/`

**Constraint**: summarization runs in parallel across docs (batched to 4), total budget `2s`

---

## Stage 5: Dedup / Merge

### Dedup (near-duplicate)

```
for docA, docB in selected (pairwise):
  if cosine(docA.embedding, docB.embedding) > 0.92:
    drop_lower_scoring(docA, docB)
```

### Merge (complementary overlap)

```
for docA, docB where related_via_crosslink(docA, docB):
  if overlap_by_heading(docA, docB) > 0.5:
    merge_into_combined_doc(docA, docB)
```

**Merge rules**:
- Keep both IDs in source trail: `source: [A.id, B.id]`
- Dedupe paragraphs verbatim
- Concatenate unique sections

---

## Stage 6: Context Structure

**Anti-pattern** (don't do):
```
[CONTEXT]
Contents of doc A verbatim...
Contents of doc B verbatim...
Contents of doc C verbatim...
[END CONTEXT]
```

**Target structure** (do):

```markdown
[CONTEXT — retrieved for query: "explain EVA memory"]

## Concept (foundational)
- **CONCEPT--EVA-TRI-BRAIN** (score 0.72)
  EVA splits reasoning across 3 brains: Cortex (planning), Motor
  (codegen), Limbic (Thai NLU). Memory is unified via MemoryStore.

## Architecture Decisions
- **ADR--GKS-ARCHITECTURE** (score 0.66, stable)
  4-layer KOS: truth → providers → protocol → agents. Markdown =
  source of truth, vector/fts/graph are indexes.

- **ADR--HYBRID-RETRIEVAL** (score 0.58)
  Pipeline: exact → FTS → vector → graph, weighted sum ranking.

## Related Flows
- **FLOW--REACT-LOOP** (score 0.64)
  7-phase orchestrator loop: intent → route → retrieve → plan →
  execute → stylize → persist.

## Relations (graph)
- CONCEPT--EVA-TRI-BRAIN ← implemented by → ADR--GKS-ARCHITECTURE
- ADR--GKS-ARCHITECTURE → derived_from → CONCEPT--EVA-TRI-BRAIN

[END CONTEXT]
```

**Why this structure**:
- Heading groups by **role** (Concept / Decision / Flow) → model's mental model aligned
- Each hit shows **score + status** → model weighs itself
- Summary (1-2 sentences) not full body → density
- Relations explicit → enables graph reasoning
- `[CONTEXT]` ... `[END CONTEXT]` delimiters → prompt injection resistance

---

## Config Schema

```yaml
# .eva/settings.yaml
context:
  total_budget: 200000          # auto-detect per model

  split:
    system_prompt:    3000
    user_turns:      20000
    response_reserve: 4000
    thinking:         3000
    # context_budget = total - sum(above)

  top_k_per_type:
    default:
      CONCEPT: 3
      ADR: 2
      FRAME: 2
      FLOW: 2
      ENTITY: 2
      BLUEPRINT: 2
      FEAT: 2
      other: 1
    intent_override:
      code:    { BLUEPRINT: 4, CONCEPT: 1 }
      design:  { ADR: 4, FRAME: 3, CONCEPT: 1 }
      debug:   { FLOW: 3, AUDIT: 2, INC: 2 }

  summarization:
    threshold_tokens: 800
    target_tokens: 200
    model: haiku
    cache_dir: .eva/cache/summaries/

  dedup:
    cosine_threshold: 0.92

  merge:
    overlap_threshold: 0.5

  structure:
    group_by: type      # or: relation
    show_score: true
    show_status: true
    show_relations: true
    max_snippet_chars: 300
```

---

## Alternatives Considered

### A. Naive top-K with full body
- ✅ Simple
- ❌ Over-quota, duplicates, no structure
- Rejected

### B. LLM summarize all hits (end-to-end)
- ✅ Best density
- ❌ Expensive (N extra LLM calls per query)
- ❌ Latency +2-5s per query
- Rejected as default, usable for long-form queries

### C. Static structure (always same layout)
- ✅ Predictable
- ❌ Mismatch for `intent=code` (wants BLUEPRINT-heavy)
- Partial adopt: structure template แต่ reorder by intent

### D. 6-stage pipeline (chosen)
- ✅ Each stage independently tunable
- ✅ Density + structure = precision
- ❌ Complex: 6 stages × edge cases = many tests
- ❌ Summarization cost (mitigated by cache)

---

## Consequences

### Positive
- Token budget **predictable** — ไม่มีวัน exceed
- Model comprehension **higher** (structured > dumped)
- Cost **lower** (density-first packing)
- **Observable** (log each stage's input/output)

### Negative
- Implementation complexity (6 stages + caches + config)
- Summarization latency ครั้งแรก (mitigated by cache)
- Heuristic info_units อาจไม่ตรง 100% (measure + calibrate)

### Risks
- **Over-summarization** อาจ drop key detail → mitigate ด้วย cache invalidation เมื่อ query term เปลี่ยน
- **Structure template rigid** → allow `.eva/prompts/context-template.md` override
- **Dedup false positive** (docs คล้ายแต่เสริมกัน) → threshold 0.92 (high), manual escape hatch

---

## Implementation

**Files**:
- `eva-cli/src/memory/context-packer.ts` — main pipeline
- `eva-cli/src/memory/density.ts` — info_units + token_count heuristics
- `eva-cli/src/memory/summarizer.ts` — LLM summarize + cache
- `eva-cli/src/memory/structure-template.ts` — render packed context

**Maps to IMP tasks** (additions):
- New T21: `density.ts` (info_units formula)
- New T22: `summarizer.ts` (LLM cache)
- New T23: `context-packer.ts` (6-stage pipeline)
- New T24: `structure-template.ts` (rendering)

---

## Tuning Protocol

1. **Measure current density**: count headings/lists/code per atom, compare to body length
2. **A/B test packed vs dumped** context on 10 Thai queries, human-eval accuracy
3. **Tune thresholds**:
   - summarization_threshold: 600 / 800 / 1000 (pick lowest without quality loss)
   - dedup_cosine: 0.88 / 0.90 / 0.92 (pick highest without duplicates leaking)
4. **Measure cache hit rate** after 1 week — if < 60%, reduce summary target tokens

---

## Rollback

- Disable summarization: set `threshold_tokens: 100000` (never triggers)
- Disable dedup: set `cosine_threshold: 1.01` (never matches)
- Disable structure: set `group_by: raw` → plain top-K dump
- Fallback to naive top-K always safe
