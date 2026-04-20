---
id: "AUDIT_LOG_SPEC"
type: "protocol"
status: "stub"
epistemic:
  confidence: 0.8
  source_type: "inference"
context_anchor:
  duration: "universal"
summary: "มาตรฐานการบันทึก Log เพื่อการตรวจสอบ (Traceability Spec)"
---
# [AUDIT_LOG_SPEC] System Traceability Standards

## 1. Event Types to Log
- **Auth Events:** Login, Logout, Failed attempts.
- **Data Mutation:** Create, Update, Delete (โดยเฉพาะข้อมูลลูกค้าและยอดเงิน).
- **Tenant Events:** เปลี่ยนแปลงการตั้งค่าบริษัท.

## 2. Log Structure
- `timestamp`: เวลาที่เกิดเหตุการณ์ (ISO 8601)
- `actorId`: ID ของพนักงานที่กระทำ
- `tenantId`: ID ของบริษัท
- `action`: ชื่อเหตุการณ์
- `payload`: ข้อมูลก่อนและหลังการเปลี่ยนแปลง (JSON)
