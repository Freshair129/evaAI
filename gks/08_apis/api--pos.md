---
id: "api--pos"
type: "api"
module: "MOD-POS"
status: "stable"
version: "1.2.0"
summary: "API specs สำหรับ POS — Tables, Zones, Orders, Payment, Mobile Menu, Delivery"
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
  implements: ["[[FEAT-006_POS]]", "[[FEAT-009_POSMobile]]", "[[FEAT-012_POSDelivery]]"]
  used_by: ["[[api--billing]]", "[[api--kitchen]]", "[[api--crm]]"]
  references: ["[[entity--order]]", "[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]"]
  contradicts: []

touch_points:
  - "src/app/api/pos/tables/route.js"
  - "src/app/api/pos/zones/route.js"
  - "src/app/api/pos/schedules/route.js"
  - "src/app/api/orders/route.js"
  - "src/app/api/orders/[id]/route.js"
  - "src/app/api/orders/[id]/pay/route.js"
  - "src/app/api/orders/[id]/void/route.js"
  - "src/app/api/pos/mobile/menu/route.js"
  - "src/app/api/pos/mobile/availability/route.js"
  - "src/app/api/pos/delivery/orders/route.js"
  - "src/lib/repositories/orderRepo.js"

owner: "@architect"
tags: [pos, orders, tables, delivery, mobile]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — POS (Point of Sale)

## 1. Floor Plan — Tables & Zones

### `GET /api/pos/tables`
> ดึง floor plan พร้อมสถานะโต๊ะ

| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| `zoneId` | uuid | filter by zone |
| `monitor` | `true` | return tables พร้อม active orders |
| `includeExtra` | `true` | รวม extra/merged tables |

| | |
|---|---|
| **Auth** | `withAuth(domain:'pos', action:'R')` |
| **Returns** | `{ data: POSTable[] }` (includes X,Y coordinates, status, currentOrderId) |
| **Realtime** | Pusher channel: `tenant:{id}:pos:tables` |

---

### `POST /api/pos/tables`
> สร้าง/จัดการโต๊ะ

| Action | Body | คำอธิบาย |
|--------|------|---------|
| `create` (default) | `{ name, capacity?, shape?, floor?, zoneId?, positionX?, positionY? }` | สร้างโต๊ะใหม่ |
| `merge` | `{ mainTableId, secondaryTableIds[] }` | รวมโต๊ะ (recursive group) |
| `unmerge` | `{ parentTableId }` | แยกโต๊ะ |
| `create-extra` | `{ parentTableId, capacity }` | เพิ่มโต๊ะพิเศษ |

| | |
|---|---|
| **Auth** | `withAuth(domain:'pos', action:'W')` |
| **Merge Logic** | Recursive `merge_group_id` update, ดู [[ALGO--table-merge]] |
| **Returns** | `{ data: POSTable }` |

---

### `GET /api/pos/zones`
> List zones (พื้นที่ห้อง)

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: POSZone[] }` |

---

### `POST /api/pos/zones`
> สร้าง zone

| | |
|---|---|
| **Auth** | ADM/MGR |
| **Body** | `{ name: string, floor?: string, color?: string }` |

---

## 2. Orders

### `GET /api/orders`
> รายการ orders พร้อม filter

| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| `status` | enum | PENDING\|CONFIRMED\|COMPLETED\|VOIDED |
| `orderType` | enum | ONSITE\|TAKEAWAY\|DELIVERY\|ONLINE |
| `customerId` | uuid | filter by customer |
| `from`/`to` | date | date range |
| `summary` | `1` | return daily revenue summary |

| | |
|---|---|
| **Auth** | `withAuth(domain:'orders', action:'R', maskPii:true)` |
| **Returns** | `{ data: Order[] }` หรือ `{ data: DailySummary }` |

---

### `POST /api/orders`
> สร้าง order (POS checkout)

| | |
|---|---|
| **Auth** | `withAuth` |
| **Body** | `{ customerId?, tableId?, orderType, items: [{productId, qty, notes?}], discountAmount?, notes?, vatRate?, vatIncluded?, serviceChargeRate? }` |
| **Validation** | items ต้องไม่ empty |
| **Side Effects** | ตัด ingredients (FEFO), AuditLog, Pusher `pos:order:new`, Kitchen notification |
| **Returns** | `201 { data: Order }` (includes computed totals) |

---

### `GET /api/orders/{id}`
> Order detail พร้อม items, customer, payment

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: Order }` (with items, transactions) |

