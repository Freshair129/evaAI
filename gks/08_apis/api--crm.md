---
id: "api--crm"
type: "api"
module: "MOD-CRM"
status: "stable"
version: "2.0.0"
summary: "API specs สำหรับ CRM — Customers, Lifecycle Stage, Tags, Activity, Profile, Merge, Insights, Patterns"
granularity: "general"

epistemic:
  confidence: 0.95
  source_type: "direct_experience"
  contradictions: []

context_anchor:
  duration: "permanent"
  valid_until: null
  superseded_by: null

crosslinks:
  implements: ["[[FEAT-002_CustomerProfile]]", "[[FEAT-005_CRM]]", "[[FEAT-019_CRMAIInsights]]"]
  used_by: ["[[api--inbox]]", "[[api--pos]]", "[[api--marketing]]", "[[api--ai]]"]
  references: ["[[entity--customer]]", "[[ALGO--identity-resolution]]", "[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]"]
  contradicts: []

touch_points:
  - "src/app/api/customers/route.js"
  - "src/app/api/customers/[id]/route.js"
  - "src/app/api/customers/[id]/stage/route.js"
  - "src/app/api/customers/[id]/tags/route.js"
  - "src/app/api/customers/[id]/timeline/route.js"
  - "src/app/api/customers/[id]/activity/route.js"
  - "src/app/api/customers/[id]/profile/route.js"
  - "src/app/api/customers/[id]/merge/route.js"
  - "src/app/api/customers/[id]/enrich/route.js"
  - "src/app/api/crm/insights/[customerId]/route.js"
  - "src/app/api/crm/patterns/route.js"
  - "src/lib/repositories/customerProfileRepo.js"
  - "src/lib/repositories/customerInsightRepo.js"

owner: "@architect"
tags: [crm, customers, lifecycle, insights, ai]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — CRM

## 1. Customer List & Create

### `GET /api/customers`
> Paginated customer list พร้อม filter — STF เห็นเฉพาะ assigned customers

| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| `page` | int | default 1 |
| `limit` | int | default 20, max 100 |
| `search` | string | ค้นหาจาก name/phone/email |
| `stage` | enum | NEW\|CONTACTED\|INTERESTED\|ENROLLED\|PAID\|LOST |
| `tags` | uuid[] | filter ด้วย tag IDs |
| `channel` | enum | facebook\|line |
| `from`/`to` | date | date range filter |
| `kpi` | `1` | return summary stats แทน list |

| | |
|---|---|
| **Auth** | `withAuth(domain:'customers', action:'R', maskPii:true)` |
| **STF Gate** | STF role ถูก force filter `assignedAgentId = currentUserId` |
| **Returns** | `{ data: { items: Customer[], total, page, limit } }` |
| **KPI Mode** | `{ data: { total, byStage: {}, newToday, activePipeline } }` |
| **Cache** | Redis — `crm:list:{tenantId}:{hash}` — 60s TTL |

---

### `POST /api/customers`
> สร้าง Customer ใหม่ + identity resolution

| | |
|---|---|
| **Auth** | `withAuth` |
| **Body** | `{ name, phone (E.164), email?, facebookName?, lineUserId?, channel?, assignedAgentId? }` |
| **Identity Resolution** | ดู [[ALGO--identity-resolution]] — ป้องกัน duplicate phone |
| **Side Effects** | AuditLog, Redis cache bust |
| **Returns** | `201 { data: Customer }` |
| **Errors** | `409` phone ซ้ำ (suggest merge) |

---

## 2. Customer Detail & Update

### `GET /api/customers/{id}`
| | |
|---|---|
| **Auth** | `withAuth(domain:'customers', action:'R', maskPii:true)` |
| **Returns** | `{ data: Customer }` (phone/email masked สำหรับ STF) |
| **Errors** | `404` ไม่พบ |

---

### `PATCH /api/customers/{id}`
> อัพเดท customer — **ใช้ `/stage` endpoint สำหรับ lifecycle transition**

| | |
|---|---|
| **Auth** | `withAuth(domain:'customers', action:'W')` |
| **Body** | `{ name?, phone?, email?, facebookName?, status?, assignedAgentId?, profile? }` |
| **Side Effects** | AuditLog, Pusher event `crm:customer:updated` |
| **Returns** | `{ data: Customer }` |

---

### `DELETE /api/customers/{id}`
> Soft delete (isDeleted = true)

| | |
|---|---|
| **Auth** | `withAuth` — MGR/ADM only |
| **Side Effects** | AuditLog |

