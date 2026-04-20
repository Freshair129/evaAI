# Skill: Session Catchup

> Trigger: เริ่ม session ใหม่ หรือ /catchup
> Purpose: ฟื้นฟูบริบทงาน (Restore Context) ให้เอเจนท์ทำงานต่อได้โดยไม่หลงทิศทาง

## Instructions

เมื่อเริ่มเซสชันใหม่ หรือได้รับคำสั่ง `/catchup` ให้ทำตามลำดับนี้:

1. **อ่าน CHANGELOG.md** — ดูสถานะล่าสุด (Latest Pointer) และงานที่ทำค้างไว้ในเซสชันก่อนหน้า
2. **สแกน gks/00_index/atomic_index.jsonl** — ตรวจสอบไฟล์ใหม่หรือ ADR ที่เพิ่งได้รับอนุมัติ เพื่ออัปเดตฐานความรู้ในหัว
3. **ตรวจสอบ MSP Sessions** — หากมี sessionId ตกค้าง ให้อ่านบันทึกสรุป (Episodic Memory) ใน `.brain/msp/projects/evaAI/memory/`
4. **สรุปให้ Boss** — รายงานผลการ Catchup:
   ```
   - สถานะล่าสุด: [Summary from CHANGELOG]
   - Phase ปัจจุบัน: [P1-P7]
   - ความรู้ใหม่ที่ค้นพบ: [IDs found in index]
   - สิ่งที่พร้อมทำต่อ: [Task suggestion]
   ```

## Rules
- ห้ามทำงานโดยไม่อ่าน CHANGELOG หรือ Index ล่าสุด (Context Hijacking Prevention)
- หากพบ ID ในไฟล์แต่ไม่มีใน Index → ให้รัน `node scripts/msp/re-indexer.mjs` ทันที
- หากพบความขัดแย้ง (Conflict) ระหว่าง Spec กับ Code → แจ้ง Boss ทันที
