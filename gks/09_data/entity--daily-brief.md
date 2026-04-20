---
id: entity--daily-brief
type: data_entity
module: analytics
status: stable
summary: "นิยามข้อมูลสรุปผลธุรกิจรายวัน (Daily Executive Summary Schema)"
tags: [data, schema, analytics, daily-brief]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: DailyBrief

## 1. Schema (Logical)
- **id**: UUID
- **tenant_id**: UUID
- **brief_date**: Date (วันที่ประมวลผล)
- **metrics**: JSON (ยอดขายรายวัน, จำนวนแชท, อัตรา Conversion)
- **ai_summary**: Text (สรุปผลการดำเนินงานภาษาไทยจาก AI)
- **hot_leads**: JSON (รายชื่อลูกค้าที่ต้องติดตามด่วน)
- **cta_recommendations**: JSON (คำแนะนำสิ่งที่ควรทำวันนี้)
- **notified_at**: Timestamp (เวลาที่ส่ง LINE สำเร็จ)

## 2. Relations
- **N : 1** with `Tenant`
