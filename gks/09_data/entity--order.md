---
id: entity--order
type: data_entity
module: pos
status: stable
summary: "นิยามข้อมูลคำสั่งซื้อหลัก (Master Order Schema) และรายการสินค้า"
tags: [data, schema, pos, order]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: Order

## 1. Schema (Logical)
- **id**: UUID
- **order_number**: String (unique) - `ORD-YYYYMMDD-SERIAL`
- **tenant_id**: UUID
- **customer_id**: UUID (Optional - FK to [[entity--customer]])
- **table_id**: UUID (Optional - FK to [[entity--pos-table]])
- **type**: Enum (`ONSITE`, `TAKEAWAY`, `DELIVERY`, `ONLINE`)
- **status**: Enum (`PENDING`, `COOKING`, `READY`, `COMPLETED`, `VOID`)
- **guest_count**: Integer
- **total_amount**: Decimal
- **subtotal**: Decimal

## 2. Order Item (Sub-Entity)
- **id**: UUID
- **order_id**: UUID
- **product_id**: UUID
- **quantity**: Integer
- **unit_price**: Decimal
- **note**: String (e.g., "ไม่ใส่พริก")

## 3. Relations
- **1 : N** with `OrderItem`
- **1 : 1** with `Invoice` (Created via [[FEAT--billing]])
- **N : 1** with `Customer` (Member Lookup)
