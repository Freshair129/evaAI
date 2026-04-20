---
id: MOD--ai
type: module
module: ai
status: active
version: 1.2.0
owner: "@ai-team"
summary: "ระบบปัญญาประดิษฐ์และผู้ช่วยอัจฉริยะ (AI Assistant, NL2SQL, & Intent Analysis)"
tags: [ai, gemini, nl2sql, intent, assistant]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Module: AI Assistant (Intelligence Layer)

## 1. Responsibility
ทำหน้าที่เป็น "สมอง" ของระบบ Zuri โดยการรับคำสั่งภาษาธรรมชาติจากผู้ใช้ (Natural Language) เพื่อบันทึกข้อมูล (NL2Data) หรือสอบถามข้อมูลจากฐานข้อมูล (NL2SQL) รวมถึงการวิเคราะห์ Sentiment และ Intent ของลูกค้าแบบอัตโนมัติ

## 2. Boundaries
- **Upstream**: [[module--inbox]], [[module--core]] (Auth & Permissions)
- **Downstream**: ทุุกโมดูลที่มีการเข้าถึงข้อมูลผ่าน AI (CRM, POS, Kitchen, Finance)

## 3. Key Decisions
- [[ADR-050-ai-router-architecture]]

## 4. Feature Index
- [[FEAT--ai-assistant-core]] (Web & LINE Integration)
- [[ALGO--nl2sql]] (Safe Query Generation)
- [[PROTO--ai-safety]] (RBAC & Guardrails)

## 5. Security & Permissions (C | R | U | D)
| Resource | Role | CRUDP | Note |
|---|---|---|---|
| AI Chat | All Roles | CR | ตามสิทธิ์เข้าถึงข้อมูลของ Role นั้นๆ |
| AI Config | ADM/OWNER | CRUD | ตั้งค่า Prompt และ Add-on status |
| AI Logs | ADM | R | ตรวจสอบประสิทธิภาพและความปลอดภัยของคำถาม |
