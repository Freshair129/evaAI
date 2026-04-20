# Zuri — Implementation Plan: Modules & Features ที่มีเอกสาร

> จัดทำโดย: EVA (MSP-AGT-EVA-COWORK) | วันที่: 2026-04-15  
> สำหรับ: บอส (MSP-USR-BOSS) | Implementer: RWANG (MSP-AGT-RWANG-IDE)

---

## 1. สรุปภาพรวม (Executive Summary)

Zuri มีเอกสาร **14 Feature Briefs**, **10 Technical Blueprints**, และ **9 Module Docs** ครอบคลุม Source Code ที่มี 126+ API endpoints, 61 Prisma models, และ 55+ React components

จากการวิเคราะห์ Gap พบว่าระบบส่วนใหญ่ถูก implement แล้ว แต่มี **3 ฟีเจอร์ที่เป็น Stub** (มีเอกสารแต่ยังไม่มีโค้ดจริง) และอีก **หลายจุดที่โค้ดยังไม่ครบตามที่ Blueprint กำหนด**

---

## 2. Gap Analysis — เอกสาร vs Implementation

### 2.1 สถานะแต่ละ Feature

| # | Feature | Brief | Blueprint | Code | สถานะ |
|---|---------|:-----:|:---------:|:----:|--------|
| 1 | **Multi-Tenant** (FEAT-001) | ✅ | ✅ | ✅ | **DONE** — Prisma middleware, RLS, tenantContext ครบ |
| 2 | **Customer Profile 360** (FEAT-002) | ✅ | ✅ | ✅ | **DONE** — repos, API, components ครบ |
| 3 | **Billing & Invoice OCR** (FEAT-003) | ✅ | ✅ | ⚠️ | **PARTIAL** — มี slipVerifier แต่ยังไม่มี receipt dispatch ครบ |
| 4 | **Unified Inbox** (FEAT-004) | ✅ | ✅ | ✅ | **DONE** — conversations, messages, pipeline, webhooks ครบ |
| 5 | **CRM & Automation** (FEAT-005) | ✅ | ✅ | ✅ | **DONE** — identity resolution, merge, tags, segments ครบ |
| 6 | **POS Onsite** (FEAT-006) | ✅ | ✅ | ✅ | **DONE** — tables, zones, orders, floor plan ครบ |
| 7 | **Enrollment & Certification** (FEAT-007) | ✅ | ✅ | ✅ | **DONE** — enrollment, attendance, certificates ครบ |
| 8 | **Kitchen & Inventory FEFO** (FEAT-008) | ✅ | ✅ | ✅ | **DONE** — ingredients, lots, recipes, procurement ครบ |
| 9 | **POS Mobile** | ✅ | ❌ | ⚠️ | **STUB** — มี Brief + components บางส่วน แต่ไม่มี Blueprint/API เฉพาะ |
| 10 | **POS Delivery** | ✅ | ❌ | ❌ | **STUB** — มี Brief เท่านั้น ยังไม่มีโค้ด |
| 11 | **Daily Sales Brief** (FEAT-010) | ✅ | ✅ | ✅ | **DONE** — worker, API, analysis ครบ |
| 12 | **AI Assistant NL2SQL** (FEAT-011) | ✅ | ✅ | ✅ | **DONE** — agent mode, chat, intent routing ครบ |
| 13 | **Accounting Integration** | ✅ | ❌ | ⚠️ | **PARTIAL** — มี AccountingService + FlowAccount adapter แต่ไม่มี Blueprint |
| 14 | **Workflow Automation** | ✅ | ❌ | ⚠️ | **PARTIAL** — มี Brief + TCA pattern ใน CRM แต่ยังไม่แยกเป็นระบบอิสระ |

### 2.2 สิ่งที่ขาด (Gap Summary)

**ต้องสร้าง Blueprint ก่อน (P3/P4):**
- `FEAT-009_POSMobile.yaml` — POS Mobile dedicated blueprint
- `FEAT-012_POSDelivery.yaml` — POS Delivery blueprint
- `FEAT-013_AccountingIntegration.yaml` — Accounting blueprint
- `FEAT-014_WorkflowAutomation.yaml` — Workflow engine blueprint

