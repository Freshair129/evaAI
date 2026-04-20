---
id: FEAT--daily-brief
type: feature
module: analytics
status: stable
version: 1.0.1
owner: "@executive-team"
summary: "ระบบวิเคราะห์แชทและสรุปยอดขายรายวันส่งตรงถึง LINE ผู้บริหาร (AI Executive Summary)"
tags: [ai, analytics, brief, line]
depends_on: ["[[FEAT--inbox]]", "[[FEAT--crm-core]]"]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Feature: AI Daily Sales Brief (DSB)

## 1. Overview
Daily Sales Brief (DSB) คือระบบ AI อัจฉริยะที่จะทำการ "อ่านแชท" และ "สรุปยอด" ทั้งหมดที่เกิดขึ้นในรอบวัน เพื่อส่งสรุปสถานะธุรกิจให้ผู้บริหารทุกเช้าทาง LINE โดยไม่ต้องรอให้พนักงานทำรายงาน

## 2. Key Metrics Summarized
- **Conversations**: จำนวนบทสนทนาใหม่ แยกตาม Source (FB/LINE)
- **Funnel Progress**: จำนวนลูกค้าที่ขยับ Stage (เช่น Lead กลายเป็น Hot Lead)
- **Revenue**: ยอดขายรวมที่ปิดได้จากแชทและ POS
- **Hot Leads**: รายชื่อลูกค้าที่มีโอกาสปิดการขายสูงพร้อมคำแนะนำ (CTA)

## 3. Automation Schedule
1. **Analysis (00:05 ICT)**: ระบบเริ่มประมวลผลบทสนทนาของเมื่อวานผ่าน Gemini API
2. **Notification (08:00 ICT)**: สรุปผลจะถูกส่งเป็น Flex Message เข้าสู่ LINE ของเจ้าของร้าน (Owner)

## 4. Technical Specs
- **AI Agent**: Gemini 2.0 Flash
- **Entity**: [[entity--daily-brief]]
- **Blueprint**: [docs/blueprints/FEAT-010_DailyBrief.yaml](file:///d:/zuri/docs/blueprints/FEAT-010_DailyBrief.yaml)
