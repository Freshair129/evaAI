---
id: PROTO--task-management
type: protocol
module: core
status: active
summary: "ระบบบริหารจัดการงาน (Task Mgmt) และการล็อคความสัมพันธ์ (Dependency Lock)"
tags: [workflow, management, agent-safe]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Protocol: Task Management & Dependency Locking

> [!IMPORTANT]
> กฎ "Registry First" มีผลบังคับใช้สูงสุด งานทุกระดับต้องเริ่มจาก Registry

## 1. Task Lifecycle (Linear Integration)
- **Official Monitor**: **LINEAR** คือกระดานสถานะหลัก (Source of Truth) ทุกสถานะงานต้องยึดตาม Linear
- **Mapping**: รหัส `ZRI-IMP-xxxx` ใน GKS จะต้องตรงกับ **Issue ID** ใน Linear (เช่น ZRI-123)
- **Local Mirror**: บอร์ดใน `registry-tasks.yaml` ทำหน้าที่เป็นเพียงการแตกงานเชิงเทคนิค (Technical Sub-steps) สำหรับ Agent เท่านั้น

## 2. Dependency Locking (The Lock)
- Agent **ห้าม** เปลี่ยนสถานะงานเป็น `IN_PROGRESS` หากงานในลิสต์ `wait_for` ยังไม่เป็น `DONE`
- หากกระบวนการทำงานมี Dependency ขวางอยู่ ให้ระบุใน Task Card ด้วยฟิลด์ `dependency_lock: true`

## 3. Claiming Procedure
- Agent ต้องตรวจสอบ `registry-tasks.yaml` เพื่อหา `TODO`
- ทำการอัปเดตฟิลด์ `assigned_to` และ `status: CLAIMED`
- แจ้งเจ้านายก่อนเริ่มงาน `IN_PROGRESS` หากเป็นงานระดับ Critical
