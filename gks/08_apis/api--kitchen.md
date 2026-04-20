---
id: "api--kitchen"
type: "api"
module: "MOD-KITCHEN"
status: "stable"
version: "1.1.0"
summary: "API specs สำหรับ Kitchen — Ingredients, Lots (FEFO), Recipes, Inventory, Procurement (PO/GRN)"
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
  implements: ["[[FEAT-008_Kitchen]]"]
  used_by: ["[[api--pos]]"]
  references: ["[[ALGO--fefo-stock-deduction]]", "[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]", "[[ALGO--fefo-stock-deduction]]"]
  contradicts: []

touch_points:
  - "src/app/api/kitchen/ingredients/route.js"
  - "src/app/api/kitchen/ingredients/[id]/route.js"
  - "src/app/api/kitchen/ingredients/[id]/lots/route.js"
  - "src/app/api/inventory/stock/route.js"
  - "src/app/api/inventory/lots/route.js"
  - "src/app/api/inventory/movements/route.js"
  - "src/app/api/products/[id]/recipes/route.js"
  - "src/app/api/procurement/po/route.js"
  - "src/app/api/procurement/suppliers/route.js"
  - "src/lib/kitchenOps.js"
  - "src/lib/repositories/ingredientRepo.js"
  - "src/lib/repositories/recipeRepo.js"

owner: "@architect"
tags: [kitchen, ingredients, inventory, fefo, procurement, recipes]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — Kitchen & Inventory

## 1. Ingredients

### `GET /api/kitchen/ingredients`
> รายการวัตถุดิบทั้งหมด

| Parameter | คำอธิบาย |
|-----------|---------|
| `search` | ค้นหาจากชื่อ |
| `lowStock` | `true` — filter เฉพาะที่ใกล้หมด |
| `expiringSoon` | `true` — filter lot ใกล้หมดอายุ (< 7 วัน) |

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: Ingredient[] }` (with currentStock aggregate) |

---

### `POST /api/kitchen/ingredients`
> สร้างวัตถุดิบใหม่

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ name, unit, category, minStock, costPerUnit?, supplierId? }` |
| **Returns** | `201 { data: Ingredient }` |

---

### `GET /api/kitchen/ingredients/{id}`
| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: Ingredient }` (with lots, recent movements) |

---

### `PUT /api/kitchen/ingredients/{id}`
| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | Ingredient fields |

---

### `DELETE /api/kitchen/ingredients/{id}`
> Soft delete

| | |
|---|---|
| **Auth** | ADM only |

---

## 2. Ingredient Lots (FEFO)

### `GET /api/kitchen/ingredients/{id}/lots`
> รายการ lots ของวัตถุดิบ เรียงตาม expiry (FEFO order)

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: IngredientLot[] }` sorted by `expiryDate ASC` |

---

### `POST /api/kitchen/ingredients/{id}/lots`
> รับวัตถุดิบเข้า (Goods Receipt)

| | |
|---|---|
| **Auth** | `withAuth` — STF/MGR |
| **Body** | `{ qty, costPerUnit, expiryDate, batchRef?, supplierId? }` |
| **Side Effects** | สร้าง IngredientLot, StockMovement (type=RECEIPT), update warehouse stock |
| **Returns** | `201 { data: IngredientLot }` |

---

## 3. Inventory

### `GET /api/inventory/stock`
> ยอดคงเหลือวัตถุดิบแต่ละรายการ

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: WarehouseStock[] }` |

---

### `GET /api/inventory/lots`
> All lots ทั้ง tenant

| | |
|---|---|
| **Auth** | `withAuth` |
| **Query** | `{ expiringBefore?: date, ingredientId? }` |
| **Returns** | `{ data: IngredientLot[] }` |

---

### `GET /api/inventory/movements`
> Stock movement history (audit trail)

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Query** | `{ ingredientId?, type?, from?, to? }` |
| **Returns** | `{ data: StockMovement[] }` |

---

## 4. Recipes

### `GET /api/products/{id}/recipes`
> Recipes ที่ผูกกับ product

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: Recipe[] }` (with RecipeIngredient + Ingredient names) |

---

### `POST /api/products/{id}/recipes`
> เชื่อม recipe กับ product

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ recipeId: uuid }` |

---

### `GET /api/recipes`
> All recipes ของ tenant

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: Recipe[] }` |

---

### `POST /api/recipes`
> สร้าง recipe ใหม่

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ name, category, items: [{ingredientId, qty, unit}] }` |

---

## 5. Procurement

### `GET /api/procurement/suppliers`
| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: Supplier[] }` |

---

### `POST /api/procurement/suppliers`
| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ name, phone, email?, taxId?, address? }` |

---

### `GET /api/procurement/po`
> Purchase Orders list

| | |
|---|---|
| **Auth** | `withAuth` |
| **Query** | `{ status?, supplierId?, from?, to? }` |
| **Returns** | `{ data: PurchaseOrderV2[] }` |

---

### `POST /api/procurement/po`
> สร้าง Purchase Order

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ supplierId, items: [{ingredientId, qty, unit, pricePerUnit}], expectedDelivery? }` |
| **Returns** | `201 { data: PurchaseOrderV2 }` status=DRAFT |

---

### `POST /api/procurement/po/{id}/approve`
> อนุมัติ PO (DRAFT → APPROVED)

| | |
|---|---|
| **Auth** | ADM/OWNER |
| **Side Effects** | POApproval record, AuditLog |

---

### `POST /api/procurement/po/{id}/grn`
> Goods Received Note — รับสินค้าเข้า

| | |
|---|---|
| **Auth** | STF/MGR |
| **Body** | `{ items: [{poItemId, receivedQty, expiryDate, batchRef?}] }` |
| **Side Effects** | สร้าง IngredientLots (FEFO), StockMovements, GoodsReceivedNote |
| **Returns** | `{ data: GoodsReceivedNote }` |

---

## 6. FEFO Deduction (Automatic)

> ทำงานอัตโนมัติเมื่อ `POST /api/orders` — ไม่ใช่ manual endpoint

```
FEFO Algorithm (ดู [[ALGO--fefo-stock-deduction]]):
  1. ดู Recipe ของแต่ละ OrderItem
  2. Sort IngredientLots ตาม expiryDate ASC (First Expire First Out)
  3. ตัด qty จาก oldest lot ก่อน
  4. สร้าง StockMovement (type=DEDUCTION)
  5. ถ้า stock ไม่พอ → warning แต่ยังสร้าง order ได้ (negative stock allowed)
```
