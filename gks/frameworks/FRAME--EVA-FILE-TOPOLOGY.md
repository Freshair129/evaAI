---
id: "FRAME--EVA-FILE-TOPOLOGY"
phase: 2
type: "framework"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.85
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-TRI-BRAIN"]
  implements: ["FRAME--TRI-BRAIN-ARCHITECTURE"]
  supersedes: []
  used_by: []
---

# FRAME--EVA-FILE-TOPOLOGY — Complete Filesystem Layout

> **Phase:** P2 — Framework Topology
> **Scope:** ทั้ง `~/` (global) และ `<repo>/` (project)
> **Authoritative:** YES (ถ้าโค้ดกับเอกสารขัดกัน → เอกสารนี้ชนะ)

---

## 1. กฎตัดสินใจ 3 มิติ

```
ความรู้/ข้อมูลนี้ใช้ได้หลายโปรเจกต์ไหม?
  └─ YES → ~/  (global)
  └─ NO  → <repo>/  (project)

agent อื่นเขียน/อ่านได้ไหม?
  └─ YES → .msp/ หรือ gks/  (shared)
  └─ NO  → .eva/ หรือ .rwang/  (private per-agent)

เป็นความรู้/data (commit) หรือ runtime state?
  └─ Data    → gks/   (หรือ ~/.gks/)
  └─ Runtime → .msp/, .eva/, .rwang/  (commit เฉพาะ summary)
```

---

## 2. Matrix 3 มิติ

|  | **Shared — DATA** | **Shared — RUNTIME** | **Private — RUNTIME** |
|---|---|---|---|
| **Global (`~/`)** | `~/.gks/` | `~/.msp/` | `~/.eva/`, `~/.rwang/` |
| **Project (`<repo>/`)** | `gks/` | `.msp/` | `.eva/`, `.rwang/` |

**ไม่มี "Private DATA"** เพราะความรู้ทุกอย่างต้อง shared ผ่าน inbound review

---

## 3. Global Tree (`~/`)

```
~/
│
├── .gks/                            ★ GLOBAL SHARED DATA
│   │                                  (cross-project knowledge base)
│   ├── frameworks/                    — FRAME--MSP-PROTOCOL, FRAME--GKS-v3
│   │   ├── FRAME--MSP-PROTOCOL.md
│   │   └── FRAME--GKS-v3.md
│   ├── standards/                     — Boss's personal coding standards
│   │   ├── CONCEPT--CODING-STYLE.md
│   │   └── ADR--USE-TYPESCRIPT-STRICT.md
│   ├── patterns/                      — reusable architecture patterns
│   │   ├── CONCEPT--TRI-BRAIN-PATTERN.md
│   │   └── CONCEPT--REACT-LOOP-PATTERN.md
│   ├── params/                        — model pricing, rate limits
│   │   └── PARAMS--MODEL-PRICING.md
│   └── 00_index/
│       └── atomic_index.jsonl         — global atomic search index
│
├── .msp/                            ★ GLOBAL SHARED RUNTIME
│   │                                  (cross-agent, cross-project events)
│   ├── CHANGELOG.jsonl                — macro events ONLY:
│   │                                    • major_release (v1→v2)
│   │                                    • path_move (repo relocation)
│   │                                    • agent_register / agent_retire
│   │                                    • breaking_migration
│   │                                    • workspace_rename
│   ├── agents.jsonl                   — agent registry mirror
│   └── projects-index.json            — known projects + paths
│
├── .eva/                            ★ GLOBAL PRIVATE (EVA only)
│   │                                  (cross-project EVA state)
│   ├── cache/                         — response cache, embedding cache
│   ├── model-prefs.json               — preferred Cortex model per task
│   ├── conversation-drafts/           — unsent drafts
│   └── skills/                        — user-level EVA skills (extensions)
│
└── .rwang/                          ★ GLOBAL PRIVATE (RWANG only)
    │                                  (future — mirrors .eva/)
    ├── cache/
    └── model-prefs.json
```

### Global scope: what goes here

| Content | Rule |
|---|---|
| Standards Boss ใช้ทุก project | `~/.gks/standards/` |
| Framework spec (MSP, GKS) | `~/.gks/frameworks/` |
| Reusable patterns | `~/.gks/patterns/` |
| Major release log (v2.0, v3.0) | `~/.msp/CHANGELOG.jsonl` |
| Path/workspace changes | `~/.msp/CHANGELOG.jsonl` |
| Agent preferences, cache | `~/.eva/`, `~/.rwang/` |

### Global: ไม่ควรเก็บ

- ❌ Project-specific concepts (อยู่ใน `<repo>/gks/`)
- ❌ Session transcripts (อยู่ใน `<repo>/.eva/sessions/`)
- ❌ Minor fix log (อยู่ใน `<repo>/CHANGELOG.jsonl`)

