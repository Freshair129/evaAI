---
id: "DEV_TOOLS"
type: "knowledge"
status: "stub"
epistemic:
  confidence: 0.9
  source_type: "direct_experience"
context_anchor:
  duration: "universal"
summary: "คู่มือเครื่องมือพัฒนาและสคริปต์อัตโนมัติของ Zuri (Stub)"
---
# [DEV_TOOLS] Developer Tooling & Scripts

## 1. Local Development
- **Start Env:** `npm run dev`
- **Database:** Supabase Local / Remote (Check `.env`)
- **Prisma:** `npx prisma generate`, `npx prisma studio`

## 2. Automation Scripts (`/scripts`)
- `zdev.mjs`: เครื่องมือจัดการการพัฒนาหลัก
- `check-edge-safe.js`: ตรวจสอบความพร้อมของ Code สำหรับ Vercel Edge
- `migrate-*.js`: สคริปต์สำหรับการย้ายข้อมูลและ Database

## 3. Testing
- **Vitest:** `npm run test`
- **Playwright:** `npx playwright test`
