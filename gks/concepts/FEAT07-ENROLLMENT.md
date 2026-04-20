# FEAT-ENR — Enrollment & Certification Module

**Status:** APPROVED
**Version:** 1.1.0
**Date:** 2026-04-07
**Approved:** 2026-04-07
**Author:** Boss (Product Owner)
**Reviewer:** Claude (Architect)
**Depends On:** FEAT01 (tenantId), FEAT05 (Customer), FEAT06 (Payment/Order)
**Related:** FEAT08 (Kitchen ops from enrollment demand)

---

## 1. Overview

ระบบจัดการการจดทะเบียนเรียน (Enrollment), การเข้าเรียน (Attendance), และการออกใบประกาศนียบัตร (Certification) แบบอัตโนมัติ โดยอิงตามชั่วโมงเรียนจริงและประเภทของคอร์ส

**Core value:** "ลงทะเบียนง่าย เช็คชื่อแม่นยำ ออกใบเซอร์อัตโนมัติ"

---

## 2. Terminology

| คำศัพท์ | ความหมาย |
|---|---|
| **Enrollment** | การลงทะเบียนเรียนคอร์สใดคอร์สหนึ่งของลูกค้า (เชื่อม Customer + Product) |
| **Course Schedule** | ตารางเรียนราย session ที่เปิดให้เช็คอิน |
| **Attendance** | บันทึกการเข้าเรียนรายบุคคลต่อ session (Present/Absent) |
| **Certificate** | ใบประกาศนียบัตรที่ออกเมื่อเรียนครบจำนวนชั่วโมงที่กำหนด |
| **Credit Slot** | สิทธิ์การเรียนที่เหลืออยู่ (ชั่วโมง/เมนู) |

---

## 3. Enrollment Lifecycle

1. **PENDING** — ลูกค้าจอง/สั่งซื้อผ่าน POS หรือ Inbox แต่ยังไม่ชำระเงิน
2. **CONFIRMED** — ชำระเงินแล้ว พร้อมนัดหมายวันเรียน
3. **IN_PROGRESS** — เริ่มเรียนแล้ว มีชั่วโมงการเรียนสะสม
4. **COMPLETED** — เรียนจบครบตามหลักสูตร
5. **CANCELLED** — ยกเลิกการลงทะเบียน

---

## 4. Certification Logic (Implement v1.1)

ระบบจะออก Certificate ให้โดยอัตโนมัติเมื่อ `Enrollment.hoursCompleted` มีค่าถึงเกณฑ์ที่กำหนด:

### 4.1 Certificate Levels
- **BASIC_30H** — ครบ 30 ชั่วโมง (Basic Certificate)
- **PRO_111H** — ครบ 111 ชั่วโมง (Professional Certificate)
- **MASTER_201H** — ครบ 201 ชั่วโมง (Master Certificate)

### 4.2 ID Standard (ADR-041)
- **Format:** `CERT-[YYYYMMDD]-[SERIAL]`
- **Example:** `CERT-20260407-001`
- **Logic:** รันหมายเลขแยกรายวัน (serial 3 หลัก)

---

## 5. Automated Workers (QStash)

ระบบใช้ QStash Background Workers ในการตรวจสอบสถานะ:

- **Check Completion:** รันทุกวันเวลา 23:00 เพื่อตรวจสอบ Enrollment ที่เรียนครบแล้วและสร้าง Certificate อัตโนมัติ
- **Attendance Monitor:** แจ้งเตือนลูกค้าที่ขาดเรียนเกินเกณฑ์ที่กำหนด

---

## 6. API Endpoints

| Method | Path | Action |
|---|---|---|
| `POST` | `/api/enrollments` | สร้างการลงทะเบียนใหม่ |
| `GET` | `/api/enrollments/[id]` | ดูรายละเอียดและชั่วโมงที่ทำไปแล้ว |
| `POST` | `/api/attendance/check-in` | สแกน QR เพื่อเช็คชื่อเข้าเรียน |
| `GET` | `/api/certificates/[id]/pdf` | ดาวน์โหลดไฟล์ใบประกาศ |

---

## 7. Implementation Progress ✅

- [x] Enrollment CRUD with `tenantId` isolation
- [x] Attendance System (QR + Manual)
- [x] Certificate Repository (`certificateRepo.js`) with ID generation logic
- [x] Automated Completion Worker (`/api/workers/check-completion`)
- [x] Multi-tenant filtering on all enrollment queries
- [x] Certificate PDF delivery logic (pending template UI)

---

*Status: UPDATED 2026-04-07*
