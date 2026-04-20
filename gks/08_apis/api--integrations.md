---
id: "api--integrations"
type: "api"
module: "MOD-BILLING"
status: "stable"
version: "1.0.0"
summary: "API specs สำหรับ Integrations — Accounting (FlowAccount/Express), Push Notifications, Admin Tools, Workers"
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
  implements: ["[[FEAT-021_AccountingPlatform]]", "[[FEAT-022_ExpressIntegration]]", "[[FEAT-023_PlatformStrategy]]"]
  used_by: ["[[api--billing]]", "[[api--pos]]"]
  references: ["[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]"]
  contradicts: []

touch_points:
  - "src/app/api/integrations/accounting/route.js"
  - "src/app/api/integrations/accounting/export/route.js"
  - "src/app/api/integrations/accounting/sync-logs/route.js"
  - "src/app/api/integrations/flowaccount/connect/route.js"
  - "src/app/api/integrations/flowaccount/callback/route.js"
  - "src/app/api/integrations/flowaccount/disconnect/route.js"
  - "src/app/api/tenant/integrations/route.js"
  - "src/app/api/push/subscribe/route.js"
  - "src/app/api/admin/tenants/[id]/route.js"
  - "src/app/api/workers/audit-cleanup/route.js"
  - "src/lib/accounting/AccountingService.js"
  - "src/lib/accounting/FlowAccountAdapter.js"
  - "src/lib/accounting/ExpressAdapter.js"

owner: "@architect"
tags: [integrations, accounting, flowaccount, express, push, workers]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — Integrations & System

## 1. Accounting Integration

### `GET /api/integrations/accounting`
> ดู config การเชื่อมต่อ (token ถูก mask)

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Returns** | `{ data: { provider, connected, lastSync, syncStats, credentials: masked } }` |

---

### `PUT /api/integrations/accounting`
> อัพเดท config

| | |
|---|---|
| **Auth** | ADM |
| **Body** | `{ provider: 'flowaccount'\|'express'\|'peak'\|'sage', config: object }` |

---

### `POST /api/integrations/accounting/export`
> Manual export หรือ force sync

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ dateFrom: date, dateTo: date, type: 'invoice'\|'expense' }` |
| **Returns** | `{ jobId: string }` (async) |

---

### `GET /api/integrations/accounting/sync-logs`
> ประวัติ sync พร้อม error log

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Query** | `{ page?, limit?, status?: 'success'\|'failed' }` |
| **Returns** | `{ data: IntegrationSyncLog[], total }` |

---

## 2. FlowAccount OAuth

### `POST /api/integrations/flowaccount/connect`
> เริ่ม OAuth flow — redirect to FlowAccount

| | |
|---|---|
| **Auth** | ADM |
| **Returns** | `{ authUrl: string }` (redirect URL) |

---

### `GET /api/integrations/flowaccount/callback`
> OAuth callback handler

| | |
|---|---|
| **Auth** | OAuth state validation |
| **Process** | Exchange code → tokens → encrypt → store in IntegrationConfig |
| **Redirect** | → `/integrations` page |

---

### `POST /api/integrations/flowaccount/disconnect`
> ยกเลิกการเชื่อมต่อ

| | |
|---|---|
| **Auth** | ADM |
| **Side Effects** | Delete IntegrationConfig (provider=flowaccount) |

---

## 3. Tenant Integrations Overview

### `GET /api/tenant/integrations`
> ดู integrations ทั้งหมดของ tenant

| | |
|---|---|
| **Auth** | ADM |
| **Returns** | `{ data: Integration[] }` (accounting, line, facebook, etc.) |

---

### `POST /api/tenant/integrations`
> สร้าง/อัพเดท integration config

| | |
|---|---|
| **Auth** | ADM |
| **Body** | `{ type: string, config: object }` |

---

## 4. Push Notifications

### `POST /api/push/subscribe`
> Register web push subscription

| | |
|---|---|
| **Auth** | `withAuth` |
| **Body** | `{ subscription: PushSubscription, platform: 'web'\|'expo', expoToken?: string }` |
| **Returns** | `{ data: WebPushSubscription }` |

---

## 5. Admin Tools *(System/DEV)*

### `GET /api/admin/tenants/{id}`
> ดู tenant detail (admin view)

| | |
|---|---|
| **Auth** | System admin |

---

### `GET /api/admin/usage`
> Usage analytics ทั้งระบบ

| | |
|---|---|
| **Auth** | System admin |
| **Returns** | `{ tenants: count, activeUsers, apiCalls, storage }` |

---

### `POST /api/admin/impersonate`
> Impersonate tenant (support/debug)

| | |
|---|---|
| **Auth** | System admin |
| **Body** | `{ tenantId: uuid }` |

---

## 6. Background Workers (QStash)

| Endpoint | Schedule | คำอธิบาย |
|----------|---------|---------|
| `POST /api/workers/audit-cleanup` | Weekly | ลบ audit logs เก่า > 90 วัน |
| `POST /api/workers/daily-brief-gen` | Daily 00:05 + 08:00 | สร้าง Daily Sales Brief |
| `POST /api/workers/auto-tag` | Triggered | Auto-tag customers จาก conversation |
| `POST /api/workers/refresh-marketing-memory` | Daily | อัพเดท marketing context cache |
| `POST /api/workers/accounting-sync` | Every 4h | Batch accounting sync |
| `POST /api/workers/campaign-broadcast` | Triggered | Throttled campaign sending |
| `POST /api/workers/automation-engine` | Hourly | Evaluate time-based automation rules |
| `POST /api/workers/crm-enrich` | Triggered | AI enrich customer |
| `POST /api/workers/crm-pattern` | Daily 02:00 | Cross-customer pattern analysis |

> **Auth สำหรับทุก worker:** `X-Qstash-Signature` verification — ดู [[ALGO--webhook-signature]]
