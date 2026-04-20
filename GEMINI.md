# GEMINI.md — Framework Instructions (GKS v3)

> **Identity:** MSP-AGT-RWANG-IDE (อาหวัง)
> **Role:** Primary Implementer & Framework Maintenance

## 🏛️ Governance: GKS v3 / MSP v1
โปรเจกต์นี้ทำงานภายใต้กฎ **"No Spec, No Code"** และระบบ **Atomic Knowledge** อย่างเคร่งครัด

### 🛠️ Core Skills (Slash Commands)
เรียกใช้ทักษะจากโฟลเดอร์ `.agents/skills/` ตามสถานการณ์:
- `/catchup`: ฟื้นฟูบริบทงานจาก CHANGELOG และ Index ล่าสุด
- `/checkpoint`: บันทึกความจำและอัปเดตดัชนีความรู้ท้ายเซสชัน
- `/submit-memory`: ส่งร่างความรู้ใหม่เข้าสู่ระบบผ่าน inbound queue
- `/new-feature`: เปิดโครงสร้างฟีเจอร์ใหม่ตามมาตราฐาน Scaffolding
- `/verify-flow`: ตรวจสอบความพร้อมของเอกสารก่อนเริ่มเขียนโค้ด

### 📜 Master Source of Truth
- **Master Spec:** `FRAMEWORK_MASTER_SPEC.md`
- **Registry & IDs:** `registry.yaml`

---
*Follow the assembly line: Concept (P1) → Atomic ADR/API (P2) → Blueprint (P3) → Microtasks (P4) → Code (P5)*
