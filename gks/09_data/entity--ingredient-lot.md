---
id: entity--ingredient-lot
type: data_entity
module: kitchen
status: stable
summary: "นิยามข้อมูลล็อตของวัตถุดิบและวันหมดอายุ (Ingredient Lot & Expiry Schema)"
tags: [data, schema, kitchen, inventory, lot]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: IngredientLot

## 1. Schema (Logical)
- **id**: UUID
- **tenant_id**: UUID
- **ingredient_id**: UUID (FK to [[entity--ingredient]])
- **received_qty**: Decimal (ยอดรับเข้าเริ่มต้น)
- **remaining_qty**: Decimal (ยอดคงเหลือปัจจุบันในล็อตนี้)
- **cost_per_unit**: Decimal
- **received_at**: Timestamp
- **expires_at**: Timestamp (จุดสำคัญสำหรับ [[ALGO--fefo-stock-deduction]])

## 2. Relations
- **N : 1** with `Ingredient`
