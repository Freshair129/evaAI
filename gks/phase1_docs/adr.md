# ADR-{NNN}: {Decision Title}
> Phase 3: ARCHITECT — Records a significant technical decision and its reasoning.
> Gate: Boss APPROVED before implementation proceeds.
> Rule: Not required for UI-only features or simple CRUD.

**Status:** `{DRAFT | REVIEW | APPROVED | SUPERSEDED}`
**Date:** {YYYY-MM-DD}
**Author:** {Agent ID}
**Approver:** {Boss}
**Supersedes:** {ADR-XXX (if replacing a previous decision)}
**Related Spec:** {FEAT-XX}

---

## Context

<!-- What is the problem or situation that requires a decision?
     Include: technical constraints, business constraints, timeline pressure.
     Be specific — reference real incidents, performance numbers, or code paths. -->

{Why are we making this decision? What forces are at play?}

---

## Decision

<!-- What did we decide? Be concrete — not "we will use caching" but "we will use Upstash Redis with 60s TTL, key pattern: crm:list:{tenantId}:{filterHash}". -->

{The decision, in concrete and specific terms.}

### Implementation Details

{How this decision translates to actual code/infrastructure:}

```
{Code pattern, schema shape, config, or architecture diagram}
```

---

## Alternatives Considered

| Option | Pros | Cons | Reason Rejected |
|---|---|---|---|
| {Option A (chosen)} | {pros} | {cons} | **Selected** |
| {Option B} | {pros} | {cons} | {why not} |
| {Option C} | {pros} | {cons} | {why not} |

---

## Consequences

### Positive
- {Benefit 1}
- {Benefit 2}

### Negative
- {Tradeoff 1}
- {Tradeoff 2}

### Risks
- **{Risk}:** {description} — **Mitigation:** {how to handle}

---

## Related

- {ADR-XXX} — {relationship}
- {FEAT-XX} — {which spec this enables}
- `{src/path}` — {code affected}
