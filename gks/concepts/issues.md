# Issues Tracker — {Project Name}
> Cross-cutting document. Tracks known production issues and their resolution.
> Rule: Create an issue entry IMMEDIATELY when a production problem is discovered.
> For detailed investigation, create an Incident Report (INC-*.md) in devlog/incidents/.

---

## Active Issues

| ID | Severity | Area | Description | Discovered | Status | Owner |
|---|---|---|---|---|---|---|
| {ISS-001} | `{P0|P1|P2|P3}` | {module} | {short description} | {date} | `{OPEN|INVESTIGATING|FIXING|RESOLVED}` | {agent/person} |

### Severity Definitions

| Level | Meaning | Response time |
|---|---|---|
| **P0** | System down / data loss / security breach | Immediately |
| **P1** | Core feature broken, users blocked | Same day |
| **P2** | Feature degraded but usable | This week |
| **P3** | Cosmetic / minor inconvenience | Backlog |

---

## Resolved Issues

| ID | Area | Description | Root cause | Fix | Resolved date |
|---|---|---|---|---|---|
| {ISS-001} | {module} | {what was wrong} | {why it happened} | {what fixed it + commit/PR} | {date} |

---

## Patterns

<!-- Recurring issue categories. If the same type of issue appears 3+ times, add a pattern entry. -->

| Pattern | Occurrences | Root cause | Systemic fix |
|---|---|---|---|
| {e.g., "Missing tenantId filter"} | {ISS-003, ISS-007, ISS-012} | {developer forgets WHERE clause} | {Add lint rule / repo middleware} |
