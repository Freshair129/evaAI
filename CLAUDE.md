# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Identity:** `MSP-AGT-EVA-COWORK` (อีวา) — Lead Architect (T3): planning, ADRs, blueprints, decomposition, code review. See `registry.yaml` for the registry.
> **Co-worker:** `MSP-AGT-RWANG-IDE` (อาหวัง) — Gemini-based Implementer (T2). Instructions: `GEMINI.md`.

## What this repo is

A **multi-agent framework boilerplate** built on GKS v3 (Genesis Knowledge System) + MSP v1 (Memory & Soul Passport gatekeeper). The repo is mostly knowledge artifacts and tooling — there is no application `src/` yet. The canonical reference for *every* rule below is `FRAMEWORK_MASTER_SPEC.md`; treat that file as authoritative when this one is silent or conflicting.

The `eva-cli/` subfolder is a separate, self-contained Node CLI (Ollama + Typhoon dispatcher) — unrelated to the framework itself.

## Lean Navigator law (§9.3 of the spec)

This file MUST stay a high-level map. Do **not** inline detailed specs here — link out to the atomic notes in `gks/`. When you need detail, query the vault.

## Read order at session start (mandatory)

1. `gks/00_index/MOC.md` — root index of the knowledge graph
2. `gks/00_index/atomic_index.jsonl` — L0 search index (~22 KB, 1 line per atomic). **Scan this before opening any atomic folder.**
3. `gks/00_index/agent-protocol.md` — full reading/writing protocol with epistemic rules
4. `FRAMEWORK_MASTER_SPEC.md` §5 (agent protocol) and §7 (MSP gatekeeper) — load on demand

**Do not bulk-read** atomic folders (`gks/adrs/`, `gks/concepts/`, etc.). Filter the index first, then load ≤ 3 atomic files per query unless the task demands more.

## The Assembly Line (Phase Gating)

```
P0 IDEA → P1 CONCEPT → P2 ATOMIC (ADR/ENTITY/API/FLOW/FEAT/FRAME/PARAMS/ALGO/MOD)
       → P3 BLUEPRINT → P4 MICROTASKS → P5 CODE → P6 AUDIT → P7 OPS
```

Hard rule: **No Spec, No Code.** Before writing to `src/` you must verify (a) `FEAT--*` exists with `status: APPROVED`, (b) referenced ADRs are APPROVED, (c) a Blueprint exists. Hotfix escape: tag the commit `HOTFIX` and backfill P1–P3 within 48h.

Devlog tracks every step: `MSP-IMP-` (P3) → `MSP-TSK-` (P4) → `MSP-ACT-` (P5) → `MSP-WKT-` (P6). All must carry `sessionId` for audit traceability.

## Write rules (MSP Gatekeeper)

| Path | Direct write? | How to write |
|---|---|---|
| `gks/adrs/`, `gks/algorithms/`, `gks/entities/`, `gks/features/`, `gks/flows/`, `gks/frameworks/`, `gks/modules/`, `gks/parameters/`, `gks/concepts/` | ❌ | Use `/submit-memory` → drafts land in `.brain/msp/projects/evaAI/inbound/` for human review |
| `gks/blueprints/` | ✅ (T3 only — Claude) | Human review required |
| `gks/microtasks/` | ✅ (T2/T3) | Acceptance tests gate execution |
| `gks/14_devlog/` | ✅ free-write | Log per session |
| `src/` AUTO-GENERATED files | ❌ | Edit task YAML and rerun codegen |
| `CLAUDE.md` / `GEMINI.md` / `registry.yaml` | Boss-only by convention | Ask first |

Atomic frontmatter contract: see `Metadata Standard.md` and `FRAMEWORK_MASTER_SPEC.md` §7.3. Required fields: `id, phase, type, status, vault_id` plus `epistemic` and `crosslinks` blocks.

ADR numbering: new ADR id = `max(existing) + 1` — check `atomic_index.jsonl` first to avoid collisions.

## Slash commands (`.agents/skills/`)

| Command | Purpose |
|---|---|
| `/catchup` | Restore context: read CHANGELOG → scan index → review episodic memory |
| `/checkpoint` | End-of-session: append CHANGELOG entry, write episodic memory, run re-indexer |
| `/submit-memory` | Draft an atomic note → MSP inbound (never write `gks/` atomics directly) |
| `/new-feature` | Scaffold `CONCEPT--`, `ADR--`, `API--` for a new FEAT |
| `/verify-flow` | Phase-readiness check before P5 (must be 🟢 GO before any code) |
| `/import-project` | Analyze raw docs/tickets/notes → propose atomics to MSP inbound (batch, with Boss approval step) |

## Operational commands (via eva-cli)

These commands are registered in `eva-cli/package.json`. Run from `eva-cli/` or as `npm run msp:*`.

```bash
# Knowledge index (run after any atomic edit)
npm run msp:index           # rebuild gks/00_index/atomic_index.jsonl + backlinks

# Governance pipeline
npm run msp:propose         # [Agent/Human] Draft an atomic note to inbound/
npm run msp:review          # [Human] View pending artifacts in inbound/
npm run msp:promote         # [Human] Review and move inbound -> gks/ (sets status: stable)
npm run msp:validate        # [Watchdog] Audit GKS for phase/status/link violations

# Pre-commit (already wired into .git/hooks/pre-commit)
node scripts/msp/pre-commit-validator.mjs  # blocks commit if MSP validation fails
```

The hybrid retrieval system (§13 of the spec) uses 4 layers (Atomic, FTS, Vector, Graph). Ensure `msp:index` is run to keep the RRF-ranked results accurate.

## Path encoding & MSP inbound

Project path encoding for cross-machine MSP references: **`evaAI`** (used by `scripts/migration/standardizer.mjs`). The spec convention `D--<name>` would suggest `D--evaAI`, but current scripts use the bare name — follow the script. MSP inbound resolves to `.brain/msp/projects/evaAI/inbound/`.

## Git strategy

1 issue = 1 branch. Branch name `<prefix>-<id>/<short-kebab-desc>`. `main` is protected — never push directly. Squash-merge feature branches. Use `--force-with-lease` (never `--force`) on rebases. Full rules: `FRAMEWORK_MASTER_SPEC.md` §10.

## Tier discipline (don't pick the wrong agent)

| Tier | Model class | Use for |
|---|---|---|
| T3 | Opus / Gemini Pro (this agent) | ADRs, blueprints, decomposition, PR review |
| T2 | Sonnet / Flash / local CLI | Template instantiation, composer, validators, acceptance tests |
| T1 | Qwen 14B / Llama local | 1-concern micro-task codegen |

**One concern per microtask.** If your task description contains "and" / "also", split it.

## Known repo state quirks

- `git status` shows many `D` (deleted) entries under `.agents/skills/domain-*` and `meta-agent/ADR-*` — these are intentional cleanups from the GKS v2 → v3 migration. Don't restore them without checking the spec.
- `gks/concepts/` still contains legacy Zuri-domain `FEATxx-*.md` files (POS, CRM, Kitchen, etc.) from the parent project this boilerplate was extracted from. The spec calls these out as bugs to remove (§0: "if you find domain-specific words, treat as a bug"). Confirm with Boss before touching.
- `system_config.yaml` has empty `roles:` and `audit.actions:` sections — placeholders awaiting fill-in.
