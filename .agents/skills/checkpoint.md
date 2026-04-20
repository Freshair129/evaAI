# Skill: Session Checkpoint

> Trigger: จบ session หรือ /checkpoint
> Purpose: จดบันทึกและบรรจุความทรงจำ (Archive Memory) เพื่อเป็นรอยจารึกให้เซสชันถัดไป

## Instructions

เมื่อจบเซสชัน หรือ Boss สั่ง `/checkpoint`:

1. **สรุป Action Log:** รวบรวมงานที่ทำเสร็จในเซสชันนี้
2. **อัปเดต CHANGELOG.md:** 
   - เพิ่ม Entry ใหม่ตามรูปแบบ: `## [DATE] (SessionID) - Summary`
   - ระบุไฟล์ที่แก้ไขและ ADR/ID ที่ถูกสร้างขึ้น
3. **จด Episodic Memory:** สร้าง/อัปเดตสรุปเหตุการณ์ใน `.brain/msp/projects/evaAI/memory/`
4. **รัน Re-indexer:** เพื่อให้ Index เป็นปัจจุบันที่สุด
   ```bash
   node scripts/msp/re-indexer.mjs
   ```
5. **สรุปให้ Boss:**
   ```
   ✅ Checkpoint Created
   - Session ID: [ID]
   - Tasks Completed: [X]
   - Index Status: Synced
   - Ready for Push: Yes/No
   ```

## Rules
- ทุก Checkpoint ต้องมี `sessionId` กำกับเสมอ เพื่อความสมบูรณ์ของ Traceability
- ห้ามปิดเซสชันโดยไม่อัปเดต CHANGELOG (Memory Integrity)
- หากมี Breaking Change → ต้องไฮไลต์ด้วย [!IMPORTANT] ใน CHANGELOG
