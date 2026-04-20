---
id: "api--enrollment"
type: "api"
module: "MOD-ENROLLMENT"
status: "stable"
version: "1.1.0"
summary: "API specs สำหรับ Enrollment — Course Schedules, Enrollment, Attendance (QR), Certification"
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
  implements: ["[[FEAT-007_Enrollment]]"]
  used_by: ["[[api--crm]]", "[[api--billing]]"]
  references: ["[[SAFETY--tenant-isolation]]", "[[ALGO--qr-generation]]"]
  guards: ["[[SAFETY--tenant-isolation]]"]
  contradicts: []

touch_points:
  - "src/app/api/enrollments/route.js"
  - "src/app/api/culinary/certificates/route.js"
  - "src/app/api/culinary/certificates/[id]/route.js"
  - "src/app/api/culinary/schedules/route.js"
  - "src/app/api/attendance/check-in/route.js"
  - "src/lib/repositories/enrollmentRepo.js"
  - "src/lib/repositories/certificateRepo.js"
  - "src/lib/repositories/courseRepo.js"

owner: "@architect"
tags: [enrollment, courses, attendance, certificates, qr]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — Enrollment & Certification

## 1. Enrollments

### `GET /api/enrollments`
> รายการ enrollments ของ tenant

| Parameter | คำอธิบาย |
|-----------|---------|
| `customerId` | filter by customer |
| `status` | PENDING\|ACTIVE\|COMPLETED\|CANCELLED |
| `from`/`to` | date range |

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: Enrollment[] }` (with customer, course info) |

---

### `POST /api/enrollments`
> ลงทะเบียนหลักสูตร

| | |
|---|---|
| **Auth** | `withAuth` — SLS/MGR |
| **Body** | `{ customerId, courseScheduleId, paymentMethod?, notes? }` |
| **Side Effects** | สร้าง Order (ถ้ามี payment), AuditLog, LINE notify ลูกค้า |
| **Returns** | `201 { data: Enrollment }` |

---

## 2. Course Schedules

### `GET /api/culinary/schedules`
> รายการตารางเรียน

| Parameter | คำอธิบาย |
|-----------|---------|
| `from`/`to` | date range |
| `available` | `true` — เฉพาะที่ยังมีที่ว่าง |

| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: CourseSchedule[] }` (with enrollmentCount, capacity) |

---

## 3. Attendance

### `POST /api/attendance/check-in`
> QR scan check-in (ดู [[ALGO--qr-generation]])

| | |
|---|---|
| **Auth** | `withAuth` — STF/MGR (staff scans) |
| **Body** | `{ qrToken: string }` |
| **QR Token** | encode: `{ enrollmentId, scheduleId, timestamp }` signed |
| **Validation** | Token valid, schedule date matches today, not already checked-in |
| **Returns** | `{ data: ClassAttendance }` |
| **Errors** | `400` already checked in, `400` token expired, `404` enrollment not found |

---

## 4. Certificates

### `GET /api/culinary/certificates`
> รายการ certificates ของ tenant

| | |
|---|---|
| **Auth** | `withAuth` |
| **Query** | `{ customerId?, tier?, from?, to? }` |
| **Returns** | `{ data: Certificate[] }` |

---

### `POST /api/culinary/certificates`
> สร้าง certificate (manual หรือ auto-trigger หลัง complete)

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ customerId, enrollmentId, tier: 'BASIC'\|'ADVANCED'\|'MASTER', issueDate? }` |
| **Side Effects** | Generate PDF, LINE notify, AuditLog |
| **Returns** | `201 { data: Certificate }` |

---

### `GET /api/culinary/certificates/{id}`
| | |
|---|---|
| **Auth** | `withAuth` |
| **Returns** | `{ data: Certificate }` (with pdfUrl) |

---

### `GET /api/culinary/certificates/{id}/pdf`
> Download certificate PDF

| | |
|---|---|
| **Auth** | `withAuth` หรือ public link (signed URL) |
| **Returns** | PDF file หรือ Supabase Storage signed URL |

---

## 5. Certification Logic

> Auto-certification ทำงานผ่าน QStash nightly batch — ดู [[FEAT-007_Enrollment]]

```
Nightly worker (00:05 ICT):
  1. Scan enrollments where status=ACTIVE
  2. Calculate total attended hours
  3. If hours >= tier threshold:
     BASIC >= 6h | ADVANCED >= 12h | MASTER >= 24h
  4. Auto-issue Certificate
  5. Send LINE notification
  6. Update Customer stage → COMPLETED
```

---

## 6. Permission Summary

| Resource | OWNER | ADM | MGR | STF/SLS |
|----------|-------|-----|-----|---------|
| View enrollments | ✅ All | ✅ All | ✅ All | ✅ Own |
| Create enrollment | ✅ | ✅ | ✅ | ✅ |
| Check-in attendance | ✅ | ✅ | ✅ | ✅ |
| Issue certificate | ✅ | ✅ | ✅ | ❌ |
| View certificates | ✅ | ✅ | ✅ | ✅ |
