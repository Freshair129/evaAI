---
id: entity--recipe
type: data_entity
module: kitchen
status: stable
owner: "@architect"
summary: "นิยามข้อมูล Recipe — การ map ระหว่าง Product (สินค้าขาย) กับ Ingredient (วัตถุดิบบริโภค)"
tags: [data, schema, kitchen, recipe, ingredients]
depends_on:
  - "[[entity--ingredient]]"
touch_points:
  - "src/lib/repositories/recipeRepo.js"
  - "prisma/schema.prisma"
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "@architect"
updated_by: "@architect"
---
# Entity: Recipe

## 1. Schema (Logical)

- **id**: UUID
- **recipeId**: String (readable ID, e.g. `RCP-0001`)
- **tenant_id**: UUID
- **name**: String (e.g., "ข้าวผัดกะเพรา")
- **description**: String (optional)
- **yieldAmount**: Decimal — จำนวนที่ทำได้จากสูตรนี้ (เช่น 1 จาน)
- **yieldUnit**: String (เช่น "serving", "portion")
- **category**: String (optional, e.g. "Main Course")
- **instructions**: JSON Array — ขั้นตอนการทำ

## 2. RecipeIngredient (Junction Sub-Entity)

- **id**: UUID
- **recipeId**: UUID (FK → Recipe)
- **ingredientId**: UUID (FK → [[entity--ingredient]])
- **qty**: Decimal — ปริมาณวัตถุดิบที่ใช้
- **unit**: String (เช่น "g", "ml", "tbsp")
- **note**: String (optional, เช่น "สับละเอียด")

## 3. Relations

- **1 : N** with `RecipeIngredient`
- **N : M** with `Product` (through `ProductRecipe` junction)
- `RecipeIngredient` → **N : 1** with `Ingredient`

## 4. How it connects to FEFO

เมื่อ `orderRepo.deductOrderInventory` ทำงาน:
1. หา Product ของ OrderItem
2. ค้น `ProductRecipe` → ได้ Recipe
3. ค้น `RecipeIngredient` → ได้รายการ Ingredient + qty ที่ต้องใช้
4. ส่งต่อ `ingredientId` + `totalNeeded` ไปยัง `deductIngredientFEFO`

> ดู: [[ALGO--fefo-stock-deduction]]
