# CLAUDE.md — Zuri

## 🤖 Context
- **Project**: Zuri (Omni-channel CRM & Education POS)
- **Framework**: V2+V3 Hybrid (V2 knowledge base + V3 blueprint→code 1:1 mapping)
- **Role**: Lead Planner & Architect
- **Co-worker**: RWANG — อาหวัง (Gemini-based Implementer)

## 🏛️ Governance — V2 Knowledge + V3 Build

Zuri uses a hybrid architecture:
- **V2 knowledge base** — MSP-gated GKS at `gks/`, agent-queryable via Obsidian MCP, atomic schema (ADR/MOD/FEAT/PROTO/FLOW)
- **V3 build layer** — `phase1_docs → phase2_atomic → phase3_blueprints → code` with enforced 1:1 mapping between `phase3_blueprints/*.yaml` (`geography`, `api_contracts`) and implementation files

Architecture overview: `msp/ARCHITECTURE_OVERVIEW.md`

### Workflow: Doc-Before-Code
Before writing code for any feature:
1. **Phase 1** — Product narrative in `gks/phase1_docs/FEAT{NN}-*.md`
2. **Phase 2** — Atomic decisions/modules/protocols in `gks/phase2_atomic/` (ADR/MOD/FEAT/PROTO). MUST be declared in `gks/00_index/atomic_index.jsonl` via `npm run msp:index`.
3. **Phase 3** — YAML blueprint in `gks/phase3_blueprints/FEAT-NNN_*.yaml` declaring `geography` (component/repository/route paths) + `api_contracts` + `data_logic`
4. **Code** — Implementation MUST match `geography` paths declared in the blueprint
5. **Devlog** — Task log in `gks/14_devlog/task/` and implementation record in `gks/14_devlog/implement/MSP-IMP-*.md`

Hotfix escape hatch: tag commit with `HOTFIX`, backfill phase1-3 artifacts within 48h.

## 📂 Knowledge Base Layout (GKS)

| Location | Purpose |
|---|---|
| `gks/00_index/` | L0 search index (`atomic_index.jsonl`) + MOC. Agents scan this FIRST before loading full files. |
| `gks/phase1_docs/` | Product docs (PRD, FEAT specs, roadmap) |
| `gks/phase2_atomic/` | Atomic ADR / MOD / FEAT / PROTO / FLOW (human-readable, linked via `[[wikilinks]]`) |
| `gks/phase3_blueprints/` | YAML implementation blueprints (source of truth for code layout) |
| `gks/14_devlog/` | Task logs (`task/`, `implement/`, `incidents/`, `reviews/`) |
| `msp/` | MSP (Memory & Soul Passport) — gatekeeper config |
| `.brain/msp/LLM_Contract/` | Forbidden-fields + anti-hallucination contracts (e.g. `phase2_atomic_contract.yaml`) |

### Write rules (MSP Gatekeeper)
- Agents **cannot** write directly to `gks/phase2_atomic/`. Submit proposals via `/submit-memory` → MSP inbound queue → validator → merge.
- Frontmatter MUST conform to `.brain/msp/LLM_Contract/phase2_atomic_contract.yaml` (required fields, forbidden fields, anti-hallucination rules).
- New ADR number = `max(existing ADR numbers) + 1` — check `gks/00_index/atomic_index.jsonl` first.

### Read pattern (token-efficient)
- Scan `gks/00_index/atomic_index.jsonl` (~22 KB) to discover relevant files.
- Load only matching full files. Do **not** bulk-read `phase2_atomic/`.

## 💻 Technical Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: Prisma + PostgreSQL (Multi-tenant row-level isolation)
- **Real-time**: Pusher (tenant-prefixed channels)
- **Automation**: QStash (background workers)
- **AI**: Gemini 2.x for content/reply; Claude for architecture
- **Cache**: Upstash Redis (`getOrSet` pattern)

## 🛠️ Operational Commands

### App
- `npm run lint` — ESLint
- `npm test` / `npx vitest` — unit tests
- `npm run test:e2e` — Playwright
- `npx prisma generate` | `npx prisma studio`

### MSP / Knowledge base
- `npm run msp:index` — rebuild L0 atomic index
- `npm run msp:validate` — check for duplicate IDs, missing frontmatter, filename collisions
- `npm run msp:check` — both (runs as pre-commit hook via husky)
- `node scripts/msp/gen-frontmatter.mjs <file>` — Gemini-assisted frontmatter draft for a markdown file

### Phase 3.5 Codegen (blueprint → code)
- `npm run msp:codegen FEAT-NNN` — Qwen 14B local executes each task YAML → `_outputs/T*.out.js`
- `npm run msp:compose FEAT-NNN` — deterministic composer joins task outputs → `src/.../*.js`
- Task YAMLs live in `gks/phase3.5_microtasks/FEAT-NNN/`. Schema: `gks/phase3.5_microtasks/_SCHEMA.yaml`
- **Never hand-edit AUTO-GENERATED files** — update task YAMLs and rerun codegen

### Pre-commit
Installed via husky. Blocks commit if `msp:check` fails. Bypass for emergencies: `git commit --no-verify` + tag HOTFIX.

## 🗝️ Core Code Patterns
- **Multi-tenancy**: Every DB query MUST be scoped by `tenantId`. Use `src/lib/tenantContext.ts`.
- **Repository Pattern**: Data access in `src/lib/repositories/` (see `PROTO--repo-pattern.md`).
- **Identity Resolution**: Customers dedup by phone (E.164) + bound platform IDs (FB/LINE). See `ADR-033--identity-resolution.md`.
- **Edge Runtime**: Use `await getPrisma()` lazy pattern (never top-level `getPrisma()`). See CHANGELOG v2.7.0b.

## 🧠 Multi-Agent Notes

**Path encoding**: This project resolves to `D--zuri`. MSP inbound at `.brain/msp/projects/D--zuri/inbound/`.

**3-Tier Workflow:**

| Tier | Agent | Responsibility |
|---|---|---|
| T3 | **Claude (this)** | Architecture decisions, blueprint authoring, Phase 3.5 decomposition, PR review |
| T2 | **Gemini CLI** (local) | Template instantiation, acceptance test generation, composer, validators |
| T1 | **Qwen 14B** (local GPU) | Micro-task codegen — 1 concern per task, ctx=4096, 43 tok/s |

Agents read via Obsidian MCP / Read tool; write via MSP inbound queue only.

---
*Canonical entry point for Claude Code in Zuri. Deeper architecture: `msp/ARCHITECTURE_OVERVIEW.md` · `gks/phase2_atomic/PROTO--gks-v3-architecture.md`*
