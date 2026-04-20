# Skill: Verify ADR Compliance

> Trigger: ก่อน commit code ที่เกี่ยวกับ ADR หรือ /verify-adr
> Purpose: ตรวจสอบว่า code ไม่ violate ADR rules

## Instructions

เมื่อ implement feature ที่มี ADR อ้างอิง:

1. **อ่าน ADR ที่เกี่ยวข้อง**
   ```
   Read docs/adr/ADR-{NNN}-*.md
   ```

2. **ตรวจ Code Violations:**

   ### ADR-024: Marketing Pipeline
   - [ ] Metrics aggregate bottom-up (Ad → AdSet → Campaign)
   - [ ] Derived metrics (ROAS, CPA) computed on-the-fly
   - [ ] Checksum tolerance ±1%

   ### ADR-025: Identity Resolution
   - [ ] Phone normalized E.164 before store
   - [ ] Upsert by phone (not find+create)
   - [ ] $transaction for identity merge

   ### ADR-031: Icons
   - [ ] Lucide React only (no FontAwesome)
   - [ ] Named imports: `import { Icon } from 'lucide-react'`

   ### ADR-040: Upstash
   - [ ] Redis: @upstash/redis (REST) not ioredis
   - [ ] Queue: QStash (HTTP) not BullMQ
   - [ ] No local Redis dependency

   ### ADR-045: RBAC
   - [ ] Roles UPPERCASE in DB
   - [ ] use `can(roles, domain, action)` from permissionMatrix
   - [ ] No hardcoded role checks (if role === 'admin')

   ### ADR-056: Multi-Tenant
   - [ ] tenantId in every query WHERE
   - [ ] Repo functions receive tenantId as first param

3. **Report:**
   ```
   ✅ ADR-024: Compliant
   ❌ ADR-031: FontAwesome import found in line 42
   ⚠️ ADR-056: tenantId missing in findByDate() query
   ```

## Rules
- ตรวจ source file จริง (Read tool) — ห้ามเดาจาก memory
- ถ้าพบ violation → แก้ก่อน commit
- ถ้าไม่แน่ใจว่า violate หรือไม่ → report เป็น ⚠️
