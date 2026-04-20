# Skill: New Feature Scaffold

> Trigger: เริ่มฟีเจอร์ใหม่ หรือ /new-feature
> Purpose: วางโครงสร้างความรู้เริ่มต้นให้ครบถ้วนตามมาตรฐาน GKS v3

## Instructions

เมื่อ Boss ต้องการเริ่มฟีเจอร์ใหม่:

1. **ระบุ Feature ID:** ตรวจสอบรหัสล่าสุดและรัน `FEAT-NNN`
2. **สร้าง Concept Artifact:** ร่าง `CONCEPT--[FeatureName].md` ใน `gks/concepts/`
3. **เตรียม ADR เบื้องต้น:** ร่าง `ADR--[FeatureName]-Architecture.md` ใน `gks/adrs/`
4. **ร่าง API Spec:** ร่าง `API--[FeatureName].md` เพื่อระบุสัญญา Interface ขั้นต้น
5. **แจ้งสถานะการเริ่มงาน:**
   ```
   🎨 Feature Scaffolding Ready
   - ID: [FEAT-ID]
   - Phase: P1 (Discovery)
   - Status: RAW (Waiting for P1 Approval)
   ```

## Rules
- ห้ามเริ่มเขียนโค้ดจนกว่าเฟส 1-3 จะได้รับการอนุมัติ (No Spec, No Code)
- ทุกไฟล์ต้องมี Metadata ครบถ้วนตามสัญญาของ MSP
- หากเป็นงานเล็ก ให้ข้ามไปใช้สกิล Quick Action แทน
