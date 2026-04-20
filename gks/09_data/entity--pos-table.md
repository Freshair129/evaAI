---
id: entity--pos-table
type: data_entity
module: pos
status: stable
summary: "นิยามข้อมูลของโต๊ะอาหารและที่นั่ง (Table & Seating Schema)"
tags: [data, schema, pos, seating]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: POSTable

## 1. Schema (Logical)
- **id**: UUID
- **tenant_id**: UUID
- **zone_id**: UUID (FK to Zone)
- **name**: String (e.g., "Table 12", "Room A")
- **capacity**: Integer
- **shape**: Enum (`RECTANGLE`, `CIRCLE`)
- **position_x**: Float (Coordinate for Floor Plan)
- **position_y**: Float (Coordinate for Floor Plan)
- **status**: Enum (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `BILL_REQUESTED`, `CLEANING`)
- **merge_group_id**: UUID (Optional - For [[ALGO--table-merge]])
- **is_extra**: Boolean (For temporary tables)

## 2. Relations
- **N : 1** with `Zone`
- **1 : 1** with current `Order` (If status is not `AVAILABLE`)
