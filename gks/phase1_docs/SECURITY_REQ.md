---
id: "SECURITY_REQ"
type: "security"
status: "stub"
epistemic:
  confidence: 0.8
  source_type: "inference"
context_anchor:
  duration: "universal"
summary: "ข้อกำหนดด้านความปลอดภัยพื้นฐานของ Zuri Platform (Stub)"
---
# [SECURITY_REQ] Zuri Platform Safety & Privacy

## 1. Data Privacy (PDPA)
- ข้อมูลชื่อ, เบอร์โทรศัพท์ และประวัติการแชทของลูกค้าถือเป็นข้อมูลส่วนบุคคล
- ต้องมีการเข้ารหัสข้อมูล Sensitive ในฐานข้อมูล (หากเป็นไปได้)

## 2. Multi-Tenant Isolation
- **Strict Rule:** ข้อมูลของ Tenant A ต้องไม่สามารถถูกเข้าถึงโดย Tenant B ได้ไม่ว่ากรณีใดๆ
- ใช้ Row-Level Security (RLS) และ Middleware ในการตรวจสอบ `tenant_id`

## 3. Authentication & Authorization
- ใช้ NextAuth.js v4 เป็นระบบหลัก
- การเข้าถึง API ต้องผ่านการตรวจสอบสิทธิ์ (RBAC) ทุกครั้ง
