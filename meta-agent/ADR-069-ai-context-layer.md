---
id: "ADR-069"
type: "architecture_decision"
status: "active"
version: "1.0.0"
summary: "Pivots to Gemini Context Caching for Zuri's multi-tenant AI knowledge layer to manage tenant-specific data isolation, reduce query latency, and optimize operational costs."
tags: [ai-context, multi-tenancy, gemini-caching, architecture-decision]
created_at: "2026-04-18"
created_by: " @gemini-draft"
epistemic:
  confidence: 1.0
  source_type: "documented_source"
context_anchor:
  duration: "universal"
---

# Created At: 2026-04-09 13:00:00 +07:00 (v1.0.0)
# Previous version: 2026-04-09 12:45:00 +07:00 (legacy ADR-069.md)
# Last Updated: 2026-04-09 13:00:00 +07:00 (v1.0.0)

# ADR-069: AI Context Layer — Multi-Tenant Knowledge Synchronization

**Status:** PROPOSED (Pivot to Gemini Context Caching)
**Date:** 2026-04-09
**Author:** Claude (Infrastructure Agent)
**Approver:** Boss

---

## Context

Zuri requires a deep understanding of tenant-specific knowledge (recipe books, standard operating procedures, historical customer data, and employee manuals) to provide highly accurate AI assistance.

Previous discussions explored **NotebookLM Enterprise**, but technical review indicates:
1. NotebookLM Enterprise is currently in Pre-GA with restricted access.
2. It lacks a stable, public API for automated multi-tenant ingestion at various scales.
3. Pricing model is potentially tied to per-user seats rather than pure token consumption.

To ensure immediate feasibility and robust multi-tenant isolation, we pivot to **Gemini Context Caching (via Vertex AI / Google Generative AI API)**.

## Decision

We will implement a unified **AI Context Layer** that manages per-tenant context caches. This layer will handle the lifecycle of syncing database assets and documents into a long-term Gemini cache to reduce latency and costs for repetitive queries.

### 1. Technical Architecture: Gemini Context Caching
- **SSOT**: The primary database (PostgreSQL/Prisma) and local document storage.
- **Cache Mechanism**: Use Gemini 1.5 Pro/Flash Context Caching.
- **Isolation**: Each `Tenant` receives its own unique `cache_id`.
- **TTL**: Caches default to 1-hour TTL, auto-refreshed upon active use or scheduled sync.

### 2. Implementation: Prisma Models
Add the following models to `schema.prisma`:

```prisma
model AIContextCache {
  id          String   @id @default(uuid())
  tenantId    String   @unique @map("tenant_id")
  cacheId     String   @unique @map("cache_id") // Gemini Cache Resource Name
  tokenCount  Int      @map("token_count")
  expiresAt   DateTime @map("expires_at")
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenant      Tenant   @relation(fields: [tenantId], references: [id])
}

model AIContextDocument {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  fileName    String   @map("file_name")
  fileType    String   @map("file_type")
  checksum    String   // Detect changes
  lastSyncedAt DateTime? @map("last_synced_at")
}
```

### 3. Directory Structure
```text
src/lib/ai/context/
├── cacheManager.js      # Gemini Cache API interaction
├── syncEngine.js        # Logic to aggregate tenant data into context blocks
└── contextLayer.test.js # Unit tests for injection logic
```

### 4. Cost Estimates (Vertex AI)
- **Input Tokens**: $1.25 / 1M tokens (Gemini 1.5 Flash).
- **Caching Cost**: $0.01 / 1M tokens per hour (Storage).
- **Projected**: For a small culinary school (1M token context, 8 hours active/day), estimated cost is ~$3-5 / month.

## Consequences

### Positive
- **Drastic Latency Reduction**: No need to re-send large context (recipes/manuals) with every message.
- **Cost Efficiency**: Context caching is cheaper than repeated long-context window inputs.
- **Immediate Availability**: Gemini Context Caching is GA and controllable via existing API keys.

### Negative
- **Cache Management Complexity**: Must implement logic to invalidate/refresh caches when recipes or documents change.
- **Minimum Threshold**: Caching only provides benefit for contexts > 32k tokens.

## Verification Plan

### Unit Testing
- Test `syncEngine` generates correct markdown blocks from Prisma records.
- Mock `cacheManager` to verify TTL calculation and cache reuse logic.

### Integration Testing
- Verify tenant A cannot access tenant B's context cache.
