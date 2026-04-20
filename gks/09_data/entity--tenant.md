---
id: entity--tenant
type: data_entity
module: core
status: stable
summary: "Data model ของ Tenant (บริษัท/เจ้าของธุรกิจ) และการตั้งค่าพื้นฐาน"
tags: [data, schema, tenant]
created_at: 2026-04-13
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Entity: Tenant

## 1. Schema (Prisma)
```prisma
model Tenant {
  id          String   @id @default(uuid())
  tenantSlug  String   @unique @map("tenant_slug")
  tenantName  String   @map("tenant_name")
  isActive    Boolean  @default(true) @map("is_active")
  plan        String   @default("STARTER")

  // Per-tenant Integrations
  fbPageId          String?  @map("fb_page_id")
  fbPageToken       String?  @map("fb_page_token")
  lineOaId          String?  @map("line_oa_id")
  lineChannelToken  String?  @map("line_channel_token")

  // Per-tenant Config
  config      Json     @default("{}") @map("config")
  // { vatRate, currency, timezone, brandColor, logoUrl }

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
}
```

## 2. Relations
- **1 : N** with `User`
- **1 : N** with `Customer`
- **1 : N** with `Order`

