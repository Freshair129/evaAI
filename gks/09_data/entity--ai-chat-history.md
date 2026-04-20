---
id: entity--ai-chat-history
type: data_entity
module: ai
status: stable
summary: "นิยามข้อมูลประวัติการสนทนากับ AI (AI Interaction Log Schema)"
tags: [data, schema, ai, chat, logs]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: AIChatHistory

## 1. Schema (Logical)
- **id**: UUID
- **tenant_id**: UUID
- **user_id**: UUID (FK to User)
- **channel**: Enum (`WEB`, `LINE`)
- **role**: Enum (`USER`, `ASSISTANT`)
- **content**: Text (ประโยคคำถาม/คำตอบ)
- **intent**: Enum (`QUERY`, `ENTRY`, `ORDER`, `SLIP`, `CHITCHAT`)
- **sql_generated**: Text (Optional - คำสั่ง SQL ที่ AI สร้างขึ้น)
- **metadata**: JSON (Context ของหน้าเว็บที่ผู้ใช้อยู่ ณ ตอนนั้น)
- **timestamp**: Timestamp

## 2. Relations
- **N : 1** with `User`
- **N : 1** with `Tenant`
