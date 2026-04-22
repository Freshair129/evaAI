# Skill: Import Project Data

> Trigger: /import-project
> Purpose: วิเคราะห์เอกสารดิบ (spec, requirements, tickets, notes) แล้วแปลงเป็น GKS Atomics ผ่าน MSP Inbound pipeline ทีละชิ้น

## Instructions

เมื่อ Boss ส่งเอกสารดิบมาพร้อมคำสั่ง `/import-project` ให้ทำตามลำดับนี้:

### ขั้นที่ 1 — รับ Input

รองรับ input ได้หลายรูปแบบ:
- **Inline text** — Boss วางข้อความใน chat โดยตรง
- **File path** — Boss ระบุ path ไฟล์ (`.md`, `.txt`, `.yaml`, `.json`)
- **URL** — Boss ส่ง link doc/ticket (ให้ WebFetch ก่อน)
- **Multiple files** — รับหลายไฟล์พร้อมกันได้

หากไม่ชัดเจนว่า input คืออะไร ให้ถามก่อนทำ

### ขั้นที่ 2 — ตรวจสอบ Dedup ก่อนวิเคราะห์

อ่าน `gks/00_index/atomic_index.jsonl` เพื่อโหลด IDs ที่มีอยู่แล้ว จะได้ไม่เสนอซ้ำ

### ขั้นที่ 3 — วิเคราะห์หาหน่วยความรู้ (Atomic Extraction)

อ่านเอกสารแล้วระบุแต่ละหน่วยความรู้ตาม heuristic ต่อไปนี้:

| สัญญาณในเอกสาร | Atomic Type ที่เหมาะสม |
|---|---|
| "ทำไมถึงเลือก X แทน Y", trade-off decision | `ADR` |
| ฟีเจอร์ / requirement / user story | `FEAT` |
| นิยาม entity, data model, schema | `ENTITY` |
| ขั้นตอน, sequence of events, lifecycle | `FLOW` |
| หลักการ, แนวคิดกว้าง ๆ ยังไม่มีรายละเอียด | `CONCEPT` |
| framework, pattern ที่ใช้ซ้ำได้ | `FRAME` |
| module / domain boundary | `MOD` |
| parameter / config value | `PARAMS` |
| algorithm, scoring formula | `ALGO` |

**Rule:** 1 หน่วยความรู้ = 1 atomic ห้ามยัดหลายเรื่องในไฟล์เดียว

### ขั้นที่ 4 — แสดง Extraction Plan ก่อนดำเนินการ

ก่อน propose สิ่งใด ให้แสดงรายการที่จะสร้างก่อน เพื่อให้ Boss อนุมัติ:

```
📋 Import Plan — [ชื่อเอกสาร]
───────────────────────────────
จะ propose atomics ทั้งหมด N ชิ้น:

  1. [TYPE]--[ID]  —  [สรุป 1 บรรทัด]
  2. [TYPE]--[ID]  —  สรุป...
  ...

ข้ามแล้ว (มีใน GKS แล้ว):
  - [ID ที่ซ้ำ]

⚠️  สิ่งที่ไม่ชัดเจน (ต้องการคำอธิบายเพิ่ม):
  - [ส่วนที่คลุมเครือ]

พิมพ์ GO เพื่อดำเนินการ หรือบอกให้แก้ไขรายการก่อน
```

รอ Boss ยืนยัน **ก่อน** ดำเนินการต่อ

### ขั้นที่ 5 — Propose ทีละชิ้นผ่าน /submit-memory

เมื่อ Boss พิมพ์ GO ให้ propose atomics ตามลำดับ โดยแต่ละชิ้นทำดังนี้:

1. สร้าง Markdown draft ที่มี frontmatter ครบตาม MSP standard:
   ```yaml
   ---
   id: "[TYPE]--[NAME]"
   phase: 1
   type: "[type]"
   status: "raw"
   vault_id: "EVA-AGENT-001"
   epistemic:
     confidence: [0.0–1.0]
     source: "imported"
     derived_from: "[ชื่อเอกสารต้นทาง]"
   crosslinks:
     derived_from: []
     implements: []
     related: []
   ---
   ```

2. เขียนเนื้อหาให้ครบ sections หลัก:
   - **Context / Problem** — ทำไมถึงต้องมีสิ่งนี้
   - **Content / Solution** — เนื้อหาหลัก (ไม่ใช่ copy-paste ทั้งก้อน — ต้องสรุปเป็น atomic)
   - **References** — link กลับไปเอกสารต้นทาง + crosslinks ไป ID อื่นในแผน

3. เขียนไฟล์ลง `.brain/msp/projects/evaAI/inbound/[ID].md`

4. รายงาน:
   ```
   ✅ [N/Total] — [ID] → inbound
   ```

5. ทำซ้ำจนครบทุกชิ้น

### ขั้นที่ 6 — สรุปผล

```
📥 Import Complete
──────────────────
เอกสารต้นทาง: [ชื่อ]
Proposed:  N atomics → .brain/msp/projects/evaAI/inbound/
ข้ามแล้ว:  M atomics (ซ้ำ)

รายการที่ส่งแล้ว:
  ✅ [ID-1]
  ✅ [ID-2]
  ...

ขั้นตอนถัดไป:
  1. รัน `npm run msp:review` เพื่อดู inbound ทั้งหมด
  2. รัน `npm run msp:promote` เพื่ออนุมัติและย้ายเข้า gks/
  3. รัน `npm run msp:index` เพื่ออัปเดต atomic_index.jsonl
```

## Rules

- **ห้าม propose โดยไม่รอ Boss อนุมัติ Plan ก่อน** (ขั้นที่ 4 บังคับ)
- **ห้ามเขียนตรงลง `gks/`** — ทุกชิ้นต้องผ่าน inbound เสมอ
- **1 atomic = 1 concern** หากเนื้อหาครอบคลุมหลายเรื่อง ให้แยกเป็นหลายไฟล์
- **ID ต้องไม่ซ้ำ** — ตรวจสอบ `atomic_index.jsonl` ก่อนทุกครั้ง
- **ห้าม copy-paste ทั้งก้อน** — ต้อง distill เป็น atomic knowledge จริง ๆ
- **confidence ใน epistemic** — ตั้งต่ำลงหากเอกสารต้นทางคลุมเครือหรือ draft
- หากเอกสารยาวมาก (>3000 words) ให้ทำ batch ทีละ 5 ชิ้น แล้วรอ Boss ยืนยันก่อนต่อ
