# Concerns & Gotchas — {Project Name}
> Cross-cutting document. Updated after EVERY feature implementation.
> Agent: READ THIS before touching anything. These will bite you.
> Rule: If you discover a new gotcha during implementation, add it here IMMEDIATELY.

---

## Known Issues

| ID | Area | Description | Workaround | Severity | Tracking |
|---|---|---|---|---|---|
| {ISS-001} | {module} | {what's broken} | {how to work around} | `{P0|P1|P2}` | [{ZUR-X}](link) |

---

## Tech Debt

| Area | Problem | Impact | Owner | Created |
|---|---|---|---|---|
| {module/file} | {what's wrong} | `{high|med|low}` | {who should fix} | {date} |

---

## Gotchas

<!-- Non-obvious behaviors that WILL cause bugs if not known. 
     Format: What happens → Why → How to prevent -->

- **{Area}**: {What goes wrong} → {Root cause} → {Prevention}
- **{Area}**: {What goes wrong} → {Root cause} → {Prevention}

---

## Race Conditions

| Scenario | What goes wrong | Protection | Code location |
|---|---|---|---|
| {concurrent action} | {consequence} | `{mutex|transaction|unique index|idempotency key}` | `{file:line}` |

---

## Performance Hotspots

| Endpoint / Job | Issue | Current mitigation | Acceptable? |
|---|---|---|---|
| {path} | {what's slow and why} | {what's in place} | `{Yes|No — needs fix}` |

---

## Do Not Touch

<!-- Files/areas that break in non-obvious ways. Warn before modifying. -->

| File / Area | Reason | Contact before changing |
|---|---|---|
| {file/module} | {what breaks if modified} | {who to ask} |

---

## Pending Deprecations

| Thing | Deprecated since | Remove by | Replacement |
|---|---|---|---|
| {old API/pattern} | {date} | {target date} | {new approach} |

---

## Cross-Module Dependencies (Fragile)

<!-- Connections between modules that are easy to break without realizing. -->

| Module A | Module B | Dependency | Risk |
|---|---|---|---|
| {CRM} | {Inbox} | {customer-updated Pusher event} | {If event shape changes, Inbox breaks} |
