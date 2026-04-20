# Skill: Session Checkpoint

> Trigger: จบ session หรือ /checkpoint
> Purpose: บันทึก progress ก่อนจบ session

## Instructions

เมื่อ Boss จะจบ session หรือทุก 3-4 tasks:

1. **อัปเดต MEMORY.md** — เพิ่ม entry ใหม่:
   ```markdown
   ## {DATE} — Session N (Claude)

   ### สิ่งที่ทำ
   - [list completed tasks]

   ### สถานะปัจจุบัน
   - Phase: X — status
   - Blocking: [issues if any]

   ### Known Issues
   - [issues found]

   ### Files Changed
   - [list of changed files]
   ```

2. **อัปเดต GOAL.md** — check off completed tasks

3. **Verify consistency:**
   - MEMORY.md matches GOAL.md (no contradictions)
   - ถ้ามี ADR ใหม่ → listed in MEMORY.md
   - ถ้ามี gotcha ใหม่ → เพิ่มใน docs/gotchas/

4. **สรุปให้ Boss:**
   ```
   ✅ Checkpoint saved
   - Completed: X tasks
   - Remaining: Y tasks
   - Next session: [recommendation]
   ```

## Rules
- ห้าม mark task complete ถ้ายังไม่ verify code จริง (G-AI-01)
- ถ้า session ยาว (>10 tasks) → checkpoint ทุก 3-4 tasks
- ถ้า Boss บอก "จบ" → ทำ full checkpoint ก่อน
