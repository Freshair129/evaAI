# Skill: Domain Expert — Marketing & Ads Analytics

> Trigger: ทำงานเกี่ยวกับ Ads, Campaigns, ROAS, Meta sync, Daily Brief
> Purpose: โหลด domain context สำหรับ Marketing module

## Context to Load

```
Read docs/gotchas/meta-api.md                # G-META-01 to G-META-06
Read docs/gotchas/marketing-attribution.md    # G-MKT-01 to G-MKT-05
```

## Key Rules

### Data Flow (CRITICAL)
```
Meta Graph API → QStash Worker (ทุก 1 ชม.) → campaignRepo → DB
UI → /api/marketing/dashboard → campaignRepo → DB → Redis cache
```
- **UI ห้ามเรียก Graph API โดยตรง** — อ่านจาก DB เท่านั้น
- Worker sync: `vercel.json` cron `0 * * * *`

### Meta API Safety
- `isPurchase`: ใช้ `.includes('purchase')` ไม่ใช่ exact match (G-META-01)
- Batch API: 1 request = 50 operations (G-META-04)
- `Promise.allSettled` ไม่ใช่ `Promise.all` (G-META-05)
- `maxDuration = 300` ทุก sync route (G-WH-03)
- `bulkUpsert` ต้อง update ทุก field (G-META-06)

### Attribution
- `firstTouchAdId` immutable — set ครั้งเดียวตอน create conversation
- Direct Revenue: ad_target matches purchased_product
- Cross-Sell: เข้าจาก ad A แต่ซื้อ product B
- ROAS คำนวณจาก VERIFIED slips เท่านั้น

### Aggregation (ADR-024)
- Ad-level first → bottom-up aggregate to AdSet → Campaign
- Derived metrics (CPA, ROAS) compute on-the-fly ไม่ store
- Checksum: Sum(Ads) vs Campaign total — tolerance ±1%

### Daily Sales Brief (DSB)
- QStash cron 00:05 ICT → Gemini analyze conversations
- QStash cron 08:00 ICT → LINE push notification
- Array mutation ก่อน DB op (G-DB-04)
- Fallback LINE recipients จาก env vars

## Checklist Before Commit
- [ ] No Graph API calls in UI-facing routes
- [ ] action_type uses .includes('purchase')
- [ ] Promise.allSettled for batch operations
- [ ] maxDuration = 300 on sync routes
- [ ] Revenue attribution matches product (G-MKT-01)
- [ ] Redis cache on dashboard queries (TTL 300s)
