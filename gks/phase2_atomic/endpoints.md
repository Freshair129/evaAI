---
id: "endpoints"
type: "protocol"
status: "active"
version: "1.0.0"
summary: "Authoritative registry of Zuri API endpoints including cross-cutting rules for authentication, multi-tenancy, and module-specific handlers for AI, CRM, and Inbox services."
tags: [api-registry, system-endpoints, zuri-api, protocol-spec]
created_at: "2026-04-18"
created_by: "@gemini-draft"
---

# Zuri — API Endpoint Registry

> **Last Updated:** 2026-04-15  
> **Total Endpoints:** 128 route files / ~140 HTTP methods  
> **Source of Truth:** `src/app/api/` — auto-inventoried from filesystem  
> **Previous version had 11 entries (outdated) — this is the authoritative list**

---

## Cross-Cutting Rules

| Rule | Detail |
|------|--------|
| **Auth** | All endpoints use `withAuth(domain, action)` except public ones marked `[PUBLIC]` |
| **Multi-tenant** | `tenantId` is injected by `withAuth` — never accepted from client |
| **PII Masking** | Endpoints marked `[PII]` mask phone/email for STF role |
| **Workers** | Endpoints marked `[WORKER]` require `X-Qstash-Signature` header |
| **SSE** | Endpoints marked `[SSE]` return `text/event-stream` |

---

## 1. Admin `[SYSTEM]`

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/admin/backfill-ingredient-tenants` | Data migration — backfill tenantId on ingredients |
| `POST` | `/api/admin/backfill-owners` | Data migration — assign OWNER role retroactively |
| `POST` | `/api/admin/impersonate` | Impersonate tenant session (support/debug) |
| `GET` | `/api/admin/tenants/{id}` | Get tenant detail |
| `GET` | `/api/admin/usage` | System-wide usage metrics |

---

## 2. Authentication

| Method | Path | Purpose |
|--------|------|---------|
| `GET, POST` | `/api/auth/[...nextauth]` | NextAuth.js handler — login, session, signout `[PUBLIC]` |

---

## 3. AI

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/ai/agent-mode/toggle` | Toggle conversation Agent ↔ Human mode |
| `POST` | `/api/ai/ask` | Ask AI with customer context `[SSE]` |
| `POST` | `/api/ai/ask-marketing` | Conversational ads intelligence `[SSE]` |
| `POST` | `/api/ai/assistant` | NL2SQL assistant `[SSE]` |
| `POST` | `/api/ai/compose-reply` | Transform staff draft → polished message |
| `POST` | `/api/ai/promo-advisor` | AI promotion recommendation for customer |
| `POST` | `/api/ai/sales-closer` | AI-assisted sales closing draft |
| `POST` | `/api/ai/sales-closer/approve` | Approve and send sales closer message |
| `GET` | `/api/ai/sentiment-dashboard` | Tenant sentiment analysis overview |

---

## 4. Analytics

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/analytics/sales-kpi` | Custom KPI query for dashboard |
| `GET` | `/api/audit` | System audit log (ADM/OWNER) |
| `GET` | `/api/audit/export` | Export audit log as CSV/Excel |

---

## 5. Conversations (Inbox)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/conversations` | List conversations — Redis cached, SLA <500ms `[PII]` |
| `POST` | `/api/conversations` | Create conversation manually |
| `GET` | `/api/conversations/{id}` | Get conversation + last 50 messages |
| `PUT` | `/api/conversations/{id}` | Update status, assignee, pipeline stage |
| `POST` | `/api/conversations/{id}/reply` | Send reply to customer (LINE/FB) |

---

