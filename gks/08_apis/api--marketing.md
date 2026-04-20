---
id: "api--marketing"
type: "api"
module: "MOD-MARKETING"
status: "stable"
version: "1.0.0"
summary: "API specs สำหรับ Marketing — Meta Ads Sync, Dashboard, Campaign Broadcast, Ad Optimization"
granularity: "general"

epistemic:
  confidence: 0.85
  source_type: "direct_experience"
  contradictions: []

context_anchor:
  duration: "permanent"
  valid_until: null
  superseded_by: null

crosslinks:
  implements: ["[[FEAT-015_MarketingAds]]", "[[FEAT-016_CampaignEngine]]", "[[FEAT-020_AskMarketing]]"]
  used_by: ["[[api--ai]]", "[[api--crm]]"]
  references: ["[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]"]
  contradicts: []

touch_points:
  - "src/app/api/marketing/dashboard/route.js"
  - "src/app/api/marketing/campaigns/route.js"
  - "src/app/api/marketing/ads-audit/route.js"
  - "src/app/api/marketing/ad-timeline/route.js"
  - "src/app/api/marketing/memory/route.js"
  - "src/app/api/ads/optimize/route.js"
  - "src/app/api/workers/sync-hourly/route.js"
  - "src/lib/repositories/marketingRepo.js"
  - "src/lib/ai/marketingOptimizer.js"

owner: "@architect"
tags: [marketing, ads, meta, campaigns, broadcast, roas]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — Marketing

## 1. Ads Analytics Dashboard

### `GET /api/marketing/dashboard`
> Executive KPI summary — ROAS, spend, revenue, impressions, CTR

| Parameter | คำอธิบาย |
|-----------|---------|
| `dateFrom` | date (required) |
| `dateTo` | date (required) |
| `adAccountId` | uuid (optional) |

| | |
|---|---|
| **Auth** | `withAuth` — MGR/ADM only |
| **Cache** | Redis — `mkt:dashboard:{tenantId}:{dateHash}` — 300s TTL |
| **Returns** | `{ data: { spend, revenue, roas, impressions, clicks, ctr, conversions, topCampaigns[] } }` |

---

### `GET /api/marketing/campaigns`
> Campaign list พร้อม performance breakdown

| Parameter | คำอธิบาย |
|-----------|---------|
| `adAccountId` | filter by FB Ad Account |
| `status` | ACTIVE\|PAUSED\|ARCHIVED |
| `from`/`to` | date range |

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Returns** | `{ data: Campaign[] }` (with daily metrics, ROAS, attribution revenue) |

---

### `GET /api/marketing/ads-audit`
> AI audit report — underperforming ads, creative fatigue detection

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Returns** | `{ data: AuditResult[] }` (ad IDs with issues, recommendations) |

---

### `GET /api/marketing/ad-timeline`
> 24×7 hourly heatmap

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Query** | `{ dateFrom, dateTo, campaignId? }` |
| **Returns** | `{ data: HeatmapMatrix }` (hour × day grid of spend/impressions) |

---

## 2. Campaign Broadcast

### `POST /api/marketing/campaigns` (broadcast type)
> สร้าง broadcast campaign

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ name, type:'BROADCAST', channel:'LINE'\|'FB', segmentId, messageTemplate, scheduledAt?, cooldownDays?, throttlePerMin? }` |
| **Returns** | `201 { data: CampaignBroadcast }` status=DRAFT |

---

### `POST /api/marketing/campaigns/{id}/send`
> เริ่มส่ง broadcast

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Side Effects** | status→SENDING, enqueue QStash batch jobs, create CampaignLog entries |
| **Throttle** | 30 msg/min default (configurable) |
| **Returns** | `{ queued: number }` |

---

### `POST /api/marketing/campaigns/{id}/cancel`
> หยุดส่ง

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Side Effects** | Drain QStash queue, status→CANCELLED |

---

### `GET /api/marketing/campaigns/{id}/logs`
> Per-recipient delivery log

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Query** | `{ status?: 'queued'\|'sent'\|'failed'\|'replied', page? }` |
| **Returns** | `{ data: CampaignLog[], total }` |

---

## 3. Business Memory (AskMarketing Config)

### `GET /api/marketing/memory`
> ดู tenant marketing config สำหรับ AI context

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Returns** | `{ data: TenantMarketingConfig }` |

---

### `PUT /api/marketing/memory`
> อัพเดท business context

| | |
|---|---|
| **Auth** | ADM |
| **Body** | `{ targetROAS?, avgCOGS?, dailyBudgetCap?, creativeFatigueFreq?, seasonalPeaks?, notes? }` |

---

## 4. Ad Optimization

### `POST /api/ads/optimize`
> AI-generated optimization suggestions

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ campaignIds?: uuid[], context?: string }` |
| **Returns** | `{ data: OptimizationSuggestion[] }` |

---

## 5. Sync Workers

### `POST /api/workers/sync-hourly` *(QStash)*
> Sync Meta Graph API data เข้า DB

| | |
|---|---|
| **Auth** | QStash signature |
| **Process** | Per-tenant: fetch AdAccount insights → upsert metrics → cache bust |
| **Schedule** | Every hour |

---

## 6. Permission Summary

| Resource | OWNER | ADM | MGR | STF/SLS |
|----------|-------|-----|-----|---------|
| View dashboard | ✅ | ✅ | ✅ | ❌ |
| View campaigns | ✅ | ✅ | ✅ | ❌ |
| Create/send broadcast | ✅ | ✅ | ✅ | ❌ |
| Configure memory | ✅ | ✅ | ❌ | ❌ |
| View ad audit | ✅ | ✅ | ✅ | ❌ |