---

## 4. Project Tree (`<repo>/evaAI/`)

```
evaAI/
│
├── gks/                             ★ PROJECT SHARED DATA
│   │                                  (committed knowledge base)
│   ├── 00_index/
│   │   ├── atomic_index.jsonl         — project atomic search index
│   │   └── atomic_validation_report.json
│   ├── concepts/                      — P1 product/business concepts
│   │   ├── CONCEPT--EVA-TRI-BRAIN.md
│   │   ├── CONCEPT--EVA-MESSAGING-CONNECTORS.md
│   │   └── (no legacy domain files — removed per FRAMEWORK_MASTER_SPEC §0)
│   ├── frameworks/                    — P2 architecture frameworks
│   │   ├── FRAME--TRI-BRAIN-ARCHITECTURE.md
│   │   └── FRAME--EVA-FILE-TOPOLOGY.md   ← THIS FILE
│   ├── adrs/                          — P2 architecture decisions
│   │   ├── ADR--ROUTING-MATRIX.md
│   │   ├── ADR--FILE-BASED-VECTOR.md
│   │   ├── ADR--TUI-INK-STACK.md
│   │   └── ADR--CONNECTOR-TRANSPORT.md
│   ├── flows/                         — P2 process flows
│   │   ├── FLOW--REACT-LOOP.md
│   │   └── FLOW--INBOUND-MESSAGE.md
│   ├── entities/                      — P2 data models
│   │   └── ENTITY--SESSION-STATE.md
│   ├── blueprints/                    — P3 code generation specs
│   │   ├── BLUEPRINT--brains.yaml
│   │   ├── BLUEPRINT--tools.yaml
│   │   ├── BLUEPRINT--memory.yaml
│   │   └── BLUEPRINT--connectors.yaml
│   ├── microtasks/                    — P4 implementation tasks
│   │   └── FEAT-EVA-AGENT/
│   │       ├── manifest.yaml
│   │       └── README.md
│   ├── 14_devlog/                     — P5 delivery log
│   │   ├── implement/                   — MSP-IMP-* (plans)
│   │   ├── task/                        — MSP-TSK-* (task logs)
│   │   ├── walkthrough/                 — MSP-WKT-* (deliveries)
│   │   ├── incidents/                   — MSP-INC-* (post-mortems)
│   │   ├── reviews/                     — MSP-REV-* (code reviews)
│   │   └── experiment/                  — EXP-* (benchmarks)
│   └── (other legacy dirs: 03_algorithms, 07_safety, 08_apis, ...)
│
├── .msp/                            ★ PROJECT SHARED RUNTIME
│   │                                  (multi-agent protocol state)
│   ├── inbound/                       — review queue (agents propose atoms here)
│   │   ├── CONCEPT--XXX.md             (pending human approval)
│   │   └── ADR--YYY.md
│   ├── projects-index.json            — local project metadata
│   └── settings.yaml                  — shared runtime settings (rate limits, hooks)
│
├── .eva/                            ★ PROJECT PRIVATE (EVA only)
│   │                                  (EVA's workspace for this project)
│   ├── settings.yaml                  — EVA-specific: permissions, agents, hooks
│   │                                    (ตาม Claude Code pattern)
│   ├── sessions/                      — session transcripts [gitignore]
│   │   └── MSP-SESS-YYMMDDNNN/
│   │       ├── session.json
│   │       ├── messages.jsonl
│   │       └── traces.jsonl
│   ├── memory/                        — episodic memory [commit summaries]
│   │   └── MSP-SESS-YYMMDDNNN.md
│   ├── vector/                        — file-based embeddings [gitignore]
│   │   ├── atomic.jsonl
│   │   ├── atomic.manifest.json
│   │   ├── obsidian.jsonl
│   │   └── episodic.jsonl
│   ├── logs/                          — structured audit [gitignore]
│   │   ├── tools.jsonl
│   │   └── <session-id>.jsonl
│   └── connectors/                    — LINE/TG session maps [gitignore]
│       └── session-map.json
│
├── .rwang/                          ★ PROJECT PRIVATE (RWANG — future)
│   │                                  (mirrors .eva/ structure)
│   ├── settings.yaml
│   ├── sessions/
│   └── memory/
│
├── eva-cli/                         ★ CODE (owned by EVA)
│   ├── bin/eva.js
│   ├── src/...
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/                         ★ TOOLING
│   ├── msp/
│   │   ├── re-indexer.mjs
│   │   ├── re-embed.mjs               (planned)
│   │   ├── check-write-path.mjs       (planned — PreToolUse hook)
│   │   ├── check-bash-blocklist.mjs   (planned)
│   │   ├── catchup.mjs                (planned — SessionStart hook)
│   │   ├── write-wkt.mjs              (planned — Stop hook)
│   │   ├── append-changelog.mjs       (planned)
│   │   └── pre-commit-validator.mjs
│   └── migration/
│       └── standardizer.mjs
│
├── EVA.md                           ★ AGENT INSTRUCTIONS (EVA pointer)
├── GEMINI.md                        ★ AGENT INSTRUCTIONS (RWANG pointer)
├── registry.yaml                    ★ SSOT — IDs, paths, agent registry
├── system_config.yaml               ★ SSOT — feature flags, theme, rates
├── CHANGELOG.jsonl                  ★ PROJECT release log (feat/fix/chore)
├── FRAMEWORK_MASTER_SPEC.md         ★ master governance spec
├── Metadata Standard.md             ★ frontmatter schema
└── .gitignore
```

