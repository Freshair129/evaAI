---
id: "data-flow"
type: "protocol"
status: "active"
version: "1.0.0"
summary: "This protocol defines data flow integrity where UI reads from the database and background workers or webhooks handle external API synchronization to ensure system consistency."
tags: [data-flow, architecture, integrity, backend, synchronization]
created_at: "2026-04-18"
created_by: "@gemini-draft"
---

# Architectural Law: Data Flow & Integrity

```mermaid
flowchart LR
    UI[UI/Pages] -->|reads| API[API Routes]
    API -->|calls| REPO[Repositories]
    REPO -->|queries| DB[(Database)]

    WH[Webhooks] -->|writes| DB
    WK[QStash Workers] -->|syncs| DB
    META[Meta API] -.->|NEVER from UI| UI

    style META fill:#f99,stroke:#333
```

- **UI Status**: Reads from DB only. Never call Meta Graph API or LINE Messaging API directly from components.
- **Workers**: QStash workers sync external data -> DB every 1 hour (`/api/workers/sync-hourly`).
- **Webhooks**: FB/LINE webhooks write inbound messages to DB. Respond 200 immediately (NFR1: < 200ms).
- **Realtime**: Pusher triggers realtime updates to connected clients.
