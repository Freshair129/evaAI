# FEAT-KITCHEN — Kitchen Operations Module

**Status:** APPROVED
**Version:** 1.1.0
**Date:** 2026-04-07
**Approved:** 2026-04-07
**Author:** Boss (Product Owner)
**Reviewer:** Claude (Architect)
**Depends On:** FEAT01 (tenantId), FEAT07 (Enrollment → kitchen demand)
**Related:** FEAT06 (POS ingredient usage)

---

## 1. Overview

Kitchen Operations module สำหรับโรงเรียนสอนทำอาหารและธุรกิจ F&B ครอบคลุมการจัดการสูตรอาหาร (Recipe), คลังวัตถุดิบ (Ingredient) แบบ FEFO และการตัดสต็อกอัตโนมัติ

**Core value:** "รู้ก่อนเปิดคลาส — วัตถุดิบพร้อม ต้นทุนโปร่งใส"

---

## 2. Terminology

| คำศัพท์ | ความหมาย |
|---|---|
| **Recipe** | สูตรอาหารที่ผูกกับ Course/Product |
| **Ingredient** | วัตถุดิบหลัก พร้อมหน่วยนับและราคา |
| **Lot** | ล็อตวัตถุดิบที่รับเข้า (มีวันหมดอายุ) |
| **FEFO** | First-Expiry-First-Out — ตัดล็อตที่ใกล้หมดอายุก่อน |
| **Wastage** | ของเสียที่เกิดขึ้นระหว่างการผลิต/คลาส |

---

## 3. Stock Management (FEFO Logic)

ระบบใช้ logic **FEFO (First-Expiry-First-Out)** ในการตัดสต็อก:
1. เมื่อมีการหักสต็อก ระบบจะดึง `IngredientLot` ของวัตถุดิบนั้น
2. เรียงลำดับตาม `expiresAt` จากน้อยไปมาก
3. ตัดยอด `remainingQty` ทีละล็อตจนครบจำนวน
4. อัปเดต `currentStock` (denormalized field) ในตาราง `Ingredient`

---

## 4. API Endpoints

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/kitchen/ingredients` | รายการวัตถุดิบและสต็อกปัจจุบัน |
| `POST` | `/api/kitchen/lots` | รับวัตถุดิบเข้าคลัง (Goods Receipt) |
| `GET` | `/api/kitchen/expiring` | ดูวัตถุดิบที่กำลังจะหมดอายุ |

---

## 5. Implementation Progress ✅

- [x] K-P0-1: Ingredient CRUD Repository (`ingredientRepo.js`)
- [x] K-P0-2: IngredientLot model & Goods Receipt logic
- [x] K-P0-4: FEFO deduction logic (`deductFEFO` in repo)
- [x] K-P0-6: `currentStock` denormalized sync helper
- [x] Multi-tenant isolation for all kitchen data

---

*Status: UPDATED 2026-04-07*
