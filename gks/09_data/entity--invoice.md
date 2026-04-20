---
id: entity--invoice
type: data_entity
module: billing
status: stable
summary: "นิยามข้อมูลของใบแจ้งหนี้ (Invoice) และรูปแบบรันเลขที่ (Naming Convention)"
tags: [data, schema, invoice]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: Invoice

## 1. Schema (Logical)
- **id**: UUID
- **invoice_number**: String (unique) - `INV-YYYYMMDD-NNN`
- **order_id**: UUID (FK to Order)
- **tenant_id**: UUID (Targeted for Isolation)
- **status**: Enum (`PENDING`, `PARTIAL`, `PAID`, `VOID`)
- **amount_total**: Decimal
- **discount**: Decimal
- **vat_amount**: Decimal
- **due_date**: Date

## 2. Relations
- **1 : 1** with `Order`
- **1 : N** with `Transaction`
- **1 : 1** with `TaxInvoice` (Optional)
