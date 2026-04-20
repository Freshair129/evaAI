---
id: "00_index--README"
type: knowledge
status: active
summary: "L0 search index for phase2_atomic — agents scan this BEFORE loading full atomic files."
created_at: 2026-04-19
created_by: "@claude-opus-4-7"
---
# L0 Atomic Index

**Purpose**: Give LLM agents a token-cheap way to discover which atomic notes exist and what they cover, before spending tokens on full-file reads.

Pattern inspired by [EVA 8.0 MSP `episodic_index.jsonl`](../../msp/ARCHITECTURE_OVERVIEW.md) and validated against [A-MEM](https://arxiv.org/abs/2502.12110) / [Mem0](https://arxiv.org/html/2504.19413v1) benchmarks (token cost <7k/query vs ~60k full-vault read).

## Files

| File | Purpose | Generator |
|---|---|---|
| `atomic_index.jsonl` | One line per phase2_atomic/*.md with id, type, summary, tags, depends_on, file, updated_at, size_bytes | `npm run msp:index` |
| `atomic_index.meta.json` | Aggregate: count_by_type, total_files, total_bytes, duplicates, last_validation | `npm run msp:index` |
| `atomic_validation_report.json` | Errors/warnings from validator (drift, duplicates, missing frontmatter) | `npm run msp:validate` |

## Agent Usage

```
Agent needs context for X
  → Read atomic_index.jsonl  (~1-3 KB)
  → Filter by tag/type/module
  → Load only matching full files
```

This replaces the "load all of phase2_atomic/ into context" anti-pattern.

## Scripts

- `scripts/msp/build-l0-index.mjs` — scans phase2_atomic/, writes JSONL + meta
- `scripts/msp/validate-atomic-ids.mjs` — dedup check + frontmatter validation
- `npm run msp:check` — runs both (index first, then validate)

## LLM Write Contract

Agents proposing new/updated atomic notes MUST conform to:

- `.brain/msp/LLM_Contract/phase2_atomic_contract.yaml`

Key rules:
- `id` must match filename (substring, case-insensitive)
- ADR numbers must be `max(existing) + 1` (check index first)
- `forbidden_fields` list prevents fabrication of `tenant_id`, `commit_hash`, `promotion_level`, etc.
- Wikilinks `[[...]]` must resolve to existing notes

## Pre-commit Integration (recommended)

Add to `.husky/pre-commit` or equivalent:
```bash
npm run msp:check || {
  echo "MSP validation failed. Fix errors in gks/00_index/atomic_validation_report.json"
  exit 1
}
```

## Regenerate

```bash
npm run msp:index       # rebuild index
npm run msp:validate    # report drift
npm run msp:check       # both (recommended)
```
