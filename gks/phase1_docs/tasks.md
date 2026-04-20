# Created At: {YYYY-MM-DD HH:mm:ss} +07:00 (v1.0.0)
# Previous version: —
# Last Updated: {YYYY-MM-DD HH:mm:ss} +07:00 (v1.0.0)

**Type**: TSK
**Status**: `{DRAFT | TODO | LOCKED | WIP | REVIEW | FEEDBACK | DONE | ARCHIVED}`
**Complexity**: `{S | M | L | XL}`
**Linear**: [{ZUR-X}](https://linear.app/zuri10/issue/zur-X)
**Agent**: {EVA-AGT-[CODENAME]-[PLATFORM]}
**Claimed by**: `{agent ID | unclaimed}`
**Locked by**: `{dependency list | —}`
**File locks**: `{list of files this task will modify | —}`

| **Agent ID** | {EVA-AGT-[CODENAME]-[PLATFORM]} |
| **Model**    | {claude-opus-4-6 / claude-sonnet-4-6} |
| **Platform** | {Claude Code / Claude Cowork / Desktop} |

# Task Log: {EVA-TSK-YYYYMMDD-NNN}
## {Title — short, descriptive}

- **Status**: {same as frontmatter}
- **Implementation Plan**: [[{EVA-IMP-XXXX}]](file:///path/to/IMP)

---

## Task State Machine

```
                    ┌──────────┐
                    │  DRAFT   │  Task created, not ready
                    └────┬─────┘
                         │ agent fills checklist + AC
                         ▼
                    ┌──────────┐
                    │   TODO   │  Ready to be claimed
                    └────┬─────┘
                         │
            ┌────────────┤
            │            │
            ▼            ▼
      ┌──────────┐ ┌──────────┐
      │  LOCKED  │ │   WIP    │  Claimed by an agent
      │(blocked) │ │(working) │
      └────┬─────┘ └────┬─────┘
           │             │
           │ deps done   │ implementation done
           │     ┌───────┘
           ▼     ▼
      ┌──────────┐
      │  REVIEW  │  ← TaskCompleted hook runs here
      └────┬─────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌──────────┐ ┌──────────┐
│ FEEDBACK │ │   DONE   │  All AC passed
│(hook:fix)│ └────┬─────┘
└────┬─────┘      │ move to achieved/
     │            ▼
     └──────▶┌──────────┐
             │ ARCHIVED │
             └──────────┘
```

### Status Definitions

| Status | Meaning | Who sets it | Claimable? |
|---|---|---|---|
| `DRAFT` | Task created, checklist/AC not filled yet | Lead agent | No |
| `TODO` | Ready to work, no blockers | Lead agent | **Yes — self-claim** |
| `LOCKED` | Has unresolved dependencies — cannot start | Auto (dependency check) | **No — blocked** |
| `WIP` | Agent is actively working on this | Claiming agent | No (claimed) |
| `REVIEW` | Code done, TaskCompleted hook running | Agent | No |
| `FEEDBACK` | Hook rejected — needs fixes | TaskCompleted hook | No (back to claimer) |
| `DONE` | All AC passed, hook approved | Hook / Lead | No |
| `ARCHIVED` | Moved to `achieved/tasks/` | System | No |

### Self-Claiming Rules

```
Agent ว่าง (idle) → scan TODO tasks → pick first unclaimed task where:
  1. Status = TODO (not LOCKED, not WIP)
  2. All dependencies resolved (blocker tasks = DONE)
  3. No file lock conflict (files not locked by another WIP task)
  4. Complexity ≤ agent's capability (S/M = any model, L/XL = Opus only)

Claim → set Status = WIP, Claimed by = agent ID, lock files
```

### Dependency Auto-Lock

```
Task B depends on Task A:
  - If Task A status ≠ DONE → Task B status = LOCKED
  - When Task A → DONE → auto-check Task B:
    - All other deps DONE? → Task B → TODO (claimable)
    - Still has pending deps? → stays LOCKED
```

---

## Related Documents, Boundary & Dependencies

### Related Documents
| Document | Path | Role |
|---|---|---|
| Feature Spec | `docs/product/specs/{FEAT-XX}.md` | Requirements source |
| ADR | `docs/decisions/adrs/{ADR-NNN}.md` | Architecture decision |
| IMP | `.eva/devlog/implement/{EVA-IMP-XXXX}.md` | Build plan |
| Module Manifest | `docs/product/module-manifests/{module}.yaml` | Code ownership |

### Boundary
| In Scope | Out of Scope |
|---|---|
| {what this task covers} | {what it does NOT cover} |

### Dependencies (Auto-Lock Source)
<!-- LOCKED status is derived from this table. -->
<!-- Task stays LOCKED until ALL Blocker deps are DONE. -->

| Dependency | Type | Status | Notes |
|---|---|---|---|
| {EVA-TSK-YYYYMMDD-NNN} | `Blocker` | `{TODO|WIP|DONE}` | {must complete before this task} |
| {EVA-TSK-YYYYMMDD-NNN} | `Internal` | `{status}` | {related but not blocking} |
| {module/feature} | `Downstream` | — | {will be affected by this task} |

### File Locks
<!-- Files this task will create or modify. Prevents merge conflicts. -->
<!-- Rule: If another WIP task locks the same file → this task cannot start. -->

| File Path | Lock type | Conflict with |
|---|---|---|
| `{src/path/to/file.js}` | `Write` | `{EVA-TSK-* if any, or —}` |
| `{prisma/schema.prisma}` | `Write` | `{⚠️ CRITICAL — coordinate first}` |

---

## Checklist
<!-- Step-by-step checkboxes. Each step = one focused action. -->
<!-- Mark [x] as you complete each step. -->

- [ ] {Step 1: exact action — e.g., "Add CustomerNote model to schema.prisma"}
- [ ] {Step 2: exact action}
- [ ] {Step 3: exact action}
- [ ] {Step 4: exact action}
- [ ] {Push to GitHub and verify on Vercel}

---

## Acceptance Criteria
<!-- CRITICAL: TaskCompleted hook validates these. ALL must pass or task bounces to FEEDBACK. -->
<!-- Write criteria that are machine-checkable where possible. -->

- [ ] {Observable outcome — e.g., "GET /api/customers returns paginated list"}
- [ ] {Security — e.g., "Unauthorized role returns 403"}
- [ ] {No console errors in browser}
- [ ] {Spec compliance — behavior matches FEAT-XX § section}
- [ ] {Walkthrough written — spec compliance table filled}
- [ ] {Concerns.md updated if new gotchas discovered}

---

## Files Changed
<!-- Fill AFTER implementation. Record what was actually created/modified. -->
<!-- Used by file locking system to release locks when DONE. -->

| Action | File Path | What changed |
|---|---|---|
| Created | `{src/path/to/new-file.js}` | {description} |
| Modified | `{src/path/to/existing-file.js}` | {what changed} |

---

## Actions
<!-- Narrative log of what was done. Write as you go. -->

- {Action 1: what you did}
- {Action 2: what you did}

## Bugs Fixed (if any)
<!-- Discovered during implementation — log here for audit trail. -->

1. **{Bug name}** — {root cause}; {fix applied}

## Notes
<!-- Optional: gotchas discovered, decisions made during implementation. -->
<!-- Candidates for concerns.md or GKS promotion. -->

- {Note}
