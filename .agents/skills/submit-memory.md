# Skill: Submit Memory

> Trigger: เมื่อต้องการเพิ่มความรู้ใหม่ลงใน GKS หรือคำสั่ง /submit-memory
> Purpose: ควบคุมความถูกต้องของข้อมูล (Knowledge Quality) ก่อนเข้าสู่ระบบถาวร

## Instructions

เมื่อเอเจนท์สร้างความรู้ใหม่ (Atomic Notes) เช่น ADR, MOD, หรือ FLOW:

1. **ร่างไฟล์ Markdown:** สร้างไฟล์ในโฟลเดอร์ `inbound/` (อ้างอิง path ใน registry.yaml)
2. **ตรวจสอบ Metadata:** ต้องมี Frontmatter ครบตามสัญญาของ MSP (id, phase, status, vault_id)
3. **ตรวจสอบ Wikilinks:** เชื่อมโยงความรู้ที่เกี่ยวข้องผ่าน `[[ID]]`
4. **แจ้งให้ Boss ตรวจ:**
   ```
   📥 Memory Proposal Submitted
   - Type: [ADR/FLOW/etc.]
   - ID: [ID]
   - Summary: [Brief Description]
   - Location: .brain/msp/projects/evaAI/inbound/
   ```

## Rules
- ห้ามเขียนไฟล์ลงถาวรใน `gks/` โดยตรงในขั้นตอนนี้ (Governance Gate)
- ทุก ID ต้องมีความเป็นเอกลักษณ์ (Unique)
- ห้ามใช้ OS Path ในการลิงก์ (Semantic Links Only)
