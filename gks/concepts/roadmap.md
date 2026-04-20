# Roadmap — {Product Name}
> Planning document. Breaks the product into phases with milestones.
> Update: quarterly or when major priorities shift.
> Rule: Each phase should have a Phase Plan before execution begins.

**Version:** {X.Y.Z}
**Date:** {YYYY-MM-DD}
**Author:** {Product Owner / Agent}

---

## Overview

```
{Visual timeline}

Phase 1          Phase 2          Phase 3          Phase 4
Foundation       Core Business    AI & Automation  Scale & Polish
{dates}          {dates}          {dates}          {dates}
─────────────────────────────────────────────────────────────▶
```

---

## Phases

### Phase 1: {Phase Name} — {dates}

**Goal:** {One sentence — what's true when this phase is done}

**Features included:**
| Feature | Spec | Priority | Status |
|---|---|---|---|
| {FEAT01} | `specs/FEAT01-*.md` | P0 | `{APPROVED | IMPLEMENTED}` |

**Success criteria:**
- [ ] {Observable outcome 1}
- [ ] {Observable outcome 2}

**Phase Plan:** `roadmap/phases/phase-01-{name}.md`

---

### Phase 2: {Phase Name} — {dates}

{Repeat structure...}

---

## Dependencies Between Phases

```
Phase 1 ──▶ Phase 2 ──▶ Phase 3
                │
                └──▶ Phase 4 (can start in parallel)
```

| From | To | What must be done first |
|---|---|---|
| Phase 1 | Phase 2 | {Auth + Multi-tenant must be live} |

---

## Backlog (Unscheduled)

| Feature | Why unscheduled | Revisit when |
|---|---|---|
| {feature} | {reason} | {trigger} |
