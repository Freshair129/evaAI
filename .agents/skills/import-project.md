# Skill: Import Project into Atomic System

> Trigger: `/import-project` หรือเมื่อ Boss ต้องการนำโปรเจคหรือเอกสารภายนอกเข้าระบบ GKS atomic
> Purpose: วิเคราะห์ input (โปรเจคไดเรกทอรี, เอกสาร, URL, ข้อความ) แล้วแปลงเป็น GKS Atomic Notes ผ่าน MSP Inbound pipeline

---

## ขั้นที่ 1 — รับ Input

รองรับ input ได้หลายรูปแบบ:

| รูปแบบ | ตัวอย่าง | วิธีจัดการ |
|---|---|---|
| **Project path** | `/path/to/project` | สแกน directory structure (ดู §1a) |
| **File path** | `docs/spec.md`, `requirements.yaml` | Read ไฟล์โดยตรง |
| **Inline text** | Boss วางข้อความใน chat | วิเคราะห์จาก text |
| **URL** | link doc/ticket | WebFetch ก่อน แล้วค่อยวิเคราะห์ |
| **Multiple files** | หลายไฟล์พร้อมกัน | วิเคราะห์แยกกันแล้ว merge plan |

หากไม่ชัดเจนว่า input คืออะไร ให้ถามก่อนทำ

### §1a — Project Directory Scan (เฉพาะกรณี path)

สแกนตามลำดับนี้เพื่อ inventory โปรเจค:

1. `README.md` / `README.rst` → วิสัยทัศน์ + บริบทหลัก
2. `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` → stack + dependencies
3. `ARCHITECTURE.md` / `DESIGN.md` / `docs/` → decisions ที่มีอยู่
4. โครงสร้าง `src/` / `app/` / `lib/` → module boundaries
5. `docs/adr/`, `decisions/`, `*.adr.md` → existing ADRs
6. `openapi.yaml`, `swagger.json`, `routes/`, `api/` → endpoint groups

---

## ขั้นที่ 2 — ตรวจสอบ Dedup

อ่าน `gks/00_index/atomic_index.jsonl` เพื่อโหลด IDs ที่มีอยู่แล้ว จะได้ไม่เสนอซ้ำ

---

## ขั้นที่ 3 — วิเคราะห์หาหน่วยความรู้ (Atomic Extraction)

จัดแต่ละสิ่งที่พบเป็น atom type ตาม heuristic:

| สัญญาณ / สิ่งที่พบ | Atomic Type |
|---|---|
| "ทำไมถึงเลือก X แทน Y", trade-off decision | `ADR` |
| ฟีเจอร์ / requirement / user story | `FEAT` |
| นิยาม entity, data model, schema | `ENTITY` |
| ขั้นตอน, sequence of events, lifecycle | `FLOW` |
| หลักการ, แนวคิดกว้าง ๆ ยังไม่มีรายละเอียด | `CONCEPT` |
| framework, pattern ที่ใช้ซ้ำได้ | `FRAME` |
| module / domain / subsystem boundary | `MOD` |
| parameter / config value | `PARAMS` |
| algorithm, scoring formula | `ALGO` |

**Rule:** 1 หน่วยความรู้ = 1 atomic — ห้ามยัดหลายเรื่องในไฟล์เดียว

**กฎ ID:**
- ADR id ใหม่ = `max(existing ADR number) + 1`
- ชื่ออื่น ๆ = `PREFIX--<PROJECT-CODENAME>-<SHORT-NAME>` เช่น `MOD--myapp-auth`

---

## ขั้นที่ 4 — แสดง Import Plan ก่อนดำเนินการ

ก่อน propose สิ่งใด ให้แสดงรายการที่จะสร้างก่อน แล้วรอ Boss อนุมัติ:

```
📋 Import Plan — [ชื่อโปรเจค / เอกสาร]
──────────────────────────────────────
จะ propose atomics ทั้งหมด N ชิ้น:

  1. CONCEPT--[proj]-import-manifest  —  Import anchor (สร้างก่อนเสมอ)
  2. [TYPE]--[ID]  —  [สรุป 1 บรรทัด]
  3. [TYPE]--[ID]  —  สรุป...
  ...

ข้ามแล้ว (มีใน GKS แล้ว):
  - [ID ที่ซ้ำ]

⚠️  สิ่งที่ไม่ชัดเจน (ต้องการคำอธิบายเพิ่ม):
  - [ส่วนที่คลุมเครือ]

พิมพ์ GO เพื่อดำเนินการ หรือบอกให้แก้ไขรายการก่อน
```

