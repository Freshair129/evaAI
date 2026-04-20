# Created At: {YYYY-MM-DD HH:mm:ss} +07:00 (v1.0.0)
# Previous version: —
# Last Updated: {YYYY-MM-DD HH:mm:ss} +07:00 (v1.0.0)

**Type**: IMP
**Status**: `{DRAFT | PLAN_REVIEW | APPROVED | WIP | DONE | ARCHIVED}`
**Complexity**: `{S | M | L | XL}`
**Linear**: [{ZUR-X}](https://linear.app/zuri10/issue/zur-X)
**Agent**: {EVA-AGT-[CODENAME]-[PLATFORM]}
**Plan Approval**: `{REQUIRED | NOT_REQUIRED | APPROVED | REJECTED}`

| **Agent ID** | {EVA-AGT-[CODENAME]-[PLATFORM]} |
| **Model**    | {claude-opus-4-6 / claude-sonnet-4-6} |
| **Platform** | {Claude Code / Claude Cowork / Desktop} |

# Implementation Plan: {Title} ({EVA-IMP-XXXX})

---

## Plan Approval Protocol

> **Rule:** L/XL complexity plans MUST be approved before any code is written.
> S/M plans may skip approval (auto-approve) unless they touch critical files.

### When Plan Approval is REQUIRED

| Condition | Why |
|---|---|
| Complexity = L or XL | High risk — many files, many decisions |
| Touches `prisma/schema.prisma` | Schema changes = migration risk |
| Touches `src/middleware.js` | Edge runtime — production crash risk (INC-003/004) |
| Touches auth/permission files | Security — wrong change = data leak |
| New external service integration | Vendor lock-in, cost implications |
| Cross-module changes (>2 modules) | Blast radius too large for one agent |

### Approval Criteria (Lead evaluates against these)

```
APPROVE if ALL true:
  ☐ Boundary clearly defined (no scope creep)
  ☐ Every file to modify is listed in Proposed Changes
  ☐ API Contracts have request/response shapes (if API work)
  ☐ Schema changes have exact Prisma definitions (if DB work)
  ☐ Rollback plan exists for risky changes
  ☐ No file conflicts with other WIP tasks
  ☐ Task Breakdown has correct dependency order

REJECT if ANY true:
  ✗ Modifies DB schema without migration plan
  ✗ Missing rollback plan for critical files
  ✗ File conflict with another agent's WIP task
  ✗ Scope exceeds spec boundary
  ✗ Missing error handling for known gotchas from spec
```

### Status Flow

```
Agent creates IMP → Status: DRAFT
                         │
                         ▼
                   ┌───────────┐
                   │PLAN_REVIEW│  Agent submits for approval
                   └─────┬─────┘
                         │
                   Lead evaluates
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        ┌───────��──┐         ┌──────────┐
        │ APPROVED │         │ REJECTED │
        │→ proceed │         │+ feedback│
        └────┬─────┘         └────┬─────┘
             │                    │
             ▼                    └──▶ Agent revises → PLAN_REVIEW again
        ┌──────────┐
        │   WIP    │  Create TSKs from Task Breakdown → start coding
        └────┬─────┘
             ▼
        ┌──────────┐
        │   DONE   │  All TSKs complete + verification done
        └──────────┘
```

### Rejection Feedback Log
<!-- If plan was rejected, record why so agent doesn't repeat mistakes. -->

| Round | Rejected by | Reason | Fixed in |
|---|---|---|---|
| {1} | {Lead / Boss} | {what was wrong} | {v1.1.0} |

## Related Documents, Boundary & Dependencies

### Related Documents
| Document | Path | Role |
|---|---|---|
| Feature Spec | `docs/product/specs/{FEAT-XX}.md` | Requirements source |
| ADR | `docs/decisions/adrs/{ADR-NNN}.md` | Architecture decision |
| Module Manifest | `docs/product/module-manifests/{module}.yaml` | Code ownership |
| Feature Brief | `docs/product/{BRIEF-XX}.md` | Original request |

### Boundary
| In Scope | Out of Scope |
|---|---|
| {exactly what this IMP covers} | {what it does NOT cover} |

### Dependencies
| Dependency | Type | Notes |
|---|---|---|
| {prerequisite} | `Blocker / Internal / Downstream` | {detail} |

---

## Objective

{One sentence: "Implement [what] so that [who] can [do what]."}

---

## Proposed Changes

<!-- Group by area. Each file: [NEW] or [MODIFY] + link + description.
     This is the format already used in Zuri devlog — proven to work. -->

### 1. {Area — e.g., Schema / Database}

#### [NEW] [{filename}](file:///path/to/file)
- {What this file does}
- {Key details}

#### [MODIFY] [{filename}](file:///path/to/file)
- {What changes and why}

### 2. {Area — e.g., Backend / API}

#### [NEW] [{route.js}](file:///path/to/file)
- {Endpoint: METHOD /api/path}
- {Auth: can(roles, domain, action)}
- {Request shape: { field: type }}
- {Response shape: { field: type }}
- {Errors: 400/401/403/404/409}

#### [MODIFY] [{existing-file.js}](file:///path/to/file)
- {What changes}

### 3. {Area — e.g., Frontend / UI}

#### [NEW] [{Component.js}](file:///path/to/file)
- {Props: { prop: type }}
- {State: { state: type }}
- {Behavior: what it does}

#### [MODIFY] [{page.js}](file:///path/to/file)
- {What changes}

### 4. {Area — e.g., Infrastructure / Config}

#### [MODIFY] [{config-file}](file:///path/to/file)
- {What changes}

---

## API Contracts (if applicable)

<!-- Detailed request/response shapes for each new endpoint.
     Skip this section for non-API changes. -->

### `{METHOD} /api/{path}`

**Auth:** `can(roles, '{domain}', '{action}')`

**Request:**
```json
{
  "{field}": "{type} — {description}"
}
```

**Response 200:**
```json
{
  "{field}": "{type}"
}
```

**Errors:**
| Status | Condition | Body |
|---|---|---|
| 400 | {invalid input} | `{ error: "{message}" }` |
| 403 | {forbidden} | `{ error: "Forbidden" }` |

---

## Schema Changes (if applicable)

<!-- Exact Prisma model definitions. Copy-paste into schema.prisma. -->

```prisma
model {ModelName} {
  id            String   @id @default(cuid())
  tenantId      String
  {field}       {Type}   {constraints}
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  tenant        Tenant   @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
}
```

**Migration notes:** {any special considerations}

---

## Validation Rules (if applicable)

| Field | Type | Required | Constraints | Error Message |
|---|---|---|---|---|
| `{name}` | string | Yes | min 1, max 100 | "{message}" |
| `{phone}` | string | Yes | E.164 | "{message}" |

---

## Error Handling

| Scenario | Where | Action | User sees |
|---|---|---|---|
| {error case} | {file/function} | {what to do} | "{message}" |

---

## Task Breakdown

<!-- Each task becomes a TSK in devlog/tasks/. Ordered by dependency. -->

| # | Task | Files | Depends On | Complexity |
|---|---|---|---|---|
| 1 | {Schema changes} | `schema.prisma` | — | S |
| 2 | {Repository layer} | `{repo}.js` | Task 1 | S |
| 3 | {API routes} | `api/{path}/route.js` | Task 2 | M |
| 4 | {UI components} | `{Component}.js`, `page.js` | Task 3 | M |
| 5 | {Integration + test} | varies | Task 4 | S |

---

## Verification Plan

### Automated
- {npm test / specific test command}
- {Prisma validate}

### Manual
- {Deploy to Vercel → verify URL}
- {Test happy path: step 1 → step 2 → expected result}
- {Test error case: do X → expect Y}
- {Test permissions: role Z tries action → 403}

---

## Rollback Plan

| If this fails | Undo action |
|---|---|
| {Schema migration breaks} | {Revert schema + prisma db push} |
| {API returns wrong data} | {Revert commit, redeploy} |

---

## Pre-Code Checklist

<!-- Agent checks ALL boxes before writing the first line of code. -->
<!-- For S/M complexity: not all sections need to be filled — use judgment. -->
<!-- For L/XL complexity: ALL sections must be filled. -->

- [ ] Proposed Changes lists every file to create/modify
- [ ] API Contracts have request + response shapes (if API work)
- [ ] Schema Changes have exact Prisma definitions (if DB work)
- [ ] Validation rules defined for user input fields
- [ ] Error handling covers known gotchas from spec
- [ ] Task Breakdown has ordered steps with dependencies
- [ ] Boundary clearly defines what is NOT in this IMP
- [ ] Module Manifest updated with new models/routes/components

**All checked → START CODING**
