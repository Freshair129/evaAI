---
id: ALGO--slip-ocr
type: algorithm
module: billing
status: stable
summary: "อัลกอริทึมการตรวจสอบสลิปโอนเงินอัตโนมัติ (Slip Verification Logic)"
tags: [ocr, gemini-vision, payment]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Algorithm: Slip OCR Verification

## 1. Technical Goal
เพื่อให้ระบบสามารถยืนยันยอดเงินโอนจากภาพสลิปที่ลูกค้าส่งเข้าแชทได้โดยไม่ต้องให้พนักงานตรวจสอบเอง (ลดความผิดพลาดและเพิ่มความเร็ว)

## 2. Logic Steps (HOW)
1. **Image Capture**: รับไฟล์ภาพจาก Messaging Webhook (FB/LINE)
2. **Vision Analysis**: ส่งภาพไปยัง Gemini Vision API เพื่อสกัดข้อมูล:
    - `refNumber`: เลขอ้างอิงธนาคาร
    - `amount`: ยอดเงินที่โอน
    - `timestamp`: วันที่และเวลาโอน
3. **Validation Rules**:
    - **Rule 1: Confidence Check**: หาก API แจ้งค่าความเชื่อมั่น (Confidence) < 0.80 -> ส่งให้พนักงานตรวจสอบ (Manual Review)
    - **Rule 2: Duplicate Check**: ตรวจสอบ `refNumber` ในตาราง `Transaction` หากซ้ำ -> Reject 409 (Conflict)
    - **Rule 3: Amount Match**: เปรียบเทียบยอดโอนกับยอดใน Invoice
4. **Outcome**:
    - หากผ่านฉลาก -> สร้าง Transaction (status: `PAID`) และ COMPLETED Order อัตโนมัติ

## 3. Thresholds
| Parameter | Value | Note |
|---|---|---|
| Auto-Verify Confidence | >= 0.80 | ต่ำกว่านี้ต้องใช้คน |
| Expire Time | 15 min | เวลาสูงสุดที่สลิปจะยังใช้ยืนยันออเดอร์เดิมได้ |
