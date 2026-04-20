# Skill: Plan Phase

> Trigger: เริ่ม phase ใหม่ หรือ /plan-phase {N}
> Purpose: วางแผน phase ก่อน implement

## Instructions

เมื่อเริ่ม phase ใหม่:

1. **อ่าน RESTRUCTURE_PLAN.md:**
   ```
   Read docs/zuri/RESTRUCTURE_PLAN.md → หา Phase {N}
   ```

2. **List tasks + subtasks:**
   - แตก task เป็น subtasks ที่ทำได้ใน 1 session
   - ระบุ dependencies ระหว่าง tasks
   - ระบุ files ที่ต้องแก้/สร้าง

3. **Check prerequisites:**
   - [ ] Feature specs exist? (Phase 1 required for Phase 4+)
   - [ ] ADRs approved? (Phase 2 required for Phase 4+)
   - [ ] Previous phase completed?

4. **Risk assessment:**
   - อ้าง docs/gotchas/ สำหรับ known risks
   - ระบุ blocking dependencies
   - ระบุ potential scope creep

5. **Create task breakdown:**
   ```markdown
   ## Phase {N}: {Name}

   ### Prerequisites
   - [x] Phase {N-1} completed
   - [x] Feature specs approved

   ### Tasks
   1. Task A
      - [ ] Subtask A.1
      - [ ] Subtask A.2
   2. Task B (depends on A)
      - [ ] Subtask B.1

   ### Estimated Effort
   - Sessions: ~X
   - Files: ~Y

   ### Risks
   - {risk} → mitigation: {mitigation}
   ```

6. **Update GOAL.md** — เพิ่ม tasks ของ phase ใหม่

7. **Present to Boss** — ขอ approve ก่อนเริ่ม

## Rules
- ห้าม implement ก่อน Boss approve plan
- ถ้า plan มี schema change → ต้องมี ADR
- ถ้า plan มี new dependency → ต้องมี ADR
- แต่ละ subtask ควรเล็กพอที่จะ checkpoint ได้
