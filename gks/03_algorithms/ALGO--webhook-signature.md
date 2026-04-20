---
id: ALGO--webhook-signature
type: algorithm
module: inbox
status: stable
summary: "อัลกอริทึมการตรวจสอบความถูกต้องของ Webhook Payload (Messaging Security)"
tags: [security, webhook, hmac, facebook, line]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Algorithm: Webhook Signature Verification

## 1. Goal
ป้องกันการโจมตีแบบ Spoofing โดยการตรวจสอบว่าข้อความที่ส่งมายัง Endpoint `/api/webhooks` มาจาก Platform ตัวจริง (Facebook/LINE) เท่านั้น

## 2. Platform Rules
### Facebook Messenger
- **Validation**: ใช้ `X-Hub-Signature-256` header
- **Logic**: คำนวณ SHA256 HMAC โดยใช้ `App Secret` เป็น Key และ `Raw Request Body` เป็น Data
- **Verification**: ค่าที่คำนวณได้ต้องตรงกับ Header

### LINE OA
- **Validation**: ใช้ `X-Line-Signature` header
- **Logic**: คำนวณ Base64 HMAC-SHA256 โดยใช้ `Channel Secret` เป็น Key
- **Verification**: ค่าที่คำนวณได้ต้องตรงกับ Header

## 3. Error Handling
- หาก Signature ไม่ตรง -> Return **401 Unauthorized** หรือ **403 Forbidden** ทันที
- **Safety Rule**: ห้ามประมวลผลข้อความใดๆ จนกว่าการ Verify จะเสร็จสมบูรณ์
