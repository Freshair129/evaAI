---
id: entity--stock-movement
type: data_entity
module: kitchen
status: stable
owner: "@architect"
summary: "Audit trail ของทุกการเคลื่อนไหวสต็อก — รับเข้า, ตัดจ่าย, ปรับยอด, นับสต็อก"
tags: [data, schema, kitchen, inventory, audit]
depends_on:
  - "[[entity--ingredient-lot]]"
  - "[[entity--order]]"
touch_points:
  - "src/lib/repositories/inventoryRepo.js"
  - "prisma/schema.prisma"
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "@architect"
updated_by: "@architect"
---
# Entity: StockMovement

## 1. Schema (Logical)

- **id**: UUID
- **movementId**: String (readable ID, e.g. `MV-20260415-001`)
- **tenant_id**: UUID ← enforced (ref: [[SAFETY--tenant-isolation]])
- **warehouseId**: UUID (FK → Warehouse)
- **productId**: UUID — สินค้าหรือวัตถุดิบที่ถูกเคลื่อนไหว
- **productType**: Enum (`INGREDIENT` | `PRODUCT` | `SUPPLY`)
- **type**: Enum — ประเภทของการเคลื่อนไหว (ดูข้อ 2)
- **qty**: Decimal — บวก = รับเข้า, ลบ = ตัดออก
- **unitCost**: Decimal (optional — สำหรับคำนวณต้นทุน)
- **referenceId**: UUID — FK ไปยัง record ต้นทาง (Order, PO, StockCount)
- **referenceType**: Enum (`ORDER` | `PO` | `ADJUSTMENT` | `STOCK_COUNT` | `WASTE`)
- **performedById**: UUID (FK → User/Staff)
- **note**: String (optional)
- **createdAt**: Timestamp

## 2. Movement Types

| type | ความหมาย | qty sign |
|------|-----------|----------|
| `PURCHASE` | รับวัตถุดิบจาก PO | + |
| `SALE_DEDUCTION` | ตัดสต็อกจาก POS Order | - |
| `ADJUSTMENT` | ปรับยอดโดยพนักงาน | +/- |
| `STOCK_COUNT` | ปรับยอดจากนับสต็อก | +/- |
| `WASTE` | บันทึกของเสีย/หมดอายุ | - |
| `TRANSFER` | โอนระหว่าง Warehouse | +/- |

## 3. Relations

- **N : 1** with `Warehouse`
- **N : 1** with `IngredientLot` (optional — เมื่อตัดจากล็อตเฉพาะ)
- **N : 1** with `Order` (when `referenceType = ORDER`)
- **N : 1** with `PurchaseOrder` (when `referenceType = PO`)

## 4. Relationship with FEFO

`StockMovement` type `SALE_DEDUCTION` ถูกสร้างโดย `deductIngredientFEFO` ใน `orderRepo.js` ต่อ 1 ล็อตที่ถูกตัด เพื่อให้มี audit trail ว่า "ขายอะไร ตัดล็อตไหน เมื่อไหร่"

> ดู: [[ALGO--fefo-stock-deduction]], [[entity--ingredient-lot]]
