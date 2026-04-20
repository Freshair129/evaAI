# Proof of Concept — {Topic}
> Planning document. Validates risky or unknown technical approach BEFORE committing to it.
> Use when: new external API, unfamiliar pattern, performance-critical path, or "will this even work?"
> Rule: POC answers a specific question. If the question is vague, refine it first.

**Status:** `{IN_PROGRESS | PROVEN | DISPROVEN | INCONCLUSIVE}`
**Date:** {YYYY-MM-DD}
**Author:** {Agent ID}
**Related Spec:** {FEAT-XX (if applicable)}
**Time-boxed:** {max hours/days to spend}

---

## Question

{One sentence: the specific question this POC answers.}

**Example:** "Can Gemini 2.0 Flash reliably extract line items from Thai restaurant receipts with >95% accuracy?"

---

## Success Criteria

<!-- How do we know the POC succeeded? Be specific and measurable. -->

- [ ] {Criterion 1: measurable outcome}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

**Fail condition:** {When to stop and try a different approach}

---

## Approach

{What we'll build/test. Keep it minimal — just enough to answer the question.}

1. {Step 1}
2. {Step 2}
3. {Step 3}

**What we WON'T build:** {Explicitly list what's out of scope for the POC}

---

## Findings

### Result: `{PROVEN | DISPROVEN | INCONCLUSIVE}`

{Summary of what we learned.}

### Evidence

| Test | Input | Expected | Actual | Pass? |
|---|---|---|---|---|
| {test 1} | {input} | {expected} | {actual} | {Y/N} |

### Gotchas Discovered

- {Unexpected behavior or limitation found during POC}

---

## Recommendation

{Based on findings, what should we do next?}

- **If PROVEN:** Proceed with this approach. ADR: {ADR-NNN}
- **If DISPROVEN:** Alternative approach: {description}
- **If INCONCLUSIVE:** Need more testing: {what specifically}
