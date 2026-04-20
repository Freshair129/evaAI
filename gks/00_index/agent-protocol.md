---
id: "agent-protocol"
type: "protocol"
summary: "Rules AI agents must follow when reading/writing this Knowledge Graph (V2+V3 hybrid)"
status: "active"
version: "2.0.0"
updated_at: 2026-04-19
updated_by: "@claude-opus-4-7"
---
# 🤖 Agent Navigation Protocol

> [!IMPORTANT]
> Mandatory for all agents (Claude, Gemini, EVA, RWANG local). Violations cause GKS drift and may be blocked by MSP validators.

---

## 1. Session Startup

1. **Read MOC first** — `gks/00_index/MOC.md` (this file's parent index) for orientation.
2. **Scan L0 index next** — `gks/00_index/atomic_index.jsonl` (~22 KB) to discover atomic notes. Do NOT bulk-read `phase2_atomic/`.
3. **Load at most 3 full atomic files per query** unless the task explicitly demands more.
4. **Read the relevant architecture doc** — `msp/ARCHITECTURE_OVERVIEW.md` for MSP/GKS flow.

---

## 2. Reading Rules (Epistemic-aware)

Each atomic note declares `epistemic.confidence` + `epistemic.source_type` in frontmatter. Treat them like citations:

1. `confidence ≥ 0.8` + `source_type: direct_experience` → **ASSERT** freely
2. `confidence 0.6–0.8` + `source_type: inferred` → **CAVEAT** before asserting
3. `confidence < 0.6` or `source_type: external` → **VERIFY** by reading current code; do NOT assert blindly
4. `context_anchor.duration: temporary` + `valid_until` past → treat as **deprecated**
5. `status: draft` or `status: stub` → unstable; flag to user before relying on

**Citation format**: `(ref: MOD--crm)` or `(ref: ADR-069)` when the response is derived from the vault.

**On knowledge gaps**: say "Knowledge not found in GKS" rather than inventing. You MAY propose a new atomic note via MSP inbound queue.

---

## 3. Writing Rules (MSP Gatekeeper)

### 3.1 Atomic notes (phase2_atomic/)
Agents **cannot** write directly. Follow the MSP inbound pattern:

1. **Check L0 index first** — `atomic_index.jsonl` — for existing IDs (prevents duplicates + invented ADR numbers)
2. **Draft** a new `.md` file conforming to `.brain/msp/LLM_Contract/phase2_atomic_contract.yaml`
   - Required: id, type, status, summary, created_at, created_by
   - Forbidden: commit_hash, tenant_id, promotion_level, reviewer_approved_at (MSP-owned)
   - For ADR: id must be `max(existing) + 1`
3. **Submit** via `/submit-memory` skill → drops into `.brain/msp/projects/D--zuri/inbound/`
4. **Wait** — MSP validates against contract + links + frontmatter schema
5. **Never** edit files in `phase2_atomic/` directly in a commit, unless fixing a validator error

### 3.2 Code (src/)
For implementation of a Phase 3 blueprint:

1. **Check blueprint** — `gks/phase3_blueprints/FEAT-NNN.yaml` (`geography`, `api_contracts`)
2. **Decompose into micro-tasks** — one concern per task in `gks/phase3.5_microtasks/FEAT-NNN/T*.task.yaml`
3. **Run** `npm run msp:codegen FEAT-NNN` (Qwen 14B local executes each task, acceptance tests gate each output)
4. **Compose** `npm run msp:compose FEAT-NNN` (deterministic joiner → `src/.../*.js`)
5. **Never** hand-edit an AUTO-GENERATED file. Update the task YAMLs and regenerate.

Forbidden in generated code (enforced by `codegen_microtask_contract.yaml`):
- `export default` in Next.js App Router route files (use `export const POST = ...`)
- `req.body` (use `await req.json()`)
- Fabricated imports (`joi`, `uuid`, `zod`, `yup`, `lodash`, `moment`) unless in `package.json`
- `console.log`, `TODO`, `FIXME`, `XXX` markers

### 3.3 Other writes
- Devlogs: free-write to `gks/14_devlog/task/`, `gks/14_devlog/implement/`, `gks/14_devlog/experiment/`
- Phase 3.5 task YAMLs: free-write (human or Opus authored); runner will validate at execution
- Blueprints (phase3_blueprints): Opus/Gemini write; reviewed by Boss

---

## 4. Token Efficiency

1. **L0 index first** → filter by tag/type/module → load specific files. Avoid bulk-reading `phase2_atomic/`.
2. **Don't repeat ADR content** in your response; cite `(ref: ADR-NNN)` and paraphrase.
3. **Micro-task prompts**: keep ≤ 400 tokens, 1 concern each. Longer prompts bleed retries.
4. **Prompt cache**: order your system prompt with stable prefixes first (CLAUDE.md, MOC.md, LAWS) so Anthropic cache hit rate stays high.

---

## 5. Maintenance

1. **Status check**: `status: draft` or `status: stub` = unstable, caveat assertions.
2. **Stale detection**: if `updated_at` > 90 days and `context_anchor.duration ≠ universal`, surface to user.
3. **Contradiction check**: if two notes disagree (e.g. ADR-069 vs ADR-062 on doc storage), flag immediately.
4. **Duplicate check**: if two files normalize to the same filename (`ADR-057-...` vs `ADR-057--...`), pre-commit hook blocks — run `npm run msp:validate` to diagnose.

---

## 6. Multi-agent Coordination

- **Path encoding**: Zuri → `D--zuri`. MSP inbound at `.brain/msp/projects/D--zuri/inbound/`.
- **Tiered workflow** (from pilot):
  - **Opus** (T3): Architecture decisions, blueprint authoring, Phase 3.5 decomposition, PR review
  - **Gemini CLI** (T2): Template instantiation, acceptance test generation, composer, validators
  - **Qwen 14B local** (T1): Micro-task codegen (1 concern each, free/local/GPU)
- See `gks/14_devlog/experiment/EXP-2026-04-19-phase35-pilot-report.md` for concrete numbers.

---

*Superseded rules*: earlier versions referenced `registry.yaml` ZRI-IMP-xxxx codes and `13_meta/schema-v2`. Those paths no longer exist in V2. Canonical frontmatter is defined by `.brain/msp/LLM_Contract/phase2_atomic_contract.yaml`.