**ต้อง Implement (P5):**
- POS Mobile: dedicated API routes, offline-first logic
- POS Delivery: driver assignment, delivery tracking, zone pricing
- Accounting: sync engine ที่ robust กว่าเดิม, multi-provider support
- Workflow Automation: visual workflow builder, trigger/action framework
- Billing: receipt dispatch via LINE/FB ให้ครบ flow

---

## 3. แผน Implementation — จัดลำดับตาม Priority

### Phase A: Quick Wins — เติมเต็มสิ่งที่มีโค้ดแล้ว (1-2 สัปดาห์)

**เป้าหมาย:** ปิด gap ในฟีเจอร์ที่โค้ดมีเกือบครบ

| Task | Module | รายละเอียด | Effort | Assignee |
|------|--------|-----------|--------|----------|
| A1 | Billing | เพิ่ม receipt dispatch (LINE Rich Message + FB) | 3 วัน | RWANG |
| A2 | POS Mobile | เชื่อม CartDrawer + PaymentFlow เข้ากับ API /api/pos/ ที่มีอยู่ | 2 วัน | RWANG |
| A3 | Accounting | เพิ่ม error handling + retry logic ใน FlowAccount sync | 2 วัน | RWANG |
| A4 | Workflow | สร้าง API endpoint `/api/automations` สำหรับ CRUD automation rules | 2 วัน | RWANG |

**Gate A Review:** EVA ตรวจ code review + test coverage

---

### Phase B: Blueprint-First — สร้างเอกสารก่อน Implement (2-3 สัปดาห์)

**เป้าหมาย:** ฟีเจอร์ที่เป็น Stub ต้องผ่าน P3/P4 ก่อนเขียนโค้ด

#### B1: POS Delivery (High Priority — revenue impact)

**Blueprint ต้องกำหนด:**
- Delivery zone management + pricing matrix
- Driver/rider assignment logic
- Order tracking states: `preparing → dispatched → delivered`
- Integration กับ LINE notify สำหรับ customer tracking
- Prisma models: `DeliveryZone`, `DeliveryOrder`, `DeliveryDriver`

**API Endpoints ที่ต้องสร้าง:**
- `POST /api/pos/delivery/orders` — สร้าง delivery order
- `PUT /api/pos/delivery/orders/[id]/status` — อัพเดทสถานะ
- `GET /api/pos/delivery/zones` — จัดการโซน
- `POST /api/pos/delivery/assign` — assign driver

**Effort:** Blueprint 2 วัน (EVA) → Implementation 5 วัน (RWANG)

#### B2: POS Mobile (Medium Priority — UX improvement)

**Blueprint ต้องกำหนด:**
- Offline-first architecture (Service Worker + IndexedDB)
- Sync protocol เมื่อกลับมา online
- Simplified UI สำหรับ mobile screen
- QR scan-to-order flow
- Push notification สำหรับ order ready

**API Endpoints ที่ต้องสร้าง:**
- `POST /api/pos/mobile/sync` — offline data sync
- `GET /api/pos/mobile/menu` — optimized menu payload
- `POST /api/pos/mobile/orders` — quick order creation

**Effort:** Blueprint 2 วัน (EVA) → Implementation 5 วัน (RWANG)

#### B3: Workflow Automation Engine (High Priority — operational efficiency)

**Blueprint ต้องกำหนด:**
- Trigger types: time-based, event-based, condition-based
- Action types: send message, update CRM, create task, notify
- Visual builder component (React Flow หรือ similar)
- Execution engine (QStash-based)
- Prisma models: `AutomationRule`, `AutomationTrigger`, `AutomationAction`, `AutomationLog`

**API Endpoints ที่ต้องสร้าง:**
- `GET/POST /api/automations` — CRUD rules
- `POST /api/automations/[id]/execute` — manual trigger
- `GET /api/automations/[id]/logs` — execution history
- `POST /api/workers/automation-engine` — QStash worker