## 6. Customers (CRM)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/customers` | List customers — paginated, filterable `[PII]` |
| `POST` | `/api/customers` | Create customer — E.164 dedup |
| `GET` | `/api/customers/{id}` | Customer detail `[PII]` |
| `PATCH` | `/api/customers/{id}` | Update customer fields |
| `DELETE` | `/api/customers/{id}` | Soft delete (MGR/ADM) |
| `GET` | `/api/customers/{id}/activity` | CRM activity log |
| `POST` | `/api/customers/{id}/enrich` | Trigger AI enrichment (async) |
| `POST` | `/api/customers/{id}/merge` | Merge into primary customer (MGR/ADM) |
| `GET` | `/api/customers/{id}/profile` | Customer 360 extended profile |
| `PATCH` | `/api/customers/{id}/stage` | Atomic lifecycle stage transition |
| `GET` | `/api/customers/{id}/tags` | List tags |
| `POST` | `/api/customers/{id}/tags` | Add tag (triggers automation) |
| `GET` | `/api/customers/{id}/timeline` | Full activity timeline |
| `GET /api/crm/insights/{id}` | `GET` | AI-generated insights + intent/churn score |
| `GET` | `/api/crm/patterns` | Tenant-level CRM pattern analysis (MGR/ADM) |

---

## 7. Daily Brief

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/daily-brief` | Latest daily sales brief |
| `GET` | `/api/daily-brief/{date}` | Brief for specific date (YYYY-MM-DD) |

---

## 8. Employees

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/employees` | List employees |
| `POST` | `/api/employees` | Create employee |
| `GET` | `/api/employees/stats` | KPI aggregation — cached 60s |
| `GET` | `/api/employees/{id}` | Employee detail |
| `PATCH` | `/api/employees/{id}` | Update employee |
| `DELETE` | `/api/employees/{id}` | Deactivate employee (ADM) |
| `POST` | `/api/employees/{id}/password` | Change password |

---

## 9. Enrollments & Certifications

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/enrollments` | List enrollments |
| `POST` | `/api/enrollments` | Create enrollment |
| `GET` | `/api/culinary/certificates` | List certificates |
| `POST` | `/api/culinary/certificates` | Issue certificate |
| `GET` | `/api/culinary/certificates/{id}` | Certificate detail |
| `PUT` | `/api/culinary/certificates/{id}` | Update certificate |
| `DELETE` | `/api/culinary/certificates/{id}` | Delete certificate |
| `GET` | `/api/culinary/schedules` | Course schedule list |
| `GET` | `/api/culinary/recipes` | Recipe list |
| `POST` | `/api/culinary/recipes` | Create recipe |
| `GET` | `/api/culinary/recipes/{id}` | Recipe detail |
| `PUT` | `/api/culinary/recipes/{id}` | Update recipe |
| `DELETE` | `/api/culinary/recipes/{id}` | Delete recipe |

---

## 10. Integrations (Accounting)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/integrations/accounting` | Get integration config (masked) |
| `PUT` | `/api/integrations/accounting` | Update config (ADM) |
| `POST` | `/api/integrations/accounting/export` | Manual export/force sync |
| `GET` | `/api/integrations/accounting/sync-logs` | Sync history + errors |
| `GET` | `/api/integrations/flowaccount/connect` | Start FlowAccount OAuth |
| `GET` | `/api/integrations/flowaccount/callback` | OAuth callback handler `[PUBLIC]` |
| `DELETE` | `/api/integrations/flowaccount/disconnect` | Disconnect FlowAccount |
| `GET` | `/api/tenant/integrations` | All integrations for tenant |
| `POST` | `/api/tenant/integrations` | Create/update integration |

---

