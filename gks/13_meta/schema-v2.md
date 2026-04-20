# GKS Schema v2 — MSP-Inspired Prompt-Based Pipeline

> ไม่มี Python runtime ไม่มี engine — agent กรอก frontmatter template → save .md → Obsidian render graph

---

## 1. แนวคิดหลัก: Pipeline 3 ขั้น

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Agent เปิด template ที่ตรงกับ type                     │
│          (จาก 13_meta/templates/)                               │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Agent กรอก frontmatter ตาม AGENT_WRITE_PROTOCOL.md     │
│          — ห้ามเดา ถ้าไม่รู้ให้ใส่ confidence: 0.4             │
│          — ต้องระบุ crosslinks ทุกเส้นที่รู้                    │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Boss approve → merge → Obsidian graph renders           │
│          wikilinks กลายเป็น edge โดยอัตโนมัติ                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Universal Frontmatter Schema (v2)

```yaml
---
# ── IDENTITY ──────────────────────────────────────────────────────
id: "{type-prefix}--{slug}"          # เช่น algo--fefo, feat--login-oauth
type: module|feature|algorithm|protocol|safety|entity|adr|term|incident
module: "{module-name}"              # parent module (core/crm/pos/kitchen...)
status: draft|stub|stable|deprecated

# ── SUMMARY (สิ่งเดียวที่ agent โหลดก่อนตัดสินใจอ่านต่อ) ──────────
summary: "{< 200 chars, must be falsifiable}"
granularity: universal|general|specific|atomic
# universal = กฎทั้งระบบ (เช่น tenantId isolation)
# general   = ระดับ module/feature
# specific  = ระดับ function/component  
# atomic    = single rule/constraint

# ── EPISTEMIC STATUS (from MSP — กัน hallucination) ────────────────
epistemic:
  confidence: 0.0–1.0
  # 1.0 = verified in production
  # 0.8 = tested locally
  # 0.6 = designed, not yet tested
  # 0.4 = inferred/assumed
  source_type: axiom|direct_experience|inference|external
  # axiom             = กฎรากฐาน ไม่เปลี่ยน (เช่น tenantId rule)
  # direct_experience = มาจาก code/test จริง
  # inference         = อนุมานจาก note อื่น
  # external          = มาจาก docs/spec/ADR ภายนอก
  contradictions: []  # IDs ของ note ที่ขัดแย้ง

# ── CONTEXT ANCHOR (from MSP LCA — บอก agent ว่ายัง valid ไหม) ──────
context_anchor:
  duration: permanent|temporary|conditional
  # permanent    = ยังใช้งานได้ตลอด
  # temporary    = มี valid_until กำหนด
  # conditional  = valid เฉพาะบางเงื่อนไข
  valid_until: null    # ISO date หรือ null
  superseded_by: null  # note ID ที่แทนที่ note นี้แล้ว

# ── TYPED CROSSLINKS (from MSP CrosslinkManager) ──────────────────
crosslinks:
  implements: []    # note นี้ implement concept/ADR เหล่านี้
  used_by: []       # note เหล่านี้ depend on note นี้
  references: []    # อ้างอิงแต่ไม่ dependent
  guards: []        # safety rules ที่บังคับใช้กับ note นี้
  contradicts: []   # note ที่มีข้อมูลขัดแย้ง (ต้องระบุทั้งสองฝ่าย)

# ── CODE TOUCHPOINTS ──────────────────────────────────────────────
touch_points: []    # "src/path/file.js::functionName"

# ── META ──────────────────────────────────────────────────────────
owner: "@{team}"
tags: []
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
created_by: "@{agent-id}"
updated_by: "@{agent-id}"
---
```

---

## 3. Crosslink Type Reference (แทน CrosslinkManager.py)

| Type | ทิศทาง | ความหมาย | ตัวอย่าง |
|------|--------|-----------|----------|
| `implements` | → | note นี้ implement rule/ADR นี้ | ALGO--fefo implements ADR-033 |
| `used_by` | ← | note อื่น depend on note นี้ | entity--user used_by FEAT--login |
| `references` | → | อ้างถึงแต่ไม่ block | PROTO--billing references entity--invoice |
| `guards` | → | safety rule ที่ apply | FEAT--* guards SAFETY--tenant-isolation |
| `contradicts` | ↔ | ข้อมูลขัดแย้ง (ต้อง update ทั้งสองฝั่ง) | — |

> **กฎ Obsidian**: ทุก `[[wikilink]]` ใน crosslinks จะกลายเป็น **edge** ใน graph view อัตโนมัติ ไม่ต้อง config อะไรเพิ่ม

---

## 4. Granularity × Duration Matrix (ช่วย agent ตัดสินใจ)

```
                     DURATION
                  permanent  temporary  conditional
             ┌──────────────────────────────────────┐
G universal  │  Core Safety   Time-boxed     Feature
R            │  ADRs          promotions     flags
A ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
N general    │  Module        Sprint-scope  Env-based
U            │  contracts     decisions     configs
L ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
A specific   │  Feature       In-progress   A/B tests
R            │  specs         tasks
I ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
T atomic     │  Single        Bug fixes     Toggles
Y            │  constraints
             └──────────────────────────────────────┘
```

---

## 5. Epistemic Confidence ป้องกัน Hallucination อย่างไร

เมื่อ agent query GKS และพบ note ที่มี `confidence < 0.6` หรือ `source_type: inference` → ต้องบอก user ว่า "ข้อมูลนี้เป็นการอนุมาน ยังไม่ verified" แทนที่จะ assert ว่าจริง

```
confidence ≥ 0.8 + source_type: direct_experience  →  ASSERT ได้เลย
confidence 0.6–0.8 + source_type: inference         →  ต้อง caveat
confidence < 0.6 หรือ source_type: external         →  ต้องขอ verify ก่อน
```

---

*Schema v2 — ported from MSP v9.6.4 CrosslinkManager + LCA concepts*
*No Python runtime required — prompt-based pipeline only*
