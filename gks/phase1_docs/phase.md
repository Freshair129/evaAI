# Phase Plan — Phase {N}: {Phase Name}
> Planning document. Details one phase of the roadmap.
> Update: before phase execution begins.
> Rule: All Feature Specs for this phase must be APPROVED before starting.

**Status:** `{PLANNED | ACTIVE | COMPLETED}`
**Dates:** {start} → {end}
**Roadmap:** `roadmap.md`

---

## Goal

{One paragraph: what is true when this phase is complete? What can users do that they couldn't before?}

---

## Features in This Phase

| # | Feature | Spec | ADR needed? | IMP | Status |
|---|---|---|---|---|---|
| 1 | {feature} | `FEAT-XX` | Yes → ADR-NNN | IMP-XXXX | `{TODO → DONE}` |
| 2 | {feature} | `FEAT-YY` | No | IMP-YYYY | `{TODO}` |

---

## Build Order

<!-- Features may depend on each other. This defines the sequence. -->

```
{Feature A} ──▶ {Feature B} ──▶ {Feature C}
                     │
                     └──▶ {Feature D} (parallel)
```

| Order | Feature | Depends on | Reason |
|---|---|---|---|
| 1st | {Feature A} | — | {Foundation — others build on this} |
| 2nd | {Feature B} | A | {Needs A's schema/API} |
| 3rd | {Feature C, D} | B | {Can run in parallel} |

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| {risk} | `{H/M/L}` | `{H/M/L}` | {how to handle} |

---

## Success Criteria

<!-- Phase is COMPLETED when ALL criteria are met. -->

- [ ] {All features in table above are IMPLEMENTED}
- [ ] {Walkthroughs written for all features}
- [ ] {No P0 bugs open}
- [ ] {Boss has verified key flows on production}

---

## Phase Retrospective (fill after completion)

**What went well:**
- {item}

**What didn't go well:**
- {item}

**Lessons learned:**
- {item — candidate for GKS promotion}
