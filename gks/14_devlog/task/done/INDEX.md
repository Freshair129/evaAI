# 📦 Done Tasks Archive

**Location:** `d:\zuri\gks\14_devlog\task\done\`

## Purpose
Central archive for all completed tasks. Tasks in this folder have:
- ✅ Status marked as `done` in `d:\zuri\registry.yaml`
- 📋 Original task log preserved for audit trail
- 🔍 Complete history for reference and learning

## Task File Format
- **Naming:** `MSP-TSK-YYMMDD-SERIAL.md`
- **Example:** `MSP-TSK-260415001.md`
- **Storage:** One `.md` file per completed task

## How It Works

1. **During Task Execution**
   - Create task log in: `d:\zuri\gks\14_devlog\task\`
   - Update in: `d:\zuri\registry.yaml` with task details

2. **Upon Task Completion**
   - Update `status: done` in `registry.yaml`
   - Move/copy task log file to this folder: `d:\zuri\gks\14_devlog\task\done\`
   - OR keep symlink pointing to original location

3. **Archive & Audit**
   - This folder serves as **permanent historical record**
   - Never delete task records
   - Use `registry.yaml` as source of truth for task states

## Metadata Template

Each done task should include:
```
# MSP-TSK-YYMMDD-SERIAL — [Task Title]

## Status
- **Status:** ✅ DONE
- **Completed:** YYYY-MM-DD HH:MM
- **Duration:** X hours
- **Completed By:** MSP-USR-NAME / MSP-AGT-NAME

## Summary
[Brief summary of what was accomplished]

## Related Items
- Implementation: MSP-IMP-YYMMDD-SERIAL (if applicable)
- Incidents: MSP-INC-YYMMDD-SERIAL (if applicable)
- Reviews: MSP-REV-YYMMDD-SERIAL (if applicable)

## Outcomes
- [Achievement 1]
- [Achievement 2]
```

---

*This folder is managed by EVA System. Last updated: 2026-04-15*
