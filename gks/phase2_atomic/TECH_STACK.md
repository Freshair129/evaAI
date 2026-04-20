---
id: "TECH_STACK"
type: "knowledge"
status: "active"
version: "1.0.0"
summary: "Comprehensive overview and single source of truth for the Zuri Platform technology stack, covering core layers, integrations, and system endpoints."
tags: [tech-stack, architecture, stack-navigator, infrastructure]
created_at: "2026-04-18"
created_by: "@gemini-draft"
---

# Zuri Platform — Technology Stack (Navigator)

This document is the SSOT for the project's technology stack layers.

---

```mermaid
flowchart TB
    subgraph Client["Client (Browser)"]
        Next[Next.js 14 App Router]
        TS[Core Stack]
    end

    subgraph Vercel["Vercel (Serverless)"]
        API[API Endpoints]
    end

    subgraph External["External Services"]
        INT[Integrations]
    end

    Next --> API --> INT
```

| Layer | Component Detail | Spec Path |
|---|---|---|
| **Core** | Next.js 14, JS (NOT TS), Prisma, Redis, Pusher, QStash | [docs/architecture/stack/core.md](file:///e:/zuri/docs/architecture/stack/core.md) |
| **Integrations** | FB, LINE OA, Meta Ads, Gemini AI, Upstash | [docs/architecture/stack/integrations.md](file:///e:/zuri/docs/architecture/stack/integrations.md) |
| **Endpoints** | API paths (Conversations, Customers, OCR, Workers) | [docs/architecture/stack/endpoints.md](file:///e:/zuri/docs/architecture/stack/endpoints.md) |

---
**Related Documents:**
- [PROJECT_MAP.md](file:///e:/zuri/docs/PROJECT_MAP.md)
- [LAWS.md](file:///e:/zuri/docs/architecture/LAWS.md)
