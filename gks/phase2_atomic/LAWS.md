---
id: "laws"
type: "knowledge"
status: "active"
version: "1.0.0"
summary: "High-level index and navigator for the non-negotiable architectural constraints and logic nodes of the Zuri Platform."
tags: [architecture, multi-tenancy, rbac, system-design, constraints]
created_at: "2026-04-18"
created_by: "@gemini-draft"
---

# Zuri Platform — Architectural Laws (Navigator)

This document is the high-level index for the non-negotiable architectural constraints of the Zuri Platform.

---

| Domain | Key Atomic Detail | Spec Path |
|---|---|---|
| **Data Integrity** | Flow diagram, DB-only reads, Webhook rules | [docs/architecture/logic/data-flow.md](file:///e:/zuri/docs/architecture/logic/data-flow.md) |
| **Multi-Tenancy** | ADR-056, x-tenant-id, isolation strategy | [docs/architecture/logic/multi-tenancy.md](file:///e:/zuri/docs/architecture/logic/multi-tenancy.md) |
| **RBAC** | Security flow, roles DEV to STAFF, can() check | [docs/architecture/logic/rbac-security.md](file:///e:/zuri/docs/architecture/logic/rbac-security.md) |
| **Repo Pattern** | SSOT for DB access, tenantId requirement | [docs/architecture/logic/repo-pattern.md](file:///e:/zuri/docs/architecture/logic/repo-pattern.md) |
| **NFRs** | Webhook < 200ms, Dashboard < 500ms | [docs/product/roadmap/backlog.md](file:///e:/zuri/docs/product/roadmap/backlog.md) |

---
**Core Reminder:** Never implement without checking these specific logic nodes first.
