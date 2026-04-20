---
id: PROTO--ai-safety
type: protocol
module: ai
status: active
summary: "มาตรฐานความปลอดภัยและการควบคุมสิทธิ์การเข้าถึงข้อมูลของ AI (AI Safety & RBAC Guardrails)"
tags: [ai, security, rbac, guardrails]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Protocol: AI Assistant Safety Guards

## 1. Role-Based Query Scope
AI ต้องตรวจสอบสิทธิ์ของผู้ใช้ ([[ADR-045-rbac-matrix]]) ก่อนประมวลผลคำถาม:
- **OWNER/MGR**: สอบถามข้อมูลได้ทุกโมดูลภายใต้ Tenant ตนเอง
- **ACCOUNTANT**: สอบถามได้เฉพาะโมดูล Finance และ Sales
- **STAFF**: สอบถามได้เฉพาะงานของตนเอง (Row-level context)

## 2. Data Blacklisting
ฟิลด์ต่อไปนี้จะถูก "ปิดกั้น" ไม่ให้ AI อ่านหรือเข้าถึงได้โดยเด็ดขาด:
- `password_hash`, `access_token`, `api_key`
- ข้อมูลเงินเดือนรายบุคคล (Salary) — ยกเว้นได้รับสิทธิ์ HR/OWNER
- ข้อมูลส่วนตัวระบุตัวตน (PII) ที่ไม่จำเป็นต่อการวิเคราะห์

## 3. SQL Guardrails (The Sandwich Method)
1. **Pre-processing**: แทรก Schema เฉพาะฟิลด์ที่ได้รับอนุญาตให้ Gemini
2. **Post-processing**: ตรวจสอบคำสั่ง SQL ที่ถูกสร้างขึ้นว่ามี `tenant_id` ที่ถูกต้องกำกับอยู่หรือไม่ และไม่มีคำสั่งประสงค์ร้าย
3. **Execution Sandbox**: รัน SQL ใน Transaction ที่จำกัดสิทธิ์ (Read-only) และมี Timeout สั้น (ป้องกัน DoS)
