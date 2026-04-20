---
id: entity--customer-activity
type: data_entity
module: crm
status: stable
summary: "นิยามข้อมูลของกิจกรรมลูกค้า (Timeline Events / Audit Trail)"
tags: [data, schema, crm, timeline]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: CustomerActivity (Timeline)

## 1. Schema (Logical)
- **id**: UUID
- **customer_id**: UUID (FK to Customer)
- **tenant_id**: UUID
- **actor_id**: UUID (Staff ID or System Agent ID)
- **type**: Enum (`CONVERSATION`, `ORDER`, `PAYMENT`, `ENROLLMENT`, `STAGE_CHANGE`, `AUTOMATION_TRIGGER`, `NOTE`)
- **payload**: JSON (รายละเอียดเฉพาะของแต่ละกิจกรรม)
- **timestamp**: Timestamp

## 2. Relations
- **N : 1** with `Customer`
- **N : 1** with `User` (Actor)
- **1 : 1** with source record (e.g., `Order.id` if type is `ORDER`)

## 3. Storage Strategy
- ข้อมูลกิจกรรมควรทำ **Denormalization** ลงมาที่ตารางนี้เพื่อให้การโหลด Timeline แบบ Infinite Scroll มีประสิทธิภาพสูงสุด
