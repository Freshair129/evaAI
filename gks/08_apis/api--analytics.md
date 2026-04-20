---
id: "api--analytics"
type: "api"
module: "MOD-ANALYTICS"
status: "stable"
version: "1.0.1"
summary: "API specs สำหรับ Analytics — Daily Sales Brief, Sales KPI, Audit Log Export"
granularity: "general"

epistemic:
  confidence: 0.9
  source_type: "direct_experience"
  contradictions: []

context_anchor:
  duration: "permanent"
  valid_until: null
  superseded_by: null

crosslinks:
  implements: ["[[FEAT-010_DailyBrief]]"]
  used_by: ["[[api--crm]]", "[[api--marketing]]"]
  references: ["[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]"]
  contradicts: []

touch_points:
  - "src/app/api/daily-brief/route.js"
  - "src/app/api/daily-brief/[date]/route.js"
  - "src/app/api/analytics/sales-kpi/route.js"
  - "src/app/api/audit/route.js"
  - "src/app/api/audit/export/route.js"
  - "src/app/api/workers/daily-brief-gen/route.js"
  - "src/lib/repositories/dailyBriefRepo.js"
  - "src/lib/services/salesKpiService.js"

owner: "@architect"
tags: [analytics, daily-brief, kpi, audit, reporting]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — Analytics & Reporting

## 1. Daily Sales Brief (DSB)

### `GET /api/daily-brief`
> ดึง brief ล่าสุด (วันนี้หรือวันก่อนหน้า)

| | |
|---|---|
| **Auth** | `withAuth` — MGR/ADM |
| **Returns** | `{ data: DailyBrief }` (AI-generated summary, KPIs, highlights) |

---

### `GET /api/daily-brief/{date}`
> Brief ของวันที่ระบุ (YYYY-MM-DD)

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Returns** | `{ data: DailyBrief }` หรือ `404` ถ้าไม่มีข้อมูลวันนั้น |

**DailyBrief fields:**
```
{
  date, tenantId,
  totalRevenue, totalOrders, avgOrderValue,
  topProducts: [],
  newCustomers, returningCustomers,
  channelBreakdown: { onsite, delivery, takeaway },
  aiSummary: string,   ← Gemini 2.0 Flash generated
  conversationAnalysis: { sentiment, topics[] }
}
```

---

### `GET /api/workers/daily-brief-gen` *(QStash)*
> Generate daily brief (00:05 + 08:00 ICT)

| | |
|---|---|
| **Auth** | QStash signature |
| **Schedule** | QStash cron `5 0 * * *` (midnight) + `0 8 * * *` (morning) |
| **Process** | Aggregate yesterday's data → Gemini summary → upsert DailyBrief |

---

## 2. Sales KPI

### `POST /api/analytics/sales-kpi`
> Custom KPI query สำหรับ dashboard widgets

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ metrics: string[], dateFrom, dateTo, groupBy?: 'day'\|'week'\|'month' }` |
| **Metrics** | revenue, orders, avg_order, customers, conversion_rate, churn_rate |
| **Returns** | `{ data: KPIResult[] }` |

---

## 3. Audit Log

### `GET /api/audit`
> System audit log

| Parameter | คำอธิบาย |
|-----------|---------|
| `actorId` | filter by user |
| `resourceType` | Customer\|Order\|Invoice\|Employee |
| `from`/`to` | date range |
| `page`/`limit` | pagination |

| | |
|---|---|
| **Auth** | ADM/OWNER only |
| **Returns** | `{ data: AuditLog[], total }` |

---

### `POST /api/audit/export`
> Export audit log เป็น CSV/Excel

| | |
|---|---|
| **Auth** | ADM/OWNER |
| **Body** | `{ dateFrom, dateTo, format: 'csv'\|'xlsx' }` |
| **Returns** | File download URL (Supabase Storage) |
