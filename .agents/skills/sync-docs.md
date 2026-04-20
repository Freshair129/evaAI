# Skill: Sync Documentation

> Trigger: หลัง implement feature หรือ /sync-docs
> Purpose: อัปเดต docs ให้ตรงกับ code

## Instructions

หลัง implement feature:

1. **อัปเดต Feature Spec:**
   ```
   docs/product/features/{name}.md
   → status: DRAFT → IMPLEMENTED
   → เพิ่ม actual API endpoints (ถ้าต่างจาก spec)
   → เพิ่ม gotchas ที่เจอระหว่าง implement
   ```

2. **อัปเดต Gotchas (ถ้าเจอใหม่):**
   ```
   docs/gotchas/{category}.md
   → เพิ่ม G-{CAT}-{NN}: {description}
   → รูปแบบ: เกิดอะไร → ป้องกัน → ADR อ้างอิง
   ```

3. **อัปเดต CONTEXT_INDEX.yaml (ถ้ามี doc ใหม่):**
   ```
   .dev/shared-context/CONTEXT_INDEX.yaml
   → เพิ่ม path ใน domain_context section ที่เกี่ยวข้อง
   ```

4. **Run sync-check:**
   ```bash
   node .dev/orchestrator/cli.js sync-check
   ```
   → ตรวจ: ADR frontmatter valid, feature specs มี status, CHANGELOG pointer ถูก

5. **Report:**
   ```
   ✅ Docs synced
   - Feature spec: IMPLEMENTED
   - Gotchas: +1 new (G-WH-07)
   - CONTEXT_INDEX: updated
   - sync-check: PASS
   ```

## Rules
- ทำทุกครั้งหลัง implement (ไม่ใช่แค่ major features)
- ถ้า schema เปลี่ยน → check prisma/schema.prisma ตรงกับ docs
- ถ้า API เปลี่ยน → check feature spec API table ตรง
