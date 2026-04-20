---
id: entity--ingredient
type: data_entity
module: kitchen
status: stable
summary: "นิยามข้อมูลวัตถุดิบหลัก (Ingredient Master Schema)"
tags: [data, schema, kitchen, inventory]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: Ingredient

## 1. Schema (Logical)
- **id**: UUID
- **tenant_id**: UUID
- **name**: String (e.g., "แป้งเค้ก", "เนยเค็ม")
- **unit**: String (e.g., "g", "kg", "pcs")
- **current_stock**: Decimal (Denormalized sum of all valid Lots)
- **min_stock_level**: Decimal (จุด Re-order point - สำหรับแจ้งเตือนสต็อกต่ำ)
- **category**: String

## 2. Relations
- **1 : N** with `IngredientLot`
- **N : M** with `Recipe` (via RecipeItem)
