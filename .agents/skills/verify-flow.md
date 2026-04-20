# Skill: Verify Spec Flow

> Trigger: /verify-flow หรือก่อนเริ่มเฟส P5 (Implementation)
> Purpose: ตรวจสอบความพร้อมของเอกสาร (Phase Gating) เพื่อป้องกันปัญหาการเขียนโค้ดโดยไม่มีสเปค

## Instructions

เมื่อได้รับคำสั่งให้ตรวจสอบความพร้อมก่อนเริ่มงาน:

1. **ตรวจสอบความต่อเนื่อง:** เช็คว่า FEAT ID นี้มี `CONCEPT--`, `ADR--`, และ `API--` ครบถ้วนหรือไม่
2. **ตรวจสอบสถานะอนุมัติ:** ค้นหาคำว่า `status: APPROVED` ในไฟล์ทั้งหมดที่เกี่ยวข้อง
3. **ตรวจสอบความสอดคล้อง:** เช็คว่า API Specification ใน `API--` ตรงกับความต้องการใน `CONCEPT--` หรือไม่
4. **สรุปผลการตรวจสอบ:**
   ```
   ⚖️ Phase Readiness Report
   - Documentation Coverage: [X/3]
   - Approval Status: [APPROVED / PENDING]
   - Risk Level: [None / High (Missing Spec)]
   - Verdict: [🟢 GO / 🔴 STOP]
   ```

## Rules
- หากขาดสเปคส่วนใดส่วนหนึ่ง ห้ามตัดเกรดเป็น 🟢 GO เด็ดขาด
- หากพบปัญหาเรื่องความปลอดภัยใน Spec ให้แจ้งเตือนด้วย [!CAUTION] ทันที
