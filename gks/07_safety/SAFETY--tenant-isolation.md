---
id: SAFETY--tenant-isolation
type: safety
module: core
status: enforced
summary: "กฎการแยกข้อมูล (Isolation Rules) เพื่อป้องกันการรั่วไหลของข้อมูลข้าม Tenant"
tags: [safety, security, multi-tenant]
created_at: 2026-04-13
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Safety: Multi-Tenant Isolation Rules

## 1. The Guard (G-U-A-R-D)
ข้อมูลลูกค้าจาก Tenant A **จะต้องไม่ถูกดึงหรือแก้ไข** โดย Tenant B ในระดับ SQL Query และ Application Logic

### Isolation Groups
- **Group A (Isolated):** ตารางเหล่านี้ต้องมี `tenant_id` และบังคับ RLS เสมอ:
    - Customer, Order, PosTable, Enrollment, Ingredient, Task, AuditLog
- **Group B (Global):** ข้อมูลส่วนกลางที่ใช้ร่วมกันได้:
    - Tenant, MarketPrice, SystemConfig

## 2. Enforcement Method
1. **Prisma Middleware**: ฉีด `tenantId` เข้าไปในทุก query (create, find, update, delete) อัตโนมัติ (Automated)
2. **Supabase RLS**: ควบคุมการเข้าถึงข้อมูลระดับ DB (Defense in Depth)
3. **Session Padding**: `tenantId` ต้องฝังอยู่ใน NextAuth JWT เสมอ