## 11. Inventory & Kitchen

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/kitchen/ingredients` | List ingredients |
| `POST` | `/api/kitchen/ingredients` | Create ingredient |
| `GET` | `/api/kitchen/ingredients/{id}` | Ingredient detail |
| `PUT` | `/api/kitchen/ingredients/{id}` | Update ingredient |
| `DELETE` | `/api/kitchen/ingredients/{id}` | Delete ingredient |
| `GET` | `/api/kitchen/ingredients/{id}/lots` | List lots (FEFO order) |
| `POST` | `/api/kitchen/ingredients/{id}/lots` | Receive stock (GRN) |
| `GET` | `/api/inventory/lots` | All lots with expiry filter |
| `POST` | `/api/inventory/lots` | Create lot |
| `GET` | `/api/inventory/movements` | Stock movement history |
| `POST` | `/api/inventory/movements` | Manual movement entry |
| `GET` | `/api/inventory/stock` | Warehouse stock levels |
| `POST` | `/api/inventory/stock` | Adjust stock (manual count) |

---

## 12. Marketing & Ads

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/marketing/dashboard` | Ads KPI summary — Redis cached |
| `GET` | `/api/marketing/campaigns` | Campaign performance list |
| `POST` | `/api/marketing/campaigns` | Create campaign |
| `GET` | `/api/marketing/ads` | Ad list |
| `POST` | `/api/marketing/ads` | Create ad |
| `PATCH` | `/api/marketing/ads/{adId}/toggle` | Pause/resume ad |
| `GET` | `/api/marketing/ads-audit` | AI audit — underperforming ads |
| `GET` | `/api/marketing/ad-timeline` | 24×7 hourly heatmap |
| `GET` | `/api/marketing/memory` | Business memory config |
| `PATCH` | `/api/marketing/memory` | Update business memory |
| `GET` | `/api/marketing/chat/conversations` | Marketing chat history |
| `PATCH` | `/api/ads/optimize` | AI optimization suggestions |

---

## 13. Orders & POS

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/orders` | List orders `[PII]` |
| `POST` | `/api/orders` | Create order (POS checkout) |
| `GET` | `/api/orders/{id}` | Order detail |
| `PUT` | `/api/orders/{id}` | Update order (PENDING only) |
| `POST` | `/api/orders/{id}/pay` | Confirm payment → Transaction |
| `POST` | `/api/orders/{id}/void` | Void order (MGR/ADM) |
| `GET` | `/api/pos/tables` | Floor plan + table status |
| `POST` | `/api/pos/tables` | Create/merge/unmerge tables |
| `GET` | `/api/pos/zones` | Zone list |
| `POST` | `/api/pos/zones` | Create zone |
| `GET` | `/api/pos/schedules` | Time slot schedules |
| `POST` | `/api/pos/orders` | Create order via POS panel |

---

## 14. Payments & Billing

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/payments/verify-slip` | OCR slip → auto-confirm payment |
| `GET` | `/api/invoices` | Invoice list |
| `POST` | `/api/invoices/generate-pdf` | Generate invoice PDF |

---

## 15. Products & Catalog

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/products` | Product list |
| `POST` | `/api/products` | Create product |
| `GET` | `/api/products/{id}` | Product detail |
| `PUT` | `/api/products/{id}` | Update product |
| `DELETE` | `/api/products/{id}` | Delete product |
| `GET` | `/api/products/{id}/recipes` | Recipes linked to product |
| `POST` | `/api/products/{id}/recipes` | Link recipe to product |
| `GET` | `/api/recipes` | All recipes |
| `POST` | `/api/recipes` | Create recipe |
| `GET` | `/api/catalog` | Public product catalog |

---

## 16. Procurement

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/procurement/suppliers` | Supplier list |
| `POST` | `/api/procurement/suppliers` | Create supplier |
| `GET` | `/api/procurement/suppliers/{id}` | Supplier detail |
| `PATCH` | `/api/procurement/suppliers/{id}` | Update supplier |
| `DELETE` | `/api/procurement/suppliers/{id}` | Delete supplier |
| `GET` | `/api/procurement/po` | Purchase order list |
| `POST` | `/api/procurement/po` | Create PO |
| `POST` | `/api/procurement/po/{id}/approve` | Approve PO (ADM/OWNER) |
| `POST` | `/api/procurement/po/{id}/grn` | Goods Received Note |

---

## 17. Push Notifications

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/push/subscribe` | Register push subscription |

---

## 18. Schedules

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/schedules/{id}` | Schedule detail |
| `POST` | `/api/schedules/{id}` | Update schedule |

