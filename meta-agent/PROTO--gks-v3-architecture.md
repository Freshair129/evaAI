---
id: "PROTO--gks-v3-architecture"
name: "Genesis Knowledge System v3"
type: "protocol"
status: "Prototype"
created: "2026-04-16-16:45"
updated: "2026-04-16-16:47"
epistemic:
  confidence: 1.0
  source_type: "direct_experience"
context_anchor:
  duration: "universal"
summary: "สถาปัตยกรรม GKS v3: สายพานการผลิตข้อมูล (Information Assembly Line) แบ่ง 3 Phase Vaults"
---
# Architectural Specification: GKS v3 (Pipeline Architecture)

## 1. วิสัยทัศน์ (Vision)
ระบบ GKS v3 ถูกออกแบบมาเพื่อเป็น
***"สายพานการผลิตข้อมูล" (Information Assembly Line)*** ที่เปลี่ยนจากความต้องการดิบ (Human Concept) ไปสู่คำสั่งที่รัดกุม (Technical Blueprint) เพื่อให้ AI แต่ละระดับ (Large LLM vs Small SLM) ทำงานได้เต็มประสิทธิภาพสูงสุด โดยเน้นการประหยัด Token และการลดอาการหลอน (Hallucination) ผ่านการจำกัดบริบท (Context Isolation)

---

## 2. โครงสร้างลอจิก (Logic Structure: 3-Phase Pipeline)

สถาปัตยกรรมนี้แบ่งข้อมูลออกเป็น 3 ระดับ (Phase) โดยแต่ละระดับมี Vault และเครื่องมือจัดการเฉพาะตัว:

### 🟢 Phase 1: Concept Vault (`phase1_docs/`)
*   **เป้าหมาย:** บันทึกความต้องการในรูปแบบที่มนุษย์เข้าใจง่าย (Human-readable)
*   **เนื้อหา:** PRD, User Journey, Requirements (FR/NFR), POC, Design Mockups
*   **ผู้ใช้งานหลัก:** มนุษย์ (The Boss/PM) และ AI ระดับวิเคราะห์ (Opus/Gemini)
*   **เครื่องมือ:** Obsidian (Manual Write/Edit)

### 🟡 Phase 2: Atomic Knowledge Vault (`phase2_atomic/`)
*   **เป้าหมาย:** สกัดความรู้จาก Phase 1 ให้กลายเป็น "อะตอม" (Atomic Notes) เพื่อให้ AI ค้นหาและเชื่อมโยงได้แม่นยำ
*   **เนื้อหา:** ADRs, Logic Protocols, Data Flows, Module Manifests, Entity Definitions
*   **มาตรฐาน:** Schema v2 (Epistemic Score, Context Anchor)
*   **ผู้ใช้งานหลัก:** AI ระดับสถาปนิก (Opus/Gemini) ผ่าน Obsidian MCP/API
*   **หน้าที่:** เป็น SSOT (Single Source of Truth) ของระบบ

### 🔴 Phase 3: Blueprint Vault (`phase3_blueprints/`)
*   **เป้าหมาย:** แปลงความรู้ทางเทคนิคจาก Phase 2 ให้เป็นคำสั่งที่รัดกุมที่สุด (Pure YAML)
*   **เนื้อหา:** Technical Implementation Plans (.yaml), API Specs, Component Contracts
*   **ผู้ใช้งานหลัก:** **SLM Coding Workers** (Qwen2.5-Coder 4B/14B) บน Local
*   **หน้าที่:** เป็น "คำสั่งงาน" (Work Order) ที่แห้งสนิท ไร้น้ำ เพื่อให้ SLM ไม่หลงทาง

---

## 3. เอกสารบังคับ (Mandatory Documents per Phase)

เพื่อให้สายพานข้อมูลทำงานได้อย่างต่อเนื่อง แต่ละ Phase จะต้องผลิตเอกสารบังคับดังต่อไปนี้:

