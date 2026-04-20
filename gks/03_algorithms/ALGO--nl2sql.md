---
id: ALGO--nl2sql
type: algorithm
module: ai
status: stable
summary: "อัลกอริทึมการแปลงภาษาธรรมชาติเป็นคำสั่ง SQL ที่ปลอดภัย (Secure Natural Language to SQL)"
tags: [ai, sql, security, sandbox]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Algorithm: Secure NL2SQL Pipeline

## 1. Goal
แปลงคำถามภาษาธรรมชาติ (ไทย/อังกฤษ) ให้เป็นคำสั่ง SELECT SQL ที่ถูกต้องแม่นยำและมีความปลอดภัยสูงสุด (No SQL Injection / No Cross-Tenant leakage)

## 2. Process Flow
1. **Context Injection**: ส่ง Schema ตารางที่จำเป็น (Whitelist Tables) ให้ Gemini พร้อมกับคำขอ
2. **Constraint Enforcement**: กำหนดคำสั่งให้ Gemini สร้างเฉพาะ `SELECT` เท่านั้น ห้ามสร้าง `DROP`, `DELETE`, `UPDATE`
3. **Mandatory Tenant Filtering**: ระบบจะทำการแทรกเงื่อนไข `WHERE tenant_id = $1` เข้าไปใน SQL เสมอหลังจากการ Generate
4. **Result Sanitization**: กรองผลลัพธ์ออกจากฐานข้อมูลเพื่อลบฟิลด์ลับ (Passwords, Keys) ก่อนส่งให้ Gemini สรุปเป็นคำตอบภาษาธรรมชาติ

## 3. SQL Validation (The Guard)
- **Regex Check**: ตรวจสอบคำต้องห้ามใน String (เช่น `;`, `--`, `/*`)
- **Execution Plan**: ทดสอบรัน SQL ในโหมด Read-only Transaction เสมอ
