---
id: entity--transaction
type: data_entity
module: billing
status: stable
summary: "นิยามข้อมูลการชำระเงิน (Transaction) และการเชื่อมต่อกับสลิป"
tags: [data, schema, payment]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: Transaction

## 1. Schema (Logical)
- **id**: UUID
- **payment_number**: String (unique) - `PAY-YYYYMMDD-SERIAL`
- **invoice_id**: UUID (FK to Invoice)
- **tenant_id**: UUID
- **method**: Enum (`CASH`, `PROMPTPAY`, `CREDIT_CARD`, `TRANSFER`)
- **amount**: Decimal
- **slip_ref_number**: String (unique) - ใช้ป้องกันการใช้สลิปซ้ำ ([[ALGO--slip-ocr]])
- **verified_by**: String (Agent ID or Human ID)
- **status**: Enum (`PENDING`, `SUCCESS`, `FAILED`)

## 2. Relations
- **N : 1** with `Invoice`
- **1 : 1** with `PaymentSlip` (File/Record)
- **1 : 1** with `AuditLog`
