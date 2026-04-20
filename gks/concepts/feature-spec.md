# FEAT-{NN} — {ชื่อฟีเจอร์ ภาษาไทย}
> Phase 2: DESIGN — Complete product specification. Focus on User Experience and Business Logic.
> Rule: ร่างเป็นภาษาไทยเพื่อความรวดเร็วและแม่นยำใน Gate 2 (Boss Review)
> Requirement: เมื่อ Boss Approve แล้ว Agent ต้องแปลไฟล์นี้เป็นภาษาอังกฤษก่อนเข้าสู่ Phase 3

**Status:** `{DRAFT | REVIEW | APPROVED | IMPLEMENTED}`
**Version:** {X.Y.Z}
**Date:** {YYYY-MM-DD}
**Author:** {Agent ID}
**Reviewer:** {Boss}
**Depends On:** {FEAT-XX, FEAT-YY}
**Brief:** {ลิงก์ไปหา Feature Brief}

---

## 1. Overview (ภาพรวม)

{เขียนอธิบาย 3 ย่อหน้า:
- ย่อหน้า 1: นิยามของฟีเจอร์นี้ในประโยคเดียว
- ย่อหน้า 2: ใครเป็นคนใช้ และแก้ปัญหาอะไร?
- ย่อหน้า 3: ฟีเจอร์นี้อยู่ในลำดับไหนของระบบ?}

```
{User Flow Diagram / ASCII}
Start ──▶ Action A ──▶ [Decision?] ──▶ Success/Fail
```

---

## 2. Business Terminology (คำศัพท์ทางธุรกิจ)

| คำศัพท์ | นิยาม |
|---|---|
| **{คำศัพท์}** | {คำอธิบายที่ชัดเจน ไม่กำกวม} |

---

## 3. Feature Breakdown (รายละเอียดฟีเจอร์)

### 3.1 {ชื่อฟีเจอร์ย่อย}

**Description (คำอธิบาย):**
{อธิบายการทำงานในมุมมองของผู้ใช้โดยละเอียด}

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ {Text wireframe ของหน้าจอ}               │
│                                          │
│ [ปุ่ม]  [ช่องกรอกข้อมูล]                   │
└─────────────────────────────────────────┘
```

**Fields & Display (ฟิลด์และการแสดงผล):**

| ฟิลด์ | คำอธิบาย | ประเภท | หมายเหตุ |
|---|---|---|---|
| {ชื่อฟิลด์} | {แสดงค่าอะไร} | {Label/Input/List} | {Format: เช่น สกุลเงิน} |

**User Interactions (การโต้ตอบ):**
- {การกระทำ 1: คลิก X -> เกิด Y}
- {การกระทำ 2: Hover Z -> แสดง Tooltip}

**Business Rules (กฎทางธุรกิจ):**
- **CRITICAL:** {กฎที่ห้ามผิด: ถ้า X ต้องเกิด Y}
- **GUARD:** {กฎการตรวจสอบข้อมูล (Validation)}

---

## 4. Roles & Permissions (บทบาทและสิทธิ์)

| บทบาท | การกระทำที่อนุญาต | เงื่อนไขเพิ่มเติม |
|---|---|---|
| **Admin** | Create, Update, Delete | ข้อมูลทั้งหมด |
| **Member** | View | เฉพาะข้อมูลของตนเอง |

---

## 5. User Journey & Story

- **Scenario A:** {อธิบายเส้นทางการใช้งานหลักของตัวละครสมมติ}
- **Scenario B:** {อธิบายกรณีที่เกิด Error หรือเส้นทางพิเศษ}

---

## 6. Non-Functional Requirements (Product)

- **UX/Latency:** {เช่น หน้าจอต้องโหลดเสร็จใน 200ms}
- **Accessibility:** {การรองรับผู้พิการ หรือมาตรฐาน WCAG}
- **Style:** {เช่น ใช้ dark-mode หรือ component เฉพาะ}

---

## 7. Known Gotchas (Product)

- **{หัวข้อ}:** {จุดที่ผู้ใช้อาจสับสน} — {สาเหตุ} — {วิธีแก้ปัญหา}

---

## 8. Related Docs

- **Module Manifest:** {ลิงก์ไปหาไฟล์ Manifest ที่เกี่ยวข้อง}
- **Previous Features:** {FEAT-XX}
