---
id: "api--billing"
type: "api"
module: "MOD-BILLING"
status: "stable"
version: "1.0.0"
summary: "API specs สำหรับ Billing — Invoices, Slip OCR Verification, PDF Generation, Receipt Dispatch"
granularity: "general"

epistemic:
  confidence: 0.9
  source_type: "direct_experience"
  contradictions: []

context_anchor:
  duration: "permanent"
  valid_until: null
  superseded_by: null

crosslinks:
  implements: ["[[FEAT-003_Billing]]"]
  used_by: ["[[api--pos]]", "[[api--integrations]]"]
  references: ["[[ALGO--slip-ocr]]", "[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]"]
  contradicts: []

touch_points:
  - "src/app/api/payments/verify-slip/route.js"
  - "src/app/api/invoices/generate-pdf/route.js"
  - "src/app/api/invoices/route.js"
  - "src/lib/ai/slipVerifier.js"
  - "src/lib/repositories/orderRepo.js"

owner: "@architect"
tags: [billing, invoices, payments, ocr, receipt]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — Billing

## 1. Payment Slip Verification

### `POST /api/payments/verify-slip`
> OCR ใบโอนเงิน → ยืนยันการชำระเงินอัตโนมัติ (ดู [[ALGO--slip-ocr]])

```
Confidence >= 0.80 + amount match → auto-confirm Transaction
Confidence < 0.80 → pending manual review
```

| | |
|---|---|
| **Auth** | `withAuth` |
| **Body** | `{ image_base64: string, invoice_id: uuid }` |
| **OCR Engine** | Gemini Vision API |
| **Duplicate Gate** | ตรวจ `refNumber` uniqueness ใน Transactions table |
| **Returns** | `{ verified: boolean, confidence: float, transaction_id?: uuid }` |
| **Auto-Confirm** | ถ้า verified → สร้าง Transaction + update Order status = COMPLETED |
| **Side Effects** | Receipt dispatch (LINE/FB), Accounting sync |

---

## 2. Invoice Management

### `GET /api/invoices` (ถ้ามี) หรือผ่าน `GET /api/orders/{id}`
> Invoice ของ Zuri ผูกกับ Order — ดึงผ่าน order endpoints

```
Invoice ID format: INV-YYYYMMDD-NNN (daily sequence)
```

---

### `POST /api/invoices/generate-pdf`
> Render HTML/React template → PDF → upload to Supabase Storage

| | |
|---|---|
| **Auth** | `withAuth` |
| **Body** | `{ orderId: uuid, template?: string }` |
| **Process** | Render React Invoice component → Puppeteer/html-pdf → Supabase Storage URL |
| **Returns** | `{ url: string }` (Supabase Storage URL) |

---

## 3. Receipt Dispatch

> ทำงานอัตโนมัติหลัง `POST /api/orders/{id}/pay` — ไม่มี dedicated endpoint

```
post_payment hooks:
  1. cart_clear     → ล้าง cart items
  2. receipt_dispatch → ส่ง e-Receipt ผ่าน LINE/FB/Email ตาม customer preference
```

---

## 4. Transaction Listing

### `GET /api/orders/{id}` → transactions field
> ดู payment transactions ผ่าน order detail

| Field | คำอธิบาย |
|-------|---------|
| `transactions[]` | รายการ payment records |
| `status` | PENDING\|COMPLETED\|VOIDED\|REFUNDED |
| `method` | CASH\|QR_PROMPTPAY\|CARD |
| `refNumber` | Reference จาก slip (OCR extracted) |

---

## 5. Security Notes

- **Duplicate prevention:** refNumber ต้องไม่ซ้ำใน Transactions table ของ tenant
- **Confidence threshold:** 0.80 — ต่ำกว่าต้องให้ staff ยืนยันเอง
- **Amount validation:** verified amount ต้องตรงกับ invoice total (±5%)