---

### `PUT /api/orders/{id}`
> แก้ไข order (เฉพาะ PENDING status)

| | |
|---|---|
| **Auth** | `withAuth` — SLS/STF/MGR |
| **Body** | `{ items?, notes?, discountAmount? }` |
| **Returns** | `{ data: Order }` |

---

### `POST /api/orders/{id}/pay`
> ยืนยันการชำระเงิน — สร้าง Transaction

| | |
|---|---|
| **Auth** | `withAuth` |
| **Body** | `{ method: 'CASH'\|'QR'\|'CARD', amount: number, slipImageBase64?: string }` |
| **Side Effects** | สร้าง Transaction, ส่ง receipt (LINE/FB), Update Customer stage → PAID, Accounting sync |
| **Returns** | `{ data: Transaction }` |

---

### `POST /api/orders/{id}/void`
> Void order (ยกเลิก)

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ reason: string }` |
| **Side Effects** | คืน ingredients stock, AuditLog |
| **Returns** | `{ data: Order }` |

---

## 3. Schedule Slots

### `GET /api/pos/schedules`
> ดู time slots สำหรับ cart item (e.g. คอร์สอาหาร)

| | |
|---|---|
| **Auth** | `withAuth` |
| **Query** | `{ productId?, date? }` |
| **Returns** | `{ data: Schedule[] }` (with availability) |

---

## 4. Mobile POS

### `GET /api/pos/mobile/menu`
> Optimized menu payload สำหรับ mobile

| | |
|---|---|
| **Auth** | Public (customer self-order) หรือ Staff |
| **Query** | `{ tenantId, tableId? }` |
| **Returns** | Product catalog grouped by category (thumbnail, price, availability) |
| **Cache** | Redis — `pos:menu:{tenantId}` — 120s TTL |

---

### `GET /api/pos/mobile/availability`
> Real-time stock check สำหรับ cart items

| | |
|---|---|
| **Auth** | Public |
| **Query** | `{ productIds: uuid[] }` |
| **Returns** | `{ data: [{ productId, available: boolean, stock: number }] }` |

---

### `POST /api/pos/mobile/sync`
> Sync offline orders (Staff mode)

| | |
|---|---|
| **Auth** | Staff JWT |
| **Body** | `{ orders: OfflineOrder[] }` |
| **Returns** | `{ synced: number, failed: [{orderId, reason}] }` |

---

## 5. Delivery

### `POST /api/pos/delivery/estimate`
> คำนวณค่าส่งก่อนยืนยัน order

| | |
|---|---|
| **Auth** | Staff หรือ Public |
| **Body** | `{ addressLine: string, deliverySubtype: string }` |
| **Returns** | `{ fee, zone, estimatedMinutes, available }` |

---

### `POST /api/pos/delivery/orders`
> สร้าง delivery order (ต้องมี POS order ก่อน)

| | |
|---|---|
| **Auth** | SLS/STF |
| **Body** | `{ orderId, recipientName, recipientPhone, addressLine, deliverySubtype, scheduledAt? }` |
| **Side Effects** | Geocode → zone lookup → fee calc → auto-assign driver |
| **Returns** | `{ data: DeliveryOrder }` |

---

### `PUT /api/pos/delivery/orders/{id}/status`
> อัพเดทสถานะ delivery (state machine)

| | |
|---|---|
| **Auth** | Driver/Staff |
| **Body** | `{ status: DeliveryStatus, proofImageUrl?, failureReason? }` |
| **Validation** | Only valid transitions (ดู state machine ใน [[FEAT-012_POSDelivery]]) |
| **Side Effects** | Customer notification (LINE/FB), Pusher event |

---

## 6. Realtime Events (Pusher)

| Channel | Event | Trigger |
|---------|-------|---------|
| `tenant:{id}:pos:tables` | `table:updated` | Table status change |
| `tenant:{id}:pos:orders` | `order:new` | New order created |
| `tenant:{id}:pos:orders` | `order:paid` | Payment confirmed |
| `tenant:{id}:delivery:{orderId}` | `status_changed` | Delivery status update |
