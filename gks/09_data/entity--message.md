---
id: entity--message
type: data_entity
module: inbox
status: stable
summary: "นิยามข้อมูลของข้อความแต่ละ Bubble (Message Bubble Structure)"
tags: [data, schema, messaging]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: Message

## 1. Schema (Logical)
- **id**: UUID
- **convo_id**: UUID (FK to Conversation)
- **sender_type**: Enum (`STAFF`, `CLIENT`, `SYSTEM`, `AI`)
- **message_type**: Enum (`TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `FILE`, `TEMPLATE`)
- **content**: Text (or JSON for complex templates)
- **platform_msg_id**: String (Unique ID from FB/LINE)
- **sent_at**: Timestamp
- **delivered_at**: Timestamp (Optional)
- **read_at**: Timestamp (Optional)

## 2. Relations
- **N : 1** with `Conversation`
- **N : 1** with `User` (If sender is Staff)
