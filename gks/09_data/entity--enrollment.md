---
id: entity--enrollment
type: data_entity
module: enrollment
status: stable
summary: "นิยามข้อมูลการลงทะเบียนเรียนและความคืบหน้า (Enrollment & Progress Schema)"
tags: [data, schema, education, enrollment]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: Enrollment

## 1. Schema (Logical)
- **id**: UUID
- **tenant_id**: UUID
- **customer_id**: UUID (FK to [[entity--customer]])
- **product_id**: UUID (FK to Product - The Course)
- **order_id**: UUID (Optional - FK to [[entity--order]])
- **status**: Enum (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- **hours_required**: Integer (จำนวนชั่วโมงทั้งหมดของคอร์ส)
- **hours_completed**: Integer (จำนวนชั่วโมงที่เรียนไปแล้ว)
- **started_at**: Date
- **completed_at**: Date

## 2. Relations
- **N : 1** with `Customer`
- **1 : N** with `Attendance` record
- **1 : N** with `Certificate` (In case of multi-level certification)