### 🟢 Phase 1: Artifacts (The Foundation)
1.  **`PRD.md` / `REQ.md`**: เอกสารความต้องการทางธุรกิจและข้อกำหนดทางเทคนิค (FR/NFR)
2.  **`SECURITY_REQ.md`**: ข้อกำหนดด้านความปลอดภัยและความเป็นส่วนตัวของข้อมูล (Data Privacy, Compliance, PDPA)
3.  **`POC.md`**: เอกสารยืนยันแนวคิด (Proof of Concept) สำหรับเทคโนโลยีหรือฟีเจอร์ใหม่
4.  **`USER_JOURNEY.md`**: ขั้นตอนการใช้งานของผู้ใช้ (Journey Map)
5.  **`UI_INVENTORY.md`**: รายการ UI Components ที่ต้องใช้ (เชื่อมโยงกับ Mockup)

### 🟡 Phase 2: Artifacts (The Knowledge & Execution)
1.  **`TECH_STACK.md`**: รายละเอียดเทคโนโลยีที่ใช้ (Stack Layer, Libs, API Versions)
2.  **`DEV_TOOLS.md`**: รายการเครื่องมือพัฒนา สคริปต์อัตโนมัติ และคำสั่งทดสอบ (Scripts, CLI, Testing, Env)
3.  **`SAFETY--{ID}.md`**: กฎการป้องกันความปลอดภัยและรั้วกั้นข้อมูล (Guardrails, Tenant Isolation, RLS)
4.  **`AUDIT_LOG_SPEC.md`**: มาตรฐานการบันทึก Log และการตรวจสอบย้อนกลับ (Traceability)
5.  **`ADR--{ID}.md`**: บันทึกการตัดสินใจทางสถาปัตยกรรม (Architecture Decision Records)
6.  **`flow--{ID}.md`**: แผนผังการไหลของข้อมูล (Mermaid Diagram)
7.  **`entity--{ID}.md`**: นิยามโครงสร้าง Database Table หรือ Data Object
8.  **`PROTO--{ID}.md`**: ระเบียบปฏิบัติหรือตรรกะเฉพาะทาง (Logic/Algorithm)

### 🔴 Phase 3: Artifacts (The Instructions)
1.  **`FEAT-{NNN}.yaml`**: แผนการ Implement ฟีเจอร์ (ต้องมี Security Validation Tasks)
2.  **`MOD-{NAME}.yaml`**: นิยามขอบเขตของ Module (Module Contract)

---

## 4. กลไกการเชื่อมโยง (The Master Dashboard)

ใน Root Folder (`gks/`) จะมีหน้า **`00_MASTER_DASHBOARD.md`** ทำหน้าที่เป็นศูนย์กลาง:
*   **Global Visibility:** แสดงสถานะความคืบหน้าของฟีเจอร์ต่างๆ ผ่านทั้ง 3 Phase
*   **Cross-Vault Linkage:** ใช้ Relative Path หรือ Absolute URI ในการเชื่อมโยงข้อมูลข้าม Vault
*   **Multi-Vault Integration:** มนุษย์สามารถเปิด Vault ใหญ่ (gks/) เพื่อดูภาพรวม หรือเปิด Vault ย่อย (เช่น phase3/) เพื่อทำงานเฉพาะส่วนได้

---

## 5. แผนการย้ายฐานข้อมูล (Migration Plan)
1. **Initialize Root:** สร้างโครงสร้างโฟลเดอร์ `phase1_docs`, `phase2_atomic`, `phase3_blueprints` ภายใต้ `gks/`
2. **Move & Refactor:** ย้ายไฟล์จาก `docs/` และ `gks/` เดิมเข้าสู่ Phase ที่ถูกต้อง
3. **Setup Dashboard:** สร้างหน้า Dashboard กลางเพื่อเชื่อมโยงข้อมูล