รอ Boss ยืนยัน **ก่อน** ดำเนินการต่อ

---

## ขั้นที่ 5 — Draft Atoms ทีละชิ้น

เมื่อ Boss พิมพ์ GO ให้ draft ตามลำดับ — เริ่มด้วย Import Manifest เสมอ จากนั้น atoms อื่น ๆ

### Frontmatter มาตรฐาน:
```yaml
---
id: "[TYPE]--[NAME]"
phase: 1
type: "[type]"
status: "raw"
vault_id: "EVA-AGENT-001"
summary: "[one-line summary]"
epistemic:
  confidence: [0.0–1.0]
  source_type: "imported"     # หรือ "inferred" ถ้า extrapolate จาก code
  derived_from: "[ชื่อต้นทาง]"
crosslinks:
  derived_from: ["CONCEPT--[proj]-import-manifest"]
  implements: []
  related: []
---
```

### Import Manifest template (CONCEPT--):
```markdown
---
id: "CONCEPT--[proj]-import-manifest"
phase: 1
type: "concept"
status: "raw"
vault_id: "EVA-AGENT-001"
summary: "Import manifest for [ProjectName]"
epistemic:
  confidence: 0.9
  source_type: "direct_experience"
  derived_from: "[source path / URL]"
crosslinks:
  derived_from: []
  implements: []
---
# CONCEPT--[proj]-import-manifest

> Imported on: [date]
> Source: `[original path or URL]`
> Imported by: MSP-AGT-EVA-COWORK

## Project Overview
[summary]

## Stack
[detected stack]

## Atom Map
| ID | Type | Summary |
|---|---|---|
| ... | ... | ... |

## Import Notes
[gaps, assumptions, low-confidence items needing Boss review]
```

### เขียนเนื้อหาแต่ละ atom ให้มี:
- **Context / Problem** — ทำไมถึงต้องมีสิ่งนี้
- **Content / Solution** — เนื้อหาหลัก (distill — ไม่ใช่ copy-paste ทั้งก้อน)
- **References** — link กลับต้นทาง + crosslinks ไป atom อื่นในแผน

เขียนไฟล์ลง `.brain/msp/projects/evaAI/inbound/[ID].md` แล้วรายงาน:
```
✅ [N/Total] — [ID] → inbound
```

> หากเอกสารยาวมาก (>3000 words) ให้ทำ batch ทีละ 5 ชิ้น แล้วรอ Boss ยืนยันก่อนต่อ

---

## ขั้นที่ 6 — สรุปผล

```
📥 Import Complete: [ProjectName / Document]
────────────────────────────────────────────
Atoms drafted : [N] → .brain/msp/projects/evaAI/inbound/
├─ CONCEPT--  : [N] (incl. manifest)
├─ MOD--      : [N]
├─ FEAT--     : [N]
├─ ADR--      : [N]
├─ FLOW--     : [N]
└─ Other      : [N]
Skipped (dup) : [M]

⚠️  Items needing Boss review:
  - [low-confidence / ambiguous atoms]

ขั้นตอนถัดไป:
  1. รัน `npm run msp:review`  → ดู inbound ทั้งหมด
  2. รัน `npm run msp:promote` → อนุมัติและย้ายเข้า gks/
  3. รัน `npm run msp:index`   → อัปเดต atomic_index.jsonl
  4. เพิ่ม crosslinks ใน MOC.md (manual)
```

---

## Rules

- **ห้าม propose โดยไม่รอ Boss อนุมัติ Plan ก่อน** (ขั้นที่ 4 บังคับ)
- **ห้ามเขียนตรงลง `gks/`** — ทุกชิ้นต้องผ่าน `.brain/msp/projects/evaAI/inbound/` เสมอ
- **Import Manifest** (CONCEPT--) ต้องสร้างก่อนเสมอ เพื่อเป็น anchor crosslinks ของทั้งหมด
- **1 atomic = 1 concern** — ถ้า description มีคำว่า "และ" ให้แยกเป็น 2 atoms
- **ID ต้องไม่ซ้ำ** — ตรวจสอบ `atomic_index.jsonl` ก่อนทุกครั้ง
- **ห้าม copy-paste ทั้งก้อน** — ต้อง distill เป็น atomic knowledge จริง ๆ
- **confidence ≤ 0.6** หาก infer จาก code หรือเอกสารคลุมเครือ — ระบุ `source_type: inferred`
- **ADR ที่พอร์ตมา** ต้องระบุ source ใน body ชัดเจน — อย่าให้ดูเหมือน ADR ใหม่ของโปรเจคนี้
