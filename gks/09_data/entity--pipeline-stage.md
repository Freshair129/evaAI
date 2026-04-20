---
id: entity--pipeline-stage
type: data_entity
module: inbox
status: stable
summary: "นิยามข้อมูลของขั้นตอนการขาย (Pipeline Stages) ที่ปรับแต่งตามร้านได้"
tags: [data, schema, pipeline, configuration]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: PipelineStage

## 1. Schema (Logical)
- **id**: UUID
- **tenant_id**: UUID
- **name**: String (e.g., "สนใจคอร์ส", "จองแล้ว")
- **color**: String (Hex code)
- **icon**: String (Icon identifier)
- **position**: Integer (ลำดับการแสดงผล)
- **is_default**: Boolean
- **auto_sync_customer_status**: Enum (Optional - สุ่มสถานะ CRM อัตโนมัติ)

## 2. Relations
- **N : 1** with `Tenant`
- **1 : N** with `Conversation`
