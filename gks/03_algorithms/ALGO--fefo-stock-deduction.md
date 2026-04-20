---
id: ALGO--fefo-stock-deduction
type: algorithm
module: kitchen
status: stable
summary: "อัลกอริทึมการตัดสต็อกวัตถุดิบตามวันหมดอายุ (First-Expiry-First-Out Logic)"
tags: [kitchen, inventory, fefo, logic]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Algorithm: FEFO Stock Deduction

## 1. Goal
เพื่อลดปริมาณการเสียเปล่าของวัตถุดิบ (Wastage) โดยการเลือกตัดวัตถุดิบออกจากล็อต (Lot) ที่จะหมดอายุก่อนเสมอ

## 2. Process Flow
1. **Request**: เมื่อมีคำสั่งหักสต็อก (เช่น จาก Course Session หรือ POS Order)
2. **Identification**: ค้นหาล็อตทั้งหมดของวัตถุดิบนั้น (`IngredientLot`) ภายใต้ `tenant_id` เดียวกัน
3. **Sorting**: เรียงลำดับล็อตตาม `expires_at` (Ascending) — ล็อตที่หมดอายุก่อนจะอยู่ลำดับแรก
4. **Deduction Loop**:
    - หักสต็อกออกจากล็อตแรกจนกว่ายอดคงเหลือ (`remaining_qty`) จะหมด หรือหักจนครบยอดที่ต้องการ
    - หากล็อตแรกไม่พอ ให้เขยิบไปหักล็อตถัดไปจนครบยอด
5. **Denormalization**: อัปเดตฟิลด์ `current_stock` ในตารางหลัก (`Ingredient`) เพื่อใช้ในการแสดงผลหน้า Dashboard ทันที

## 3. Safety Check
- หากระบบพบล็อตที่หมดอายุแล้ว (`expires_at < now`) -> ห้ามนำมาตัดสต็อกและส่งแจ้งเตือนให้พนักงานตรวจสอบ (Flag as Expired)
- ตรวจสอบความถูกต้องของสิทธิ์พนักงานก่อนดำเนินการ
