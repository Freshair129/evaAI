---
id: entity--customer
type: data_entity
module: crm
status: stable
summary: "ข้อมูลหลักของลูกค้า (Customer Core Data) และความสัมพันธ์"
tags: [data, schema, crm]
created_at: 2026-04-13
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Entity: Customer

## 1. Schema Definition (Logical)
- **id**: UUID
- **tenant_id**: UUID (Targeted for [[SAFETY--tenant-isolation]])
- **first_name**: String
- **last_name**: String
- **phone**: String (Key for [[ALGO--identity-resolution]])
- **email**: String
- **lifecycle_stage**: Enum (`NEW`, `CONTACTED`, `INTERESTED`, `ENROLLED`, `PAID`)
- **v_points**: Integer

## 2. Relations
- **1 : 1** with `CustomerProfile` (Extended Info)
- **1 : N** with `Order`
- **1 : N** with `Conversation`
- **1 : N** with `AuditLog`