---

## 5. File Type × Scope × Commit Matrix

| File | Scope | Owner | Committed? | Hidden? |
|---|---|---|---|---|
| `~/.gks/**/*.md` | Global | MSP | ✅ (separate git repo) | ✅ |
| `~/.msp/CHANGELOG.jsonl` | Global | MSP | ✅ (separate git repo) | ✅ |
| `~/.eva/cache/**` | Global | EVA | ❌ | ✅ |
| `~/.rwang/**` | Global | RWANG | ❌ | ✅ |
| `gks/**/*.md` | Project | MSP | ✅ | ❌ |
| `gks/00_index/atomic_index.jsonl` | Project | auto | ✅ | ❌ |
| `.msp/inbound/**` | Project | MSP | ✅ (review trail) | ✅ |
| `.msp/settings.yaml` | Project | MSP | ✅ | ✅ |
| `.eva/settings.yaml` | Project | EVA | ✅ | ✅ |
| `.eva/sessions/**` | Project | EVA | ❌ | ✅ |
| `.eva/memory/*.md` | Project | EVA | ✅ (summaries) | ✅ |
| `.eva/vector/**` | Project | EVA | ❌ | ✅ |
| `.eva/logs/**` | Project | EVA | ❌ | ✅ |
| `.eva/connectors/**` | Project | EVA | ❌ | ✅ |
| `CHANGELOG.jsonl` | Project | MSP | ✅ | ❌ |
| `EVA.md` | Project | EVA | ✅ | ❌ |
| `GEMINI.md` | Project | RWANG | ✅ | ❌ |
| `registry.yaml` | Project | MSP | ✅ | ❌ |
| `eva-cli/**` | Project | EVA | ✅ | ❌ |

---

## 6. `.gitignore` Pattern

```gitignore
# ─── Private runtime (ephemeral) ───
.*/sessions/
.*/vector/
.*/logs/
.*/cache/
.*/connectors/

# ─── Committed private ────────────
!.eva/memory/*.md
!.eva/settings.yaml
!.rwang/memory/*.md
!.rwang/settings.yaml

# ─── Shared runtime ───────────────
!.msp/inbound/
!.msp/settings.yaml

# ─── Build artifacts ──────────────
node_modules/
dist/
coverage/

# ─── Secrets ──────────────────────
.env
.env.local
*.pem
id_rsa*
```

---

## 7. Data Flow

### 7.1 Knowledge promotion (private → shared)

```
EVA drafts idea in session
     ↓
write to .msp/inbound/CONCEPT--NEW.md  (proposal)
     ↓
human review (Boss)
     ↓ approve
move to gks/concepts/CONCEPT--NEW.md
     ↓
scripts/msp/re-indexer.mjs updates gks/00_index/atomic_index.jsonl
     ↓
(optional) if cross-project utility → copy to ~/.gks/patterns/
```

### 7.2 Delivery (session → changelog)

```
Session ends (exit / Ctrl+D / idle)
     ↓
Stop hook: scripts/msp/write-wkt.mjs
     ↓
generate gks/14_devlog/walkthrough/MSP-WKT-*.md
     ↓
Stop hook: scripts/msp/append-changelog.mjs
     ↓
append line to CHANGELOG.jsonl
     ↓
if change_type == "major_release" or breaking:
     ↓
     prompt Boss → append to ~/.msp/CHANGELOG.jsonl
```

### 7.3 Memory retrieval (agent reads)

```
Agent needs context
     ↓
read .eva/memory/ (episodic — own history)
     ↓
read .msp/inbound/ (pending proposals)
     ↓
search gks/ via atomic_index.jsonl (project knowledge)
     ↓
search ~/.gks/ (global patterns — on demand)
     ↓
vector search .eva/vector/atomic.jsonl (semantic)
```

### 7.4 Change audit (trace a line of code)