**Effort:** Blueprint 3 วัน (EVA) → Implementation 7 วัน (RWANG)

#### B4: Accounting Integration (Medium Priority — compliance)

**Blueprint ต้องกำหนด:**
- Multi-provider adapter pattern (FlowAccount, Express, Xero)
- Document mapping: Invoice → accounting entry
- Reconciliation logic
- Sync schedule + conflict resolution
- Error recovery + manual override UI

**Effort:** Blueprint 2 วัน (EVA) → Implementation 5 วัน (RWANG)

**Gate B Review:** EVA ตรวจ Blueprint compliance + architecture review

---

### Phase C: Hardening & Testing (1-2 สัปดาห์)

| Task | รายละเอียด | Effort |
|------|-----------|--------|
| C1 | เขียน integration tests สำหรับ critical flows (POS → Billing → Accounting) | 3 วัน |
| C2 | E2E tests ด้วย Playwright สำหรับ POS Mobile + Delivery | 2 วัน |
| C3 | Load testing multi-tenant isolation (ตรวจว่า tenantId ไม่ leak) | 1 วัน |
| C4 | อัพเดท Knowledge Base (gks/) ให้ตรงกับ implementation ใหม่ | 2 วัน |

---

## 4. Dependency Graph

```
Multi-Tenant (FEAT-001) ← Foundation ทุกอย่าง
    ├── Customer Profile (FEAT-002) ← CRM (FEAT-005)
    │       ├── Inbox (FEAT-004) ← Daily Brief (FEAT-010)
    │       │       └── AI Assistant (FEAT-011)
    │       └── Workflow Automation (FEAT-014) ★ NEW
    ├── Billing (FEAT-003) ← Accounting Integration (FEAT-013) ★ NEW
    │       └── POS Onsite (FEAT-006)
    │               ├── POS Mobile (FEAT-009) ★ NEW
    │               └── POS Delivery (FEAT-012) ★ NEW
    ├── Enrollment (FEAT-007)
    └── Kitchen (FEAT-008)
```

---

## 5. Timeline สรุป

| สัปดาห์ | Phase | งานหลัก | Output |
|---------|-------|--------|--------|
| W1 | A | Quick wins: Billing receipt, POS Mobile เชื่อม, Accounting fix | Code PRs |
| W2 | B1-B2 | EVA เขียน Blueprint POS Delivery + Mobile | YAML blueprints |
| W3 | B1-B2 | RWANG implement POS Delivery + Mobile | API + Components |
| W4 | B3-B4 | EVA เขียน Blueprint Workflow + Accounting | YAML blueprints |
| W5 | B3-B4 | RWANG implement Workflow + Accounting | API + Components |
| W6 | C | Testing + KB update + Gate review | Test reports |

**Total: ~6 สัปดาห์** สำหรับปิด gap ทั้งหมด

---

## 6. Registry Tasks ที่ต้องสร้าง

เมื่อบอสอนุมัติแผน ต้องลง registry-tasks.yaml:

```yaml
- id: MSP-TSK-20260415-001
  title: "Phase A: Quick Wins"
  assignee: MSP-AGT-RWANG-IDE
  reviewer: MSP-AGT-EVA-COWORK
  status: pending

- id: MSP-TSK-20260415-002
  title: "Blueprint: FEAT-009 POS Mobile"
  assignee: MSP-AGT-EVA-COWORK
  status: pending

- id: MSP-TSK-20260415-003
  title: "Blueprint: FEAT-012 POS Delivery"
  assignee: MSP-AGT-EVA-COWORK
  status: pending

- id: MSP-TSK-20260415-004
  title: "Blueprint: FEAT-014 Workflow Automation"
  assignee: MSP-AGT-EVA-COWORK
  status: pending

- id: MSP-TSK-20260415-005
  title: "Blueprint: FEAT-013 Accounting Integration"
  assignee: MSP-AGT-EVA-COWORK
  status: pending
```

---

*แผนนี้เป็นไปตาม Five Phases, Four Gates governance ตามที่กำหนดใน EVA Architecture*
