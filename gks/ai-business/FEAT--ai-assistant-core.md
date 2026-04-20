---
id: FEAT--ai-assistant-core
type: feature
module: ai
status: active
version: 1.2.0
owner: "@ai-team"
summary: "ระบบผู้ช่วยอัจฉริยะผ่านแชท (AI Chat Assistant Core)"
tags: [ai, assistant, web, line, intent]
depends_on: ["[[FEAT--inbox]]"]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Feature: AI Assistant Core

## 1. Overview
AI Assistant Core ทำหน้าที่เป็นอินเทอร์เฟซหลักระหว่างผู้ใช้กับระบบ Intelligence ของ Zuri โดยรองรับทั้งการสอบถามข้อมูล (Query) และการบันทึกข้อมูล (Data Entry) ผ่านภาษาธรรมชาติ

## 2. Channels
- **Web Chat FAB**: ปุ่มลอยด้านขวาของหน้า Dashboard สำหรับถามตอบข้อมูลเรียลไทม์
- **LINE Assistant**: บอท 1:1 และระบบ Monitor ในกลุ่ม LINE เพื่อรับออเดอร์หรือจดรายการรายจ่าย

## 3. Intent Classification (The Router)
ระบบจะทำการคัดกรองเจตนาของประโยคก่อนประมวลผล:
- **QUERY**: ถามยอดขาย, ถามสต็อก (ใช้ [[ALGO--nl2sql]])
- **ENTRY**: จดรายจ่าย, จดสต็อก (ใช้ [[ALGO--nl2data]])
- **ORDER**: รับออเดอร์ในกลุ่มแชท (ระวางเป็น Draft POS)
- **SLIP**: ตรวจสลิปโอนเงิน (ใช้ Gemini Vision)

## 4. Interaction Guard
- **Confirmation Card**: ทุกการบันทึกข้อมูล (Entry/Order) ต้องมีการแสดงพรีวิวให้ผู้ใช้กด "ยืนยัน" (Confirm) ก่อนลงฐานข้อมูลจริงเสมอ

## 5. Technical Specs
- **Model**: [[entity--ai-chat-history]]
- **Security**: [[PROTO--ai-safety]]
- **Blueprint**: [docs/blueprints/FEAT-011_AIAssistant.yaml](file:///d:/zuri/docs/blueprints/FEAT-011_AIAssistant.yaml)
