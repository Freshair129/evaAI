---
id: "api--core"
type: "api"
module: "MOD-CORE"
status: "stable"
version: "1.1.0"
summary: "API specs สำหรับ Core Infrastructure — Tenant, Auth, Settings, Team Management, Ownership Transfer"
granularity: "general"

epistemic:
  confidence: 0.95
  source_type: "direct_experience"
  contradictions: []

context_anchor:
  duration: "permanent"
  valid_until: null
  superseded_by: null

crosslinks:
  implements: ["[[FEAT-001_MultiTenant]]", "[[FEAT-025_OwnershipTransfer]]"]
  used_by: ["[[api--crm]]", "[[api--inbox]]", "[[api--pos]]"]
  references: ["[[entity--tenant]]", "[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]"]
  contradicts: []

touch_points:
  - "src/app/api/tenants/route.js"
  - "src/app/api/tenant/config/route.js"
  - "src/app/api/auth/[...nextauth]/route.js"
  - "src/app/api/team/invite/route.js"
  - "src/app/api/team/join/route.js"
  - "src/app/api/settings/ownership/route.js"
  - "src/app/api/settings/ownership/verify/route.js"
  - "src/app/api/permissions/route.js"
  - "src/lib/tenant.js"
  - "src/lib/auth.test.js"

owner: "@architect"
tags: [core, tenant, auth, team, ownership]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — Core Infrastructure

## 1. Tenant Management

### `GET /api/tenants`
> **⚠️ DEV/SYSTEM ONLY** — ไม่ expose ใน production UI

| | |
|---|---|
| **Auth** | `withAuth(domain:'system', action:'F')` — System admin only |
| **Returns** | `{ data: Tenant[] }` |

```
Response: { data: [{ id, tenantSlug, tenantName, plan, isActive, createdAt }] }
```

---

### `POST /api/tenants`
> สร้าง Tenant ใหม่ (provisioning)

| | |
|---|---|
| **Auth** | System admin |
| **Body** | `{ tenantName: string, tenantSlug: string, plan?: string }` |
| **Returns** | `201 { data: Tenant }` |
| **Errors** | `400` slug ซ้ำ, `500` DB error |

---

### `GET /api/tenant/config`
> Public branding config — ใช้ render หน้า login/join

| | |
|---|---|
| **Auth** | Public (no auth required) |
| **Query** | `tenantSlug: string` |
| **Returns** | `{ data: { brandColor, logoUrl, tenantName, vatRate, currency, timezone } }` |
| **Cache** | Redis — `tenant:config:{tenantSlug}` — 300s TTL |

---

### `PATCH /api/tenant/config`
> อัพเดท branding และ config ของ Tenant

| | |
|---|---|
| **Auth** | `withAuth(domain:'tenant', action:'W')` — OWNER/ADM only |
| **Body** | `{ brandColor?, logoUrl?, vatRate?, currency?, timezone? }` |
| **Returns** | `{ data: updated }` |
| **Side Effects** | Redis cache bust |

---

## 2. Authentication

### `GET|POST /api/auth/[...nextauth]`
> NextAuth.js handler — session management

| | |
|---|---|
| **Auth** | NextAuth (credentials provider) |
| **Provider** | Email + Password via `authOptions` |
| **Session** | JWT stored in httpOnly cookie |
| **Note** | ดู `src/lib/auth.test.js` สำหรับ session shape |

---

## 3. Team Management & Invitations

### `POST /api/team/invite`
> สร้าง invitation token และส่ง email

| | |
|---|---|
| **Auth** | `can(roles, 'team', 'A')` — OWNER/ADM |
| **Body** | `{ email: string, role: 'ADM'\|'MGR'\|'STF'\|'SLS', name?: string }` |
| **Validation** | role ≠ 'OWNER', email ไม่ซ้ำใน tenant |
| **Returns** | `{ data: InvitationToken }` |
| **Side Effects** | ส่ง invite email + AuditLog |
| **Errors** | `403` ไม่มีสิทธิ์, `409` email ซ้ำ |

---

### `GET /api/team/invite/{token}/validate`
> ตรวจ token ก่อน join (public page)

| | |
|---|---|
| **Auth** | Public |
| **Returns** | `{ valid: boolean, email, role, tenantName }` |

---

### `POST /api/team/join`
> Complete signup ด้วย token

| | |
|---|---|
| **Auth** | Public + valid token |
| **Body** | `{ token: string, password: string, name: string }` |
| **Returns** | `{ data: Employee }` |
| **Side Effects** | Token marked as used (1-use only), Session created |

---

### `GET /api/team/invitations`
> List pending invitations

| | |
|---|---|
| **Auth** | OWNER/ADM |
| **Returns** | `{ data: InvitationToken[] }` (unused + not expired) |

---

### `DELETE /api/team/invite/{token}`
> Revoke invitation

| | |
|---|---|
| **Auth** | OWNER/ADM |
| **Returns** | `{ success: true }` |

---

## 4. Ownership Transfer

### `GET /api/settings/ownership`
> ดูสถานะ current OWNER และผู้มีสิทธิ์รับ

| | |
|---|---|
| **Auth** | `can(roles, 'ownership', 'R')` — OWNER only |
| **Returns** | `{ pendingRequest: OwnershipTransferRequest?, eligibleRecipients: Employee[] }` |
| **Note** | eligibleRecipients = employees ที่มี role=ADM |

---

### `POST /api/settings/ownership`
> เริ่มกระบวนการโอน — สร้าง 6-digit OTP และส่ง email

| | |
|---|---|
| **Auth** | `can(roles, 'ownership', 'F')` — OWNER only |
| **Body** | `{ toEmployeeId: uuid }` |
| **Validation** | toEmployee ต้องมี role=ADM และ status=ACTIVE |
| **Side Effects** | OTP hash เก็บใน OwnershipTransferRequest (15m TTL), email ถูกส่ง |
| **Returns** | `{ data: OwnershipTransferRequest }` |

---

### `POST /api/settings/ownership/verify`
> ยืนยัน OTP → atomic role swap

| | |
|---|---|
| **Auth** | OWNER only |
| **Body** | `{ otp: string }` |
| **Transaction** | `prisma.$transaction`: fromEmployee.role→ADM, toEmployee.role→OWNER, Tenant.ownerEmployeeId update |
| **Side Effects** | Invalidate both sessions, SystemAuditLog: OWNERSHIP_TRANSFERRED |
| **Returns** | `{ success: true }` |
| **Errors** | `400` OTP ผิด/หมดอายุ, `403` ไม่มีสิทธิ์ |

---

### `DELETE /api/settings/ownership`
> ยกเลิก pending transfer

| | |
|---|---|
| **Auth** | OWNER only |
| **Returns** | `{ success: true }` |

---

## 5. Permissions

### `GET /api/permissions`
> ดึง permission matrix ของ tenant

| | |
|---|---|
| **Auth** | `withAuth` (any authenticated user) |
| **Returns** | `{ data: PermissionMatrix }` |
| **Note** | TODO: รองรับ tenant-level override ใน v2 |

---

## 6. Security Notes

> ทุก endpoint ใน module นี้ต้องผ่าน [[SAFETY--tenant-isolation]]

- **tenantId injection:** ทำผ่าน `withAuth()` wrapper — ไม่ accept จาก client
- **Role hierarchy:** OWNER > ADM > MGR > STF/SLS
- **OTP security:** bcrypt cost 12, 15m TTL, max 3 attempts
- **Invitation token:** 1-use, 7-day TTL, invalidated on use
- **Audit logging:** การ transfer ownership และ invite ทุกครั้งถูก log ใน SystemAuditLog
