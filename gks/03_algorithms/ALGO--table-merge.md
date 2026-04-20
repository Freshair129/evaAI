---
id: ALGO--table-merge
type: algorithm
module: pos
status: stable
summary: "อัลกอริทึมการบริหารจัดการการรวมโต๊ะและออเดอร์ (Recursive Table Merging Logic)"
tags: [pos, logic, tables, merge]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Algorithm: Recursive Table Merging

## 1. Goal
เพื่อช่วยให้ระบบสามารถจัดการออเดอร์ชุดเดียวที่ครอบคลุมหลายโต๊ะ (กรณีลูกค้ามาเป็นกลุ่มใหญ่) ได้อย่างแม่นยำ และสถานะต้องอัปเดตไปพร้อมกันทั้งกลุ่ม

## 2. Logic Flow
1. **Creation**: เมื่อพนักงานเลือกโต๊ะหลัก (Parent) และโต๊ะรอง (Child)
2. **Assigning ID**: ระบบจะสร้าง `merge_group_id` (UUID) ชุดเดียวกันให้กับโต๊ะในกลุ่มนั้น
3. **Primary Link**: ออเดอร์ (Master Order) จะถูกสร้างและผูกเข้ากับ `merge_group_id` ไม่ใช่แค่โต๊ะเดียว
4. **Status Sync**: ทุกครั้งที่สถานะออเดอร์เปลี่ยน -> ระบบจะ Loop อัปเดตสถานะของโต๊ะที่มี `merge_group_id` เดียวกันทั้งหมดให้เป็นสถานะทำเลศเดียวกัน (e.g. `OCCUPIED` หรือ `BILL_REQUESTED`)

## 3. Unmerge Rules
- การแยกโต๊ะจะทำได้ก็ต่อเมื่อออเดอร์ทั้งหมดในกลุ่มนั้นเป็นสถานะ `PAID` หรือถูก `VOID` เรียบร้อยแล้วเท่านั้น
- เมื่อแยกโต๊ะ (Unmerge) -> `merge_group_id` จะถูกลบออก และโต๊ะจะกลับสู่สถานะอิสระ