```
git blame src/foo.ts
     ↓ commit SHA
git log <sha> → commit message "refs MSP-WKT-260421001-001"
     ↓
cat gks/14_devlog/walkthrough/MSP-WKT-260421001-001.md
     ↓ frontmatter: refs [CONCEPT--EVA-TRI-BRAIN, ADR--ROUTING-MATRIX]
cat gks/concepts/CONCEPT--EVA-TRI-BRAIN.md
     ↓
full rationale + links + metrics
```

---

## 8. Governance Layer

### `.eva/settings.yaml` (Claude Code-style)
- `permissions.allow` / `permissions.deny` — glob patterns
- `agents.<id>.tools` — per-agent tool scope
- `hooks.PreToolUse` / `PostToolUse` / `SessionStart` / `Stop`
- `ignorePatterns`
- `mcpServers`
- `defaultMode`

Reference: see `FRAME--EVA-GOVERNANCE.md` (to be written)

### `registry.yaml` (SSOT)
- ID conventions
- Path mappings
- Agent registry
- Casing standards

### Multi-agent isolation
- EVA writes only to `.eva/**` + `.msp/inbound/**` + code under `eva-cli/**`
- RWANG writes only to `.rwang/**` + `.msp/inbound/**` + code under its scope
- Both read everything except each other's private runtime

---

## 9. Comparison to Industry

| Feature | Claude Code | Gemini CLI | Antigravity | **EVA (this)** |
|---|---|---|---|---|
| Agent config | `~/.claude/` | `~/.gemini/` | `~/.antigravity/` | `~/.eva/` |
| Project settings | `.claude/settings.json` | `GEMINI.md` | `AGENTS.md` | `.eva/settings.yaml` |
| Agent instructions | `CLAUDE.md` | `GEMINI.md` | `AGENTS.md` | `EVA.md` / `GEMINI.md` |
| Session transcripts | `~/.claude/projects/` | `~/.gemini/tmp/` | session.json | `.eva/sessions/` |
| Shared knowledge | — | — | — | `gks/` + `~/.gks/` |
| Multi-agent | ❌ | ❌ | partial | ✅ `.eva/`, `.rwang/` |
| Release log | `CHANGELOG.md` | — | history tab | `CHANGELOG.jsonl` (grep-friendly) |
| Devlog (IMP/TSK/WKT) | — | — | ✅ | ✅ `gks/14_devlog/` |
| Cross-project macro log | — | — | — | `~/.msp/CHANGELOG.jsonl` |

---

## 10. Migration Path from Current State

Current state uses `.brain/msp/projects/evaAI/**` — a drift from registry spec.
Target state uses `.eva/` + `.msp/` + `.rwang/` + `gks/`.

| Current path | Target path | Action |
|---|---|---|
| `.brain/msp/projects/evaAI/sessions/` | `.eva/sessions/` | mv + gitignore |
| `.brain/msp/projects/evaAI/memory/` | `.eva/memory/` | mv + commit `*.md` |
| `.brain/msp/projects/evaAI/vector/` | `.eva/vector/` | mv + gitignore |
| `.brain/msp/projects/evaAI/inbound/` | `.msp/inbound/` | mv (changes scope!) |
| `.brain/msp/projects/evaAI/logs/` | `.eva/logs/` | mv + gitignore |
| `.brain/msp/projects/evaAI/connectors/` | `.eva/connectors/` | mv + gitignore |
| `~/.brain/msp/CHANGELOG.jsonl` | `~/.msp/CHANGELOG.jsonl` | mv |
| `~/.brain/gks/global/` | `~/.gks/` | mv |
| `src/config/permissions.yaml` | `.eva/settings.yaml` | merge with new fields |
| (none) | `EVA.md` | create pointer file |
| (none) | `CHANGELOG.jsonl` | create at repo root |
| (none) | `~/.gks/` | create (git repo) |

Code changes required:
- `src/config/index.ts` — path constants (8 paths)
- `src/connectors/session-map.ts` — 1 path
- Update `registry.yaml` — remove `~/.brain/` references
- Update `.gitignore` — new patterns

---

## 11. Open Questions

1. `~/.gks/` sync strategy — git repo? Obsidian/Syncthing? (cf. ADR required)
2. Promote atoms project → global: manual or via `target_scope: global` flag?
3. `.rwang/` structure — identical to `.eva/` or framework-agnostic?
4. Should `.msp/inbound/` auto-expire after N days if unreviewed?

(Answers in `ADR--GKS-SYNC-STRATEGY.md` — to be written)

---

## 12. Change Log for This Doc

| Date | Change | Author |
|---|---|---|
| 2026-04-21 | Initial draft | MSP-AGT-EVA-COWORK |
