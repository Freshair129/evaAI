---
id: "multi-tenancy"
type: "protocol"
status: "active"
version: "1.0.0"
summary: "Protocol for multi-tenant isolation using tenant_id columns, middleware resolution via headers, and Repository Pattern enforcement."
tags: [multi-tenancy, architecture, database, security, middleware]
created_at: "2026-04-18"
created_by: "@gemini-draft"
---

# Architectural Law: Multi-Tenancy

```mermaid
flowchart TD
    REQ[Request] --> MW[Middleware]
    MW --> |resolve tenant| TID[x-tenant-id header]
    TID --> API[API Route]
    API --> REPO[Repository]
    REPO --> |WHERE tenant_id = ?| DB[(Database)]

    subgraph Tenants
        T1[V School<br>10000000-...-0001]
        T2[School B<br>20000000-...-0002]
        T3[School C<br>30000000-...-0003]
    end
```

- **Identification**: Every core table MUST have a `tenant_id` column.
- **Resolution**: Middleware resolves tenant from domain/context and injects `x-tenant-id` header.
- **UI Branding**: Use `TenantContext` for all UI branding. Never hardcode tenant-specific UI.
- **Default (V School)**: `10000000-0000-0000-0000-000000000001`
- **Isolation**: Handled by the Repository Pattern ensuring all queries use `tenantId`.
