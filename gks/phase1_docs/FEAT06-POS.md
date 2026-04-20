# FEAT-POS — Zuri POS Module

**Status:** APPROVED
**Version:** 1.2.0
**Date:** 2026-04-09
**Approved:** 2026-04-09
**Author:** Boss (Product Owner)
**Reviewer:** Claude (Architect)
**Depends On:** FEAT01 (tenantId), FEAT04 (Quick Sale in chat)
**Related:** FEAT03 (Invoice from cart), FEAT08 (Kitchen demand), ADR-039

---

## 1. Overview

POS module สำหรับธุรกิจ F&B และโรงเรียนสอนทำอาหาร รองรับ 3 channel การขาย พร้อมระบบ Table/Zone management, Guest seating monitoring, Slip OCR verification และเอกสารครบถ้วนตามมาตรฐานสรรพากรไทย

**Core value:** "เปิดบิล รับเงิน ตรวจสลิป จัดการที่นั่ง — จบในจอเดียว"

---

## 2. Order Types & Devices

| Type | ช่องทาง | Device | หมายเหตุ |
|---|---|---|---|
| **Onsite** | กินที่ร้าน | Android Tablet / PC | เลือกโต๊ะ/โซนจาก floor plan |
| **Takeaway** | รับกลับบ้าน | Android Tablet / PC | ไม่ต้องเลือกโต๊ะ |
| **Online** | สั่งผ่าน QR/web | Mobile (ลูกค้า) → POS | auto-push เข้า POS queue |
| **Delivery** | ส่งถึงบ้าน | PC / Tablet | รองรับ 3 ประเภทย่อย: **Instant** (LineMan), **Postal** (พัสดุ), **Cold** (แช่เย็น) |

### Device & Viewport Strategy
- **Android Tablet / PC** — POS หลัก (cashier, kitchen display)
- **Mobile Web (Responsive)** — ระบบตรวจจับขนาดหน้าจอ (Viewport < 768px) จะ Redirect ไปยังหน้า Mobile POS โดยอัตโนมัติ เพื่อความคล่องตัวในการรับออเดอร์ที่โต๊ะ
- **PWP (Progressive Web App)** — ติดตั้งเป็นแอปบน Tablet เพื่อความเสถียร

---

## 3. Floor Plan & Seating Management (NEW v1.1)

### 3.1 Table, Room, & Zone Management
ระบบจัดการพื้นที่แบบ Multi-level เพื่อรองรับทั้งร้านอาหารและห้องเรียน:

| Element | Description |
|---|---|
| **Floor** | ชั้นของสถานที่ (เช่น ชั้น 1, ชั้น 2) |
| **Zone / Room** | โซนที่นั่งหรือห้องเรียน (เช่น Zone A, ระเบียง, ห้อง Pastry) |
| **Table** | โต๊ะหรือที่นั่งหลัก มีพิกัด (X, Y) สำหรับแสดงผลบนผัง |
| **Extra Table** | โต๊ะเสริม/โต๊ะชั่วคราว (Temporary Tables) ที่เพิ่มเข้าไปในกลุ่มโต๊ะหลัก |

### 3.2 Seating Monitoring
ติดตามสถานะการใช้พื้นที่แบบเรียลไทม์:

- **Guest Count:** บันทึกจำนวนลูกค้าจริงต่อออเดอร์ เพื่อใช้คำนวณอัตราการครองที่นั่ง
- **Extra Seats:** บันทึกจำนวนเก้าอี้เสริมหรือเก้าอี้พลาสติกที่เพิ่มเข้ามา (ไม่กระทบผังปกติ)
- **Table Merge:** ระบบรวมหลายโต๊ะเข้าด้วยกัน (Merge Tables) เพื่อรองรับกลุ่มลูกค้าใหญ่ โดยใช้ `merge_group_id` ในการจัดการออเดอร์ร่วมกัน

### 3.3 Table Statuses
- **AVAILABLE** (ว่าง) — พร้อมรับลูกค้า
- **OCCUPIED** (มีลูกค้า) — มีออเดอร์ที่ยังไม่ปิด
- **RESERVED** (จอง) — รอพบคลิก
- **BILL_REQUESTED** (เรียกบิล) — รอนับเงิน
- **CLEANING** (กำลังเก็บ) — รอทำความสะอาด

---

## 4. Payment & AI Slip Verification (NEW v1.1)

### 4.1 Payment Methods
- **Cash:** พร้อมระบบคำนวณเงินทอน
- **PromptPay (QR):** สร้าง QR Dynamic หรือสแกนจากสลิป
- **AI Slip Verifier:** ระบบตรวจสลิปโอนเงินอัตโนมัติโดยใช้ **Gemini Vision**
    - ตรวจสอบยอดเงิน (Amount)
    - ตรวจสอบชื่อผู้รับ-ผู้โอน
    - ตรวจสอบวันเวลาและรหัสอ้างอิงสลิป
    - ป้องกันสลิปปลอมหรือสลิปเก่า (Idempotent Check)