---

## 3. Lifecycle Stage

### `PATCH /api/customers/{id}/stage`
> Atomic stage transition พร้อม history record

```
Valid Stages: NEW → CONTACTED → INTERESTED → ENROLLED → PAID
                                                      ↘ LOST (จาก stage ใดก็ได้)
```

| | |
|---|---|
| **Auth** | `withAuth(domain:'customers', action:'W')` |
| **Body** | `{ stage: StageEnum, note?: string }` |
| **Transaction** | Atomic: update Customer.lifecycleStage + insert CustomerStageHistory |
| **Side Effects** | AuditLog, Pusher `crm:stage:changed`, Automation trigger `EVENT_STAGE_CHANGE` |
| **Returns** | `{ data: Customer }` |
| **Errors** | `400` invalid stage value, `404` customer not found |

---

## 4. Tags

### `GET /api/customers/{id}/tags`
| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: CustomerTag[] }` |

---

### `POST /api/customers/{id}/tags`
> เพิ่ม tag + trigger automation

| | |
|---|---|
| **Auth** | `withAuth` |
| **Body** | `{ tagName: string }` |
| **Side Effects** | Automation trigger `EVENT_TAG_ADDED` |
| **Returns** | `{ data: CustomerTag }` |

---

## 5. Timeline & Activity

### `GET /api/customers/{id}/timeline`
> Full customer timeline — messages, orders, enrollments, automation actions

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: ActivityItem[] }` sorted by `createdAt DESC` |

---

### `GET /api/customers/{id}/activity`
> Customer activity log (CRM actions เท่านั้น)

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: CustomerActivity[] }` |

---

## 6. Customer 360 Profile

### `GET /api/customers/{id}/profile`
> Extended profile — interests, platform IDs, preferences

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: CustomerProfile }` |

---

## 7. Identity Merge

### `POST /api/customers/{id}/merge`
> Merge secondary customer → primary (ดู [[ALGO--identity-resolution]])

| | |
|---|---|
| **Auth** | `withAuth` — MGR/ADM only |
| **Body** | `{ secondaryId: uuid }` |
| **Logic** | Move all: conversations, orders, enrollments → primary, soft-delete secondary |
| **Transaction** | Prisma `$transaction` — atomic |
| **Side Effects** | AuditLog |
| **Returns** | `{ data: Customer }` (primary) |

---

## 8. AI Enrichment (Trigger)

### `POST /api/customers/{id}/enrich`
> Manual trigger สำหรับ AI enrichment (ปกติ auto-trigger หลัง conversation)

| | |
|---|---|
| **Auth** | `withAuth` |
| **Side Effects** | Enqueues QStash job → `POST /api/workers/crm-enrich` |
| **Returns** | `{ queued: true }` |

---

## 9. AI Insights

### `GET /api/crm/insights/{customerId}`
> ดู AI-generated insights: interests, objections, intent score, churn score

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: CustomerInsight }` (includes `intentScore`, `churnScore`) |
| **Cache** | Redis — `crm:insight:{customerId}` — 10m TTL |

---

### `GET /api/crm/patterns`
> Cross-customer pattern analysis (tenant-level)

| | |
|---|---|
| **Auth** | `withAuth` — MGR/ADM only |
| **Returns** | `{ data: TenantCRMPattern }` — topObjections, topInterests, conversionTips |
| **Source** | Updated daily 02:00 ICT via `POST /api/workers/crm-pattern` |

---

## 10. Import (Background)

### `POST /api/customers/import`
> Bulk import via CSV/Excel — background processing

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `multipart/form-data` — file |
| **Pipeline** | Validate → Enqueue QStash → Pusher progress notification |
| **Returns** | `{ jobId: string, estimatedRows: number }` |

---

## 11. Permission Summary

| Resource | OWNER | ADM | MGR | STF/SLS |
|----------|-------|-----|-----|---------|
| List customers | ✅ All | ✅ All | ✅ All | ✅ Assigned only |
| Create | ✅ | ✅ | ✅ | ✅ |
| Update | ✅ | ✅ | ✅ | ✅ Own |
| Delete | ✅ | ✅ | ✅ | ❌ |
| Merge | ✅ | ✅ | ✅ | ❌ |
| Import | ✅ | ✅ | ✅ | ❌ |
| View Insights | ✅ | ✅ | ✅ | ✅ Own |
| View Patterns | ✅ | ✅ | ✅ | ❌ |
