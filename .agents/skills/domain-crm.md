# Skill: Domain Expert — CRM & Customer

> Trigger: ทำงานเกี่ยวกับ Customer, Profile, Lifecycle, Identity, Loyalty
> Purpose: โหลด domain context สำหรับ CRM module

## Context to Load

```
Read docs/gotchas/database-identity.md    # G-DB-01 to G-DB-07
Read docs/gotchas/multi-tenant.md         # G-MT-01 to G-MT-04
```

## Key Rules

### Identity Resolution (ADR-025)
- Phone = merge key → normalize E.164 (+66XXXXXXXXX) before store
- Customer can have: facebookId + lineId + phonePrimary (all on same record)
- Upsert by phone → merge IDs into single Customer record
- Edge case: family shared phone → need manual override

### Customer ID Format
```
TVS-CUS-{channel}-{YYMM}-{SERIAL:04d}
Channel: FB, LINE, WEB, WALK
Example: TVS-CUS-FB-2603-0042
```

### Lifecycle Stages
```
LEAD → PROSPECT → CUSTOMER → VIP → CHURNED
```

### Loyalty (system_config.yaml)
- VP Rate: ฿1 = 1 VP
- Tiers: MEMBER (0) → SILVER (5000) → GOLD (20000) → PLATINUM (50000)
- Tier calculated from totalSpend, not VP balance

### Customer Profile (AI Inferred)
- `CustomerProfile` = AI-inferred demographics
- Merge logic: ห้ามเขียนทับ existing value ด้วย `null` หรือ `"UNKNOWN"` (G-DB ของ customerProfileRepo)
- inferenceCount tracks how many times AI profiled

### Multi-Tenant (ADR-056)
- ทุก query ต้องมี `WHERE tenantId = ?`
- ถ้าลืม = cross-tenant data leak 🔴

## Checklist Before Commit
- [ ] tenantId in every query WHERE clause
- [ ] Phone normalized to E.164 before upsert
- [ ] $transaction for identity merge
- [ ] Profile upsert ไม่เขียนทับ non-UNKNOWN values
- [ ] Customer ID follows id_standards.yaml format
