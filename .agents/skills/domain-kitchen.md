# Skill: Domain Expert — Kitchen & Culinary

> Trigger: ทำงานเกี่ยวกับ Recipe, Ingredient, Stock, Procurement, Schedule
> Purpose: โหลด domain context สำหรับ Kitchen/Culinary industry module

## Context to Load

```
Read docs/gotchas/database-identity.md    # G-DB-07 (stock deduction)
```

## Key Rules

### Stock Deduction (ADR-038)
```
Ingredient: qtyPerPerson × confirmedStudents  (คูณจำนวนคน)
Equipment:  qtyRequired per session            (คงที่ไม่คูณ)
```
- FEFO: ตัดจาก lot ที่หมดอายุก่อน (ORDER BY expiresAt ASC)
- ต้องใช้ `prisma.$transaction` — atomic deduction

### Lot Management
```
IngredientLot status: ACTIVE → DEPLETED → EXPIRED
FEFO = First Expire, First Out
```

### Recipe vs Product
```
Recipe = standalone (มี ingredients + equipment)
Product = course catalog (category: 'COURSE')
CourseMenu = junction: Product → Recipe (ไม่ใช่ 1:1)
```
- Recipe decoupled from Product (ADR-038)

### Procurement (ADR-049)
```
Class confirmed → auto PO (DRAFT)
  → Chef approve → APPROVED
    → Purchasing accept → ORDERING
      → Goods arrive → GRN + auto IngredientLot
        → Issues → Return / CreditNote
```

### ID Formats
```
RCP-YYYY-NNN   (Recipe)
LOT-YYYYMMDD-NNN (IngredientLot)
PO-YYYYMMDD-NNN  (PurchaseOrder)
SCH-YYYYMMDD-NNN (CourseSchedule)
```

## Checklist Before Commit
- [ ] Stock deduction in $transaction
- [ ] Ingredient qty × students, Equipment qty fixed
- [ ] FEFO ordering (expiresAt ASC)
- [ ] Lot status transitions correct
- [ ] PO lifecycle follows ADR-049 flow
