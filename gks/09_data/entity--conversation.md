---
id: entity--conversation
type: data_entity
module: inbox
status: stable
summary: "นิยามข้อมูลของบทสนทนารวมศูนย์ (Unified Conversation Record)"
tags: [data, schema, inbox]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: Conversation

## 1. Schema (Logical)
- **id**: UUID (internal `dbId`)
- **platform_id**: String (Facebook thread ID or LINE user ID)
- **tenant_id**: UUID
- **customer_id**: UUID (FK to Customer)
- **channel**: Enum (`facebook`, `line`)
- **pipeline_stage_id**: UUID (FK to PipelineStage)
- **last_message**: String (Preview)
- **last_active_at**: Timestamp
- **unread_count**: Integer

## 2. Relations
- **N : 1** with `Customer` (Identity Resolution)
- **N : 1** with `PipelineStage`
- **1 : N** with `Message`