---

## 19. Settings & Team

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/tenant/config` | Tenant branding config `[PUBLIC]` |
| `PATCH` | `/api/tenant/config` | Update config (OWNER/ADM) |
| `GET` | `/api/tenants` | List tenants `[SYSTEM]` |
| `POST` | `/api/tenants` | Create tenant `[SYSTEM]` |
| `GET` | `/api/permissions` | Permission matrix |
| `GET` | `/api/settings/ownership` | Ownership transfer status |
| `POST` | `/api/settings/ownership` | Initiate transfer (OWNER) |
| `DELETE` | `/api/settings/ownership` | Cancel transfer |
| `POST` | `/api/settings/ownership/verify` | Verify OTP → atomic swap |
| `POST` | `/api/team/invite` | Create invitation (OWNER/ADM) |
| `GET` | `/api/team/invite/{token}` | Validate token `[PUBLIC]` |
| `DELETE` | `/api/team/invite/{token}` | Revoke invitation |
| `GET` | `/api/team/invitations` | List pending invitations |
| `POST` | `/api/team/join` | Complete signup with token `[PUBLIC]` |

---

## 20. Tasks

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/tasks` | Task list |
| `POST` | `/api/tasks` | Create task |
| `GET` | `/api/tasks/{id}` | Task detail |
| `PUT` | `/api/tasks/{id}` | Update task |

---

## 21. UAT

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/uat/feedback` | Submit UAT feedback |

---

## 22. Webhooks (Inbound)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/webhooks/line` | LINE OA webhook — HMAC verified, async `[PUBLIC]` |
| `POST` | `/api/webhooks/line-bot` | LINE bot webhook |
| `POST` | `/api/webhooks/line-monitor` | LINE monitor webhook |
| `GET, POST` | `/api/webhooks/facebook` | Facebook Messenger webhook `[PUBLIC]` |

---

## 23. Background Workers `[WORKER]`

> ทุก worker ต้องผ่าน `X-Qstash-Signature` verification

| Method | Path | Schedule / Trigger |
|--------|------|--------------------|
| `POST` | `/api/workers/audit-cleanup` | Weekly — ลบ logs เก่า > 90 วัน |
| `POST` | `/api/workers/auto-tag` | Triggered — auto-tag from conversation |
| `POST` | `/api/workers/check-completion` | Nightly 00:05 — enrollment completion check |
| `POST` | `/api/workers/crm-enrich` | Triggered — AI enrich customer |
| `POST` | `/api/workers/daily-brief/process` | Daily 00:05 — aggregate daily brief data |
| `POST` | `/api/workers/daily-brief/notify` | Daily 08:00 — push notification to managers |
| `POST` | `/api/workers/extract-styles` | Triggered — extract agent style from conversation |
| `POST` | `/api/workers/health-check` | Periodic — system health ping |
| `POST` | `/api/workers/send-message` | Triggered — async message dispatch |
| `POST` | `/api/workers/sync-accounting` | Every 4h — batch accounting sync |
| `POST` | `/api/workers/sync-hourly` | Hourly — Meta Ads Graph API sync |
| `POST` | `/api/workers/sync-messages` | Triggered — sync inbox messages |

---

## 24. Dev / Debug `[DEV ONLY]`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/dev/debug-pos` | Debug POS state |
| `POST` | `/api/dev/seed` | Seed test data |
| `GET, POST` | `/api/mcp` | MCP tool handler |

---

## Deprecation Notes

| Old Path (from previous endpoints.md) | Status | Correct Path |
|---------------------------------------|--------|--------------|
| `POST /api/conversations/[id]/reply` | ⚠️ Verify | `/api/conversations/{id}/reply` |
| `POST /api/webhooks/facebook` | ✅ Exists | `/api/webhooks/facebook` |

---

*Auto-inventoried from `src/app/api/` on 2026-04-15 by MSP-AGT-EVA-COWORK*