### 4.2 Document System
- **Receipt (ใบเสร็จรับเงิน):** ออกทันทีหลังชำระเงิน
- **Tax Invoice (อย่างย่อ/เต็มรูป):** มาตรฐานสรรพากร
- **e-Receipt:** ส่งเข้า LINE Customer อัตโนมัติ

---

## 5. Loyalty & Member Integration

> **SSOT:** CRM Module เป็นแหล่งข้อมูล Member หลัก POS เรียกใช้ผ่าน API เท่านั้น

- **Member Lookup:** ใช้เบอร์โทรศัพท์หรือ QR Code
- **Tier Benefits:** คำนวณส่วนลดตาม Tier (Gold, Silver) อัตโนมัติ
- **Point Earn/Redeem:** ทุกการสั่งซื้อจะบวกแต้มเข้า CRM และสามารถใช้แต้มแลกส่วนลดได้ที่หน้าแคชเชียร์

---

## 6. DB Schema (Implemented)

```sql
-- pos_tables
id, tenant_id, zone_id, name, capacity, shape,
position_x, position_y, floor, status, is_extra, parent_id

-- pos_zones
id, tenant_id, name, floor, color

-- orders (extended for seating)
id, order_id, table_id, guest_count, extra_seats,
is_merged, merge_group_id, status, ...

-- transactions (extended for slip)
id, transaction_id, slip_url, slip_data (Json), slip_status
```

---

## 7. API Endpoints

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/pos/tables` | รายชื่อโต๊ะแยกตาม Floor/Zone (`?includeExtra=true`, `?monitor=true`) |
| `POST` | `/api/pos/tables` | `create` / `merge` / `unmerge` / `create-extra` |
| `PUT` | `/api/pos/tables/:id` | Update table (name, status, capacity) |
| `GET` | `/api/pos/zones` | รายชื่อ Zone ทั้งหมด |
| `POST` | `/api/pos/zones` | สร้าง Zone ใหม่ |
| `PUT` | `/api/pos/zones/:id` | Update zone |
| `GET` | `/api/orders` | รายการ Orders (filter by status, date, table) |
| `POST` | `/api/orders` | สร้าง Order ใหม่ |
| `GET` | `/api/orders/:id` | รายละเอียด Order |
| `POST` | `/api/orders/:id/pay` | Process payment |
| `POST` | `/api/orders/:id/void` | Void order |
| `POST` | `/api/payments/verify-slip` | ส่งสลิปให้ AI ตรวจสอบ (Gemini Vision) |
| `GET` | `/api/products` | Product catalog |
| `GET` | `/api/catalog` | Product catalog (alternative endpoint) |

---

## 8. UI Pages (Updated 2026-04-09)

| Route | ชื่อหน้า | Component | สถานะ |
|---|---|---|---|
| `/pos` | POS Desktop/Tablet | `PremiumPOS` — full product grid, cart panel, category filter, search, discount, promo codes, payment modal, **Delivery subtype selection** | ✅ Built |
| `/pos/mobile` | POS Mobile | Mobile-optimized POS — 3 payment methods (CASH/QR/CARD), **Hierarchical Delivery selection** (Instant/Postal/Cold), cash denominations, member lookup, table selection | ✅ Built |
| `/pos/tables` | Table & Zone Management | Floor/Zones tabs, CRUD modals for zones + tables, shape definitions (rect/circle), APIs: `/api/pos/zones` + `/api/pos/tables` | ✅ Built |
| `/pos/monitor` | Real-time Seating Monitor | Auto-refresh 30 วินาที, zone filter, table status badges (5 statuses), guest count display | ✅ Built |

### Mobile Viewport Strategy
- Viewport < 768px → auto-redirect จาก `/pos` ไป `/pos/mobile`
- POS Mobile รองรับ touch-friendly UI: ปุ่มใหญ่, cash denomination grid, swipe gestures
- ดู ADR-057 สำหรับ mobile ordering architecture

---

## 9. Implementation Progress ✅

- [x] POS v1.0 Foundation (product grid + cart + payment)
- [x] POS Mobile page (`/pos/mobile`) — 3 payment methods, 3 order types
- [x] Table & Zone Management page (`/pos/tables`) — CRUD + shape definitions
- [x] Seating Monitor page (`/pos/monitor`) — real-time 30s refresh
- [x] Table/Zone CRUD API (`/api/pos/tables`, `/api/pos/zones`)
- [x] Floor Plan Seating Logic (Guest Count, Extra Seats)
- [x] Table Operations (Merge/Unmerge/Extra)
- [x] AI Slip Verification (Gemini Vision)
- [x] Mobile Viewport Redirect
- [x] Real-time Table Status Sync (via Pusher)
- [x] PremiumPOS component (desktop full-screen POS)
- [x] CartPanel component (quantity adjust, item removal, THB formatting)
- [x] Hierarchical Delivery Options (Fresh Food, Postal, Cold Storage)

### Pending
- [ ] PromptPay QR generation (dynamic)
- [ ] Invoice / Tax Invoice PDF generation
- [ ] V Points earn/redeem integration with CRM
- [ ] e-Receipt via LINE push
- [ ] Kitchen Display System (KDS) integration

---

*Status: UPDATED 2026-04-09 — synced with codebase*
