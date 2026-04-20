# Agent Write Protocol v2
## (Replaces MSP Python Validator — Prompt-Based Pipeline)

> นี่คือสิ่งที่ agent ต้องทำแทน `schema_validator.py` และ `CrosslinkManager.py`
> ไม่มี Python — แค่ follow ขั้นตอนนี้ทุกครั้งที่เขียน note ใหม่หรือแก้ note เก่า

---

## WRITE GATE — ถามก่อนเขียนเสมอ

```
ก่อนเขียน note ใดๆ ต้องตอบให้ได้:
1. มี note นี้อยู่แล้วไหม? → ถ้ามี → แก้ของเดิม อย่าสร้างใหม่
2. note นี้ต้องการ Boss approve ไหม? 
   → ถ้า type=safety หรือ granularity=universal → YES เสมอ
   → ถ้า confidence ≥ 0.8 → propose แล้วรอ approve
   → ถ้า confidence < 0.8 → draft ได้ แต่ต้อง label status: draft
```

---

## STEP 1 — เลือก Template

| ต้องการเขียนเรื่อง... | ใช้ type |
|----------------------|---------|
| ทำไมถึงตัดสินใจแบบนี้ | `adr` |
| ระบบ/โมดูลทำอะไร | `module` |
| ฟีเจอร์ทำงานยังไง | `feature` |
| อัลกอริทึม/logic | `algorithm` |
| ขั้นตอน/workflow | `protocol` |
| ข้อมูลในฐานข้อมูล | `entity` |
| สิ่งที่ต้องห้าม/guard | `safety` |
| บทเรียนจาก incident | `incident` |
| นิยามคำศัพท์ | `term` |

---

## STEP 2 — กรอก Epistemic Status (สำคัญที่สุด)

```
ถามตัวเองก่อนกรอก:

"ฉันรู้เรื่องนี้จากอะไร?"

→ จาก code/test จริง         → source_type: direct_experience
→ จาก ADR/spec/document      → source_type: external  
→ อนุมานจาก note อื่น        → source_type: inference
→ กฎรากฐานที่ไม่เปลี่ยน       → source_type: axiom

"ฉันมั่นใจแค่ไหน?"
→ เห็นใน production           → confidence: 1.0
→ ผ่าน test แล้ว              → confidence: 0.8
→ design แต่ยัง implement     → confidence: 0.6
→ คาดเดา/อ้างอิงทางอ้อม       → confidence: 0.4
→ ไม่แน่ใจเลย                → ห้ามเขียน assert, ถาม Boss แทน
```

### กฎเหล็ก Epistemic:
- **ห้าม** เขียน confidence > 0.7 ถ้า source_type เป็น inference
- **ต้อง** ใส่ note ใน `epistemic.contradictions` ถ้าพบข้อมูลขัดแย้งในระบบ
- **ต้อง** update note อีกฝั่งด้วยถ้าเพิ่ม contradicts

---

## STEP 3 — ประกาศ Crosslinks (แทน CrosslinkManager.py)

```
สำหรับทุก note ที่ reference ถาม:

"note นี้ implement ADR/กฎไหน?"     → crosslinks.implements
"note ไหน depend on note นี้?"       → crosslinks.used_by  
"note นี้อ้างถึงอะไรแต่ไม่ depend?"  → crosslinks.references
"safety rule ไหนบังคับใช้?"          → crosslinks.guards
"มี note ไหนขัดแย้ง?"               → crosslinks.contradicts
```

### กฎ Crosslink:
1. ทุก `crosslinks.guards` ต้องเป็น note ใน `07_safety/`
2. ถ้าเพิ่ม `used_by: [[feat-A]]` → ต้องไปที่ `feat-A` แล้วเพิ่ม `references: [[note-นี้]]` ด้วย
3. `contradicts` เป็น bidirectional เสมอ — update ทั้งสองฝั่ง

---

## STEP 4 — กำหนด Context Anchor

```
"ข้อมูลนี้หมดอายุได้ไหม?"
→ ไม่มีวันหมด (เช่น ADR, safety rule)  → duration: permanent
→ มีวันสิ้นสุด (เช่น feature ที่จะถูกแทน) → duration: temporary + valid_until
→ valid เฉพาะเงื่อนไข (เช่น feature flag) → duration: conditional

"มี note ใหม่กว่าแทนอันนี้แล้วไหม?"
→ ถ้าใช่ → ใส่ superseded_by + เปลี่ยน status: deprecated
```

---

## STEP 5 — Self-Validation Checklist

ก่อน save ต้อง check ทุกข้อ:

```
[ ] summary < 200 chars และ falsifiable (ไม่ใช่แค่ชื่อ)
[ ] granularity สอดคล้องกับขอบเขตเนื้อหาจริง
[ ] epistemic.confidence สอดคล้องกับ source_type
[ ] ทุก crosslinks reference มี [[wikilink]] format
[ ] ทุก note ที่ listed ใน used_by/crosslinks มีอยู่จริง
    → ถ้ายังไม่มี → สร้าง stub ก่อน (status: stub)
[ ] touch_points ระบุ path จริง ไม่ใช่ path สมมติ
[ ] ถ้า status: stable → confidence ต้องไม่ < 0.6
```

---

## WHEN TO ESCALATE TO BOSS

```
ต้อง propose แล้วรอ Boss approve ถ้า:
✗ เปลี่ยน granularity: universal หรือ safety type ใดก็ตาม
✗ เพิ่ม contradicts กับ note ที่ status: stable
✗ เปลี่ยน context_anchor.duration จาก permanent เป็น deprecated
✗ confidence ลดลงจากเดิม (ข้อมูลใหม่ขัดแย้ง)
```

---

## ตัวอย่าง — Note ที่ถูกต้อง

```yaml
---
id: algo--fefo-stock-deduction
type: algorithm
module: kitchen
status: stable
summary: "Deduct ingredient stock from lots sorted by expiresAt ASC; flags expired lots before deducting"
granularity: specific

epistemic:
  confidence: 0.95
  source_type: direct_experience   # verified in orderRepo.js + test
  contradictions: []

context_anchor:
  duration: permanent
  valid_until: null
  superseded_by: null

crosslinks:
  implements:
    - "[[ADR-033--identity-resolution]]"
  used_by:
    - "[[FEAT--pos-onsite]]"
  references:
    - "[[entity--ingredient-lot]]"
    - "[[entity--ingredient]]"
  guards:
    - "[[SAFETY--tenant-isolation]]"
  contradicts: []

touch_points:
  - "src/lib/repositories/orderRepo.js::deductIngredientFEFO"
---
```

---

*Protocol v2 — ported from MSP v9.6.4 Write Policy + Schema Validator*
*Single Writer Rule ยังใช้: Boss เป็น final authority ของทุก stable note*
