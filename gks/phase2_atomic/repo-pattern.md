---
id: "repo-pattern"
type: "protocol"
status: "active"
version: "1.0.0"
summary: "Protocol mandating the Repository Pattern for all database operations to ensure strict tenant isolation and centralized data access management using Prisma."
tags: [repository-pattern, multi-tenancy, data-access, prisma]
created_at: "2026-04-18"
created_by: "@gemini-draft"
---

# Architectural Law: Repository Pattern

- **SSOT**: ALL database operations must go through `src/lib/repositories/`.
- **Restrictions**: No direct `getPrisma()` or `db` calls from API routes or UI components.
- **Tenant Scope**: Every repository function must receive `tenantId` as the first parameter (to ensure multi-tenant isolation).
- **Atomic Operations**: Use `prisma.$transaction` for identity operations or complex multi-table writes.
