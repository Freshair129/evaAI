# Skill: Domain Expert — Infrastructure

> Trigger: ทำงานเกี่ยวกับ DB, Redis, QStash, Pusher, Auth, Middleware, Deployment
> Purpose: โหลด domain context สำหรับ Infrastructure

## Context to Load

```
Read docs/gotchas/webhook-serverless.md   # G-WH-03 to G-WH-06
Read docs/gotchas/multi-tenant.md         # G-MT-01 to G-MT-04
Read docs/gotchas/dev-process.md          # G-DEV-01
```

## Architecture Stack

| Layer | Tech | Config |
|-------|------|--------|
| Framework | Next.js 14 App Router | next.config.js |
| DB | Supabase PostgreSQL + Prisma | prisma/schema.prisma |
| Cache | Upstash Redis (REST) | src/lib/redis.js |
| Queue | Upstash QStash | src/lib/qstash.js, vercel.json |
| Realtime | Pusher Channels | src/lib/pusher.js |
| Auth | NextAuth v4 (JWT + bcrypt) | src/lib/auth.js |
| AI | Gemini 2.0 Flash | /api/ai/* |
| Deploy | Vercel (serverless) | vercel.json |

## Key Rules

### Repository Pattern (MANDATORY)
```
API route → import repo → repo calls getPrisma()
```
- ห้าม `import { getPrisma } from '@/lib/db'` ใน API routes
- ทุก DB access ผ่าน `src/lib/repositories/` เท่านั้น

### Redis Cache
```javascript
import { getOrSet } from '@/lib/redis'
const data = await getOrSet('key', fetchFromDB, 300) // TTL 5 min
```
- Dashboard APIs ต้อง cache (NFR2: < 500ms)
- Fail-safe: ถ้า Redis ล่ม → fallback DB

### QStash
- Cron config ใน `vercel.json`
- Worker routes ต้อง verify signature
- throw error → QStash retry (NFR3: ≥ 5 times)
- Free tier: 500 msg/day

### Multi-Tenant Middleware
```
Priority: subdomain → JWT session → X-Tenant-Slug header → default vschool
Default: 10000000-0000-0000-0000-000000000001
```

### Auth
- JWT strategy (not database sessions)
- Session includes: employeeId, roles[], tenantId
- Roles UPPERCASE in DB (ADR-045)

## Checklist Before Commit
- [ ] No direct getPrisma() in API routes
- [ ] Redis cache on dashboard endpoints
- [ ] QStash signature verified on workers
- [ ] maxDuration set on long-running routes
- [ ] tenantId injected by middleware
- [ ] Roles checked via can(roles, domain, action)
