# Tech Stack — {Project Name}
> Agent: read this before suggesting any library, framework, or service.
> Rule: Don't add dependencies not listed here without ADR approval.

**Version:** {X.Y.Z}
**Date:** {YYYY-MM-DD}

---

## Runtime & Framework

| Layer | Choice | Version | Why chosen |
|---|---|---|---|
| **Language** | {JavaScript/TypeScript/Python} | {version} | {reason} |
| **Framework** | {Next.js/Express/FastAPI} | {version} | {reason} |
| **Runtime** | {Node.js/Bun/Deno} | {version} | {reason} |
| **Package Manager** | {npm/pnpm/yarn} | {version} | — |

---

## Data Layer

| Layer | Choice | Provider | Why chosen |
|---|---|---|---|
| **Database** | {PostgreSQL/MySQL/MongoDB} | {Supabase/AWS RDS/Atlas} | {reason} |
| **ORM** | {Prisma/Drizzle/TypeORM} | — | {reason} |
| **Cache** | {Redis/Upstash/Memcached} | {provider} | {reason} |
| **Queue** | {BullMQ/QStash/SQS} | {provider} | {reason} |
| **Object Storage** | {S3/Supabase Storage/GCS} | {provider} | {reason} |

---

## Infrastructure

| Layer | Choice | Why chosen |
|---|---|---|
| **Hosting** | {Vercel/AWS/GCP} | {reason} |
| **CI/CD** | {GitHub Actions/Vercel auto-deploy} | {reason} |
| **DNS** | {Cloudflare/Route53} | {reason} |
| **Monitoring** | {Vercel Analytics/Sentry/Datadog} | {reason} |
| **Secrets** | {Doppler/Vercel Env/AWS Secrets Manager} | {reason} |

---

## Auth & Security

| Layer | Choice | Why chosen |
|---|---|---|
| **Auth Provider** | {NextAuth/Clerk/Auth0} | {reason} |
| **Strategy** | {JWT/Session/OAuth} | {reason} |
| **Password** | {bcrypt/argon2} | {reason} |
| **RBAC** | {custom permissionMatrix / Casbin} | {reason} |

---

## AI & ML

| Layer | Choice | Why chosen |
|---|---|---|
| **LLM Provider** | {Gemini/OpenAI/Anthropic} | {reason} |
| **Model** | {model ID} | {reason} |
| **Use cases** | {compose-reply, NL2SQL, OCR, etc.} | — |
| **SDK** | {@google/generative-ai / openai} | — |

---

## Frontend

| Layer | Choice | Why chosen |
|---|---|---|
| **Styling** | {Tailwind CSS/styled-components} | {reason} |
| **Components** | {shadcn/ui / Radix / MUI} | {reason} |
| **Animation** | {Framer Motion / CSS transitions} | {reason} |
| **Icons** | {Lucide / Heroicons} | {reason} |
| **Charts** | {Recharts / D3 / Chart.js} | {reason} |
| **Realtime** | {Pusher / Socket.io / SSE} | {reason} |

---

## External Services

| Service | Purpose | Tier / Cost |
|---|---|---|
| {service} | {what it does} | {free/paid — monthly cost} |

---

## Constraints

<!-- Hard rules that agents must follow. -->

- {e.g., "NO TypeScript except db.ts"}
- {e.g., "No new npm packages without ADR"}
- {e.g., "Thai-first: all user-facing text in Thai"}

---

## Upgrade Path

<!-- Planned migrations or version upgrades. -->

| Current | Target | When | ADR |
|---|---|---|---|
| {lib v1} | {lib v2} | {timeline} | {ADR-NNN if exists} |
