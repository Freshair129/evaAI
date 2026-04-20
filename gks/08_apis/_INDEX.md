---
id: "index--apis"
type: "index"
module: "ALL"
status: "stable"
summary: "Map of Contents สำหรับ API Specifications ทั้งหมดใน Zuri"
owner: "@architect"
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API Specifications — Index

> API Specs ในโฟลเดอร์นี้อ้างอิงจาก Blueprints ใน `docs/blueprints/` และ Source Code ใน `src/app/api/`

## โครงสร้าง

| ไฟล์ | Module | ครอบคลุม | Blueprint อ้างอิง |
|------|--------|---------|-----------------|
| [[api--core]] | MOD-CORE | Tenant, Auth, Settings, Team, Ownership | FEAT-001, FEAT-025 |
| [[api--crm]] | MOD-CRM | Customers, Stage, Tags, Insights, Patterns | FEAT-002, FEAT-005, FEAT-019 |
| [[api--inbox]] | MOD-INBOX | Conversations, Messages, Webhooks, Agent Mode | FEAT-004, FEAT-017, FEAT-018 |
| [[api--pos]] | MOD-POS | Tables, Zones, Orders, Mobile, Delivery | FEAT-006, FEAT-009, FEAT-012 |
| [[api--billing]] | MOD-BILLING | Invoices, Payments, Slip OCR | FEAT-003 |
| [[api--kitchen]] | MOD-KITCHEN | Ingredients, Lots, Recipes, Procurement | FEAT-008 |
| [[api--enrollment]] | MOD-ENROLLMENT | Enrollments, Attendance, Certificates | FEAT-007 |
| [[api--marketing]] | MOD-MARKETING | Ads, Campaigns, Dashboard | FEAT-015, FEAT-016 |
| [[api--ai]] | MOD-AI | AI Assistant, Compose, Ask, Agent Pipeline | FEAT-011, FEAT-017, FEAT-018, FEAT-019, FEAT-020 |
| [[api--analytics]] | MOD-ANALYTICS | Daily Brief, Sales KPI, Audit | FEAT-010 |
| [[api--integrations]] | MOD-BILLING/CORE | Accounting, Webhooks, Push, Workers | FEAT-021, FEAT-022, FEAT-023 |

## สถานะรวม

- **Total Endpoints:** ~130+
- **Documented:** 11 modules
- **Auth Pattern:** `withAuth(domain, action)` — ดู [[SAFETY--tenant-isolation]]
- **Permission Matrix:** [[api--core]] section 4

## ข้อกำหนดร่วม (Cross-Cutting Concerns)

1. **Multi-Tenant:** ทุก endpoint ต้องผ่าน `withAuth` เพื่อ inject `tenantId`
2. **PII Masking:** endpoint ที่มี `maskPii: true` — phone/email ถูก mask สำหรับ STF role
3. **Audit Log:** การเขียนข้อมูลสำคัญต้อง log ผ่าน `auditRepo`
4. **Rate Limiting:** `/api/webhooks/*` และ `/api/ai/*` มี rate limit
5. **Idempotency:** Worker endpoints ต้องใช้ idempotency key
