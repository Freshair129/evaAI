---
# ════════════════════════════════════════════════
# GKS NOTE TEMPLATE v2 (MSP-Inspired Prompt Pipeline)
# กรอกทุก field ที่รู้ — ถ้าไม่รู้ให้ใส่ [] หรือ null
# ห้ามเดา — ถ้าไม่แน่ใจให้ set confidence: 0.4
# ════════════════════════════════════════════════

id: "{type-prefix}--{slug}"
type: feature      # module|feature|algorithm|protocol|safety|entity|adr|term|incident
module: "{module-name}"
status: draft      # draft|stub|stable|deprecated

summary: "{< 200 chars — อธิบาย WHAT this does, NOT how}"

granularity: specific   # universal|general|specific|atomic

epistemic:
  confidence: 0.6       # 1.0=prod-verified | 0.8=tested | 0.6=designed | 0.4=inferred
  source_type: inference  # axiom|direct_experience|inference|external
  contradictions: []    # ["[[note-id]]"]  ← ต้อง update note อีกฝั่งด้วย

context_anchor:
  duration: permanent   # permanent|temporary|conditional
  valid_until: null     # "2026-12-31" หรือ null
  superseded_by: null   # "[[new-note-id]]" ถ้าถูกแทนที่แล้ว

crosslinks:
  implements: []        # ["[[ADR-xxx]]"] note นี้ implement concept/rule เหล่านี้
  used_by: []           # ["[[feat-xxx]]"] note เหล่านี้ depend on note นี้
  references: []        # ["[[entity-xxx]]"] อ้างอิงแต่ไม่ block
  guards: []            # ["[[SAFETY--xxx]]"] safety rules ที่บังคับใช้
  contradicts: []       # ["[[note-id]]"] ข้อมูลที่ขัดแย้ง

touch_points: []        # ["src/path/file.js::functionName"]

owner: "@architect"
tags: []
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "@{agent-id}"
updated_by: "@{agent-id}"
---

# {Title}

## 1. Overview
> อธิบาย WHY ทำไมถึงมี note นี้ / ปัญหาที่แก้

## 2. Core Logic / Definition
> อธิบาย WHAT — ไม่ต้องใส่ code ถ้า touch_points ชี้ถึงแล้ว

## 3. Constraints & Guards
> สิ่งที่ต้องระวัง / boundary conditions
> ถ้ามี safety rule ให้ link จาก crosslinks.guards

## 4. Relations (narrative)
> อธิบาย context ของความสัมพันธ์กับ note อื่น
> wikilinks ที่ใส่ที่นี่จะกลายเป็น graph edge ใน Obsidian
