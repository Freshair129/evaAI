# Created At: 2026-04-13 00:00:00 +07:00 (v1.0.0)
# Previous version: 2026-04-13 00:00:00 +07:00 (v1.0.0)
# Last Updated: 2026-04-13 03:15:00 +07:00 (v1.1.0)

# ZDEV-IMP-2665: FEAT08 — Kitchen Ops Full Implementation

**Status**: DONE
**Task**: [ZDEV-TSK-20260413-002](../tasks/ZDEV-TSK-20260413-002.md)
**Spec**: [FEAT08-KITCHEN.md](../../docs/product/specs/FEAT08-KITCHEN.md)
**Linear**: [ZUR-28](https://linear.app/zuri10/issue/ZUR-28)

---

## Overview
Implement the full Kitchen Ops flow, including multi-tenant schema fix for ingredients, product-recipe linking, recipe builder, and POS-triggered FEFO stock deduction.

## Implementation Waves (Status: COMPLETED)

### Wave 0: Schema Fix & Isolation (DONE)
- [x] Add `tenantId` to `Ingredient`, `IngredientLot`, `RecipeIngredient`, `ProductRecipe`.
- [x] Add `isActive` to `Ingredient`.
- [x] Create `POST /api/admin/backfill-ingredient-tenants`.
- [ ] Boss to run `npx prisma db push`. (BLOCKER for live DB)

### Wave 1: Product Management (DONE)
- [x] Extend `productRepo.js` with `softDeleteProduct`, `linkRecipe`, `unlinkRecipe`.
- [x] API: `GET/PUT/DELETE /api/products/[id]` and `/api/products/[id]/recipes`.
- [x] UI: `/pos/products` back-office page with recipe linking.

### Wave 2: Recipe Builder (DONE)
- [x] API: Standardize `culinary/recipes` and `[id]` with full CRUD.
- [x] UI: `RecipeEditor` component + `/kitchen/recipes` integration.

### Wave 3: Ingredient Management (DONE)
- [x] API: `/api/kitchen/ingredients` and `[id]/lots` (Goods Receipt).
- [x] UI: `/kitchen/ingredients` (Master Data + Goods Receipt).

### Wave 4: POS Stock Deduction (DONE)
- [x] Lib: `src/lib/kitchenOps.js` with `deductOrderIngredients` (FEFO).
- [x] Integration: Call deduction in `POST /api/orders`.

### Wave 5: Dashboard Cleanup (DONE)
- [x] Fix API paths in `/kitchen` and `/kitchen/stock`.
- [x] Fix isolation in `inventory/lots` and `inventory/stock`.

---

## Files Created/Modified

| File | Status | Note |
|---|---|---|
| `prisma/schema.prisma` | MODIFIED | Multi-tenant schema fix |
| `src/app/api/admin/backfill-ingredient-tenants/route.js` | CREATED | Backfill script |
| `src/lib/repositories/productRepo.js` | MODIFIED | Product CRUD + Recipe linking |
| `src/app/api/products/[id]/route.js` | CREATED | Product detail API |
| `src/app/api/products/[id]/recipes/route.js` | CREATED | Product-Recipe link API |
| `src/components/pos/RecipeLinker.jsx` | CREATED | UI Component |
| `src/app/(dashboard)/pos/products/page.jsx` | CREATED | Back-office UI |
| `src/app/api/culinary/recipes/[id]/route.js` | MODIFIED | Standardized actions (F) |
| `src/components/kitchen/RecipeEditor.jsx` | CREATED | Advanced Recipe Form |
| `src/app/(dashboard)/kitchen/recipes/page.jsx` | MODIFIED | Full Recipe Builder |
| `src/app/api/kitchen/ingredients/route.js` | CREATED | Master List API |
| `src/app/api/kitchen/ingredients/[id]/route.js` | CREATED | Detail API |
| `src/app/api/kitchen/ingredients/[id]/lots/route.js` | CREATED | Goods Receipt API |
| `src/app/(dashboard)/kitchen/ingredients/page.jsx` | CREATED | Master Data UI |
| `src/lib/kitchenOps.js` | CREATED | FEFO Deduction Logic |
| `src/app/api/orders/route.js` | MODIFIED | Auto-deduction trigger |
| `src/app/(dashboard)/kitchen/page.jsx` | MODIFIED | Fixed API paths |
| `src/app/api/inventory/lots/route.js` | MODIFIED | Fixed Isolation |
| `src/app/api/inventory/stock/route.js` | MODIFIED | Fixed Isolation |
