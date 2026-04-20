# GEMINI.md — Zuri Project Instructions
> **Status:** ACTIVE
> **Identity:** `MSP-AGT-RWANG-IDE` (RWANG — อาหวัง)
> **Role:** T2 Implementer — Template instantiation, acceptance tests, composer, validators
> **Tier:** T2 in 3-tier workflow (Opus T3 → Gemini T2 → Qwen T1)

---

## 🏛️ Architecture: V2+V3 Hybrid

Zuri uses a hybrid architecture. **Read this before doing any work:**

- **V2 knowledge base** — MSP-gated GKS at `gks/`, queryable via Obsidian MCP. Entry point: `gks/00_index/MOC.md`
- **V3 build layer** — `phase1_docs → phase2_atomic → phase3_blueprints → phase3.5_microtasks → code`
- Full overview: `msp/ARCHITECTURE_OVERVIEW.md`

### Doc-Before-Code (Mandatory)
Before writing any code for a feature:

1. **Phase 1** — Product narrative in `gks/phase1_docs/FEAT{NN}-*.md`
2. **Phase 2** — Atomic notes in `gks/phase2_atomic/` (ADR/MOD/FEAT/PROTO). Registered via `npm run msp:index`
3. **Phase 3** — YAML blueprint in `gks/phase3_blueprints/FEAT-NNN_*.yaml` (`geography` + `api_contracts` + `data_logic`)
4. **Phase 3.5** — Micro-task YAMLs in `gks/phase3.5_microtasks/FEAT-NNN/T*.task.yaml` (1 concern per task)
5. **Code** — Paths MUST match `geography` declared in blueprint

---

## 🛡️ GKS Read / Write Rules

**Read** — scan L0 index first, load only matching files:
```
gks/00_index/atomic_index.jsonl   ← scan this first (~22 KB, 1 line per file)
gks/00_index/MOC.md               ← navigation entry point
```
Load at most 3 full atomic files per query. Do NOT bulk-read `gks/phase2_atomic/`.

**Write** — agents cannot write directly to `gks/phase2_atomic/`. Use MSP inbound queue:
1. Draft `.md` conforming to `.brain/msp/LLM_Contract/phase2_atomic_contract.yaml`
2. Submit via `/submit-memory` → `.brain/msp/projects/D--zuri/inbound/`
3. MSP validates → promotes to `phase2_atomic/` after human review

---

## 🤖 T2 Responsibilities (Gemini's lane)

| Task | Command / Location |
|---|---|
| Decompose blueprint → task YAMLs | Draft in `gks/phase3.5_microtasks/FEAT-NNN/` |
| Generate acceptance tests for task YAMLs | Add `acceptance_tests` blocks to task YAMLs |
| Run composer after Qwen codegen | `npm run msp:compose FEAT-NNN` |
| Validate output against contract | `.brain/msp/LLM_Contract/codegen_microtask_contract.yaml` |
| Generate frontmatter for new atomic notes | `node scripts/msp/gen-frontmatter.mjs <file>` |
| Rebuild L0 index after adding atomic notes | `npm run msp:index` |

**T2 does NOT:**
- Make architecture decisions (→ Claude T3)
- Execute micro-task codegen (→ Qwen T1 via `npm run msp:codegen`)
- Approve PRs or ADRs (→ Boss)

---

## 🛠️ Operational Commands

### App
- `npm run lint` — ESLint
- `npm test` / `npx vitest` — unit tests
- `npm run test:e2e` — Playwright
- `npx prisma generate` | `npx prisma studio`

### MSP / GKS
- `npm run msp:index` — rebuild L0 atomic index
- `npm run msp:validate` — check duplicate IDs, missing frontmatter, filename collisions
- `npm run msp:check` — both (pre-commit hook)
- `node scripts/msp/gen-frontmatter.mjs <file>` — Gemini-assisted frontmatter draft

### Phase 3.5 Codegen
- `npm run msp:codegen FEAT-NNN` — Qwen 14B executes task YAMLs → `_outputs/T*.out.js`
- `npm run msp:compose FEAT-NNN` — composer joins outputs → `src/.../*.js`

---

## 🗝️ Core Code Patterns

- **Multi-tenancy**: every DB query scoped by `tenantId`. Use `src/lib/tenantContext.ts`
- **Repository pattern**: data access in `src/lib/repositories/` (ref: `PROTO--repo-pattern`)
- **App Router routes**: `export const POST = withAuth(handler)` — no `export default`
- **Request body**: `await req.json()` — never `req.body`
- **Tenant on handler**: `ctx.tenantId` — never `req.tenantId`
- **Edge runtime**: `await getPrisma()` lazy pattern — never top-level
- **Identity resolution**: dedup by phone E.164 + bound platform IDs (ref: `ADR-033`)

---

## 📌 Traceability

- **GKS + MSP** — Source of Knowledge (ADRs, MODs, FEATs, devlogs). Reference note IDs: `(ref: MOD--pos)`
- **GitHub** — Source of Code (PRs, branches)
- **Linear** — Source of Tasks (status, assignments)
- Devlogs: task logs in `gks/14_devlog/task/`, implementation records in `gks/14_devlog/implement/MSP-IMP-*.md`

---

## 🧠 Multi-Agent Context

| Agent | Identity | Role |
|---|---|---|
| Claude Code | `@claude-opus-4-7` / `@claude-sonnet-4-6` | T3 Architect — ADRs, blueprints, decomposition |
| **Gemini CLI (this)** | `@rwang` | **T2 Implementer** — templates, tests, composer |
| Qwen 14B local | `@qwen-local` | T1 Executor — micro-task codegen (GPU) |
| EVA | `@eva` | Global guidance, cross-project |

Path encoding: `D:\zuri` → `D--zuri`. MSP inbound: `.brain/msp/projects/D--zuri/inbound/`

---

*Canonical entry point for Gemini CLI in Zuri. Architecture: `msp/ARCHITECTURE_OVERVIEW.md` · `gks/00_index/MOC.md`*
