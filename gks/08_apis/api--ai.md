---
id: "api--ai"
type: "api"
module: "MOD-AI"
status: "stable"
version: "1.2.0"
summary: "API specs สำหรับ AI — NL2SQL Assistant, Compose Reply, Ask AI, CRM Insights, AskMarketing, Agent Pipeline"
granularity: "general"

epistemic:
  confidence: 0.9
  source_type: "direct_experience"
  contradictions: []

context_anchor:
  duration: "permanent"
  valid_until: null
  superseded_by: null

crosslinks:
  implements: ["[[FEAT-011_AIAssistant]]", "[[FEAT-017_LINEAgentMode]]", "[[FEAT-018_InboxAIPanel]]", "[[FEAT-019_CRMAIInsights]]", "[[FEAT-020_AskMarketing]]"]
  used_by: ["[[api--inbox]]", "[[api--crm]]", "[[api--marketing]]"]
  references: ["[[ALGO--nl2sql]]", "[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]"]
  contradicts: []

touch_points:
  - "src/app/api/ai/assistant/route.js"
  - "src/app/api/ai/ask/route.js"
  - "src/app/api/ai/ask-marketing/route.js"
  - "src/app/api/ai/compose-reply/route.js"
  - "src/app/api/ai/agent-mode/toggle/route.js"
  - "src/app/api/ai/sales-closer/route.js"
  - "src/app/api/ai/sales-closer/approve/route.js"
  - "src/app/api/ai/promo-advisor/route.js"
  - "src/app/api/ai/sentiment-dashboard/route.js"
  - "src/app/api/ai/crm-followup-draft/route.js"
  - "src/lib/ai/assistant.js"
  - "src/lib/ai/gemini.js"
  - "src/lib/ai/assistantIntent.js"

owner: "@architect"
tags: [ai, gemini, nl2sql, assistant, sse, agent]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — AI

> **LLM:** Gemini 2.0 Flash (ทุก endpoint)  
> **Streaming:** SSE (Server-Sent Events) — token-by-token rendering  
> **Safety:** RBAC enforced — AI ไม่สามารถ query ข้าม tenant ได้ (ดู [[ALGO--nl2sql]])

---

## 1. AI Assistant (NL2SQL)

### `POST /api/ai/assistant`
> Natural Language → SQL Query → structured result

```
Flow: User question → Intent classification → SQL generation → Execute (tenantId scoped) → Format result
```

| | |
|---|---|
| **Auth** | `withAuth` — MGR/ADM (STF restricted) |
| **Body** | `{ question: string, history?: ChatMessage[] }` |
| **Returns** | SSE stream: `{ type: 'thinking'\|'sql'\|'result'\|'error', content }` |
| **RBAC** | SQL query ต้องผ่าน whitelist tables + tenantId scope |
| **Confirm** | Destructive queries (UPDATE/DELETE) ต้องได้รับ confirm ก่อน |

---

### `POST /api/ai/confirm`
> ยืนยัน pending AI action (destructive operation)

| | |
|---|---|
| **Auth** | `withAuth` — MGR/ADM |
| **Body** | `{ pendingId: string, confirm: boolean }` |
| **Returns** | `{ data: ExecutionResult }` |

---

### `POST /api/ai/ask`
> General Ask AI — ถามเกี่ยวกับ customer/business data (SSE)

| | |
|---|---|
| **Auth** | `withAuth` — SLS/STF/MGR/ADM |
| **Body** | `{ question: string, conversationId?: uuid, history?: ChatMessage[] }` |
| **Context** | Customer profile, last 10 messages (ถ้ามี conversationId) |
| **Returns** | SSE stream of text tokens |

---

## 2. Inbox AI Panel

### `POST /api/ai/compose-reply`
> Transform staff draft → polished customer message

| | |
|---|---|
| **Auth** | `withAuth` |
| **Body** | `{ draft: string, tone: 'formal'\|'casual'\|'professional'\|'empathetic', conversationId: uuid }` |
| **Context** | customerName, channel, lastMessageSnippet |
| **Returns** | `{ polished: string }` (non-streaming) |

---

## 3. Agent Mode (LINE Auto-Reply)

### `POST /api/ai/agent-mode/toggle`
> สลับ Agent Mode ↔ Human Mode

| | |
|---|---|
| **Auth** | SLS/STF/MGR |
| **Body** | `{ conversationId: uuid, mode: 'AGENT'\|'HUMAN' }` |
| **Returns** | `{ conversationId, agentMode }` |

---

### `POST /api/ai/agent-process` *(QStash Internal)*
> Process LINE message + AI reply

| | |
|---|---|
| **Auth** | QStash signature |
| **Body** | `{ conversationId, messageId, webhookPayload }` |
| **Pipeline** | buildContext → Gemini Flash → escalation check → LINE reply |

---

## 4. CRM AI

### `POST /api/ai/crm-followup-draft`
> Draft follow-up message สำหรับ warm/at-risk customers (SSE)

| | |
|---|---|
| **Auth** | `withAuth` |
| **Body** | `{ customerId: uuid, context: 'warm_lead'\|'at_risk' }` |
| **Returns** | SSE stream (LINE/FB ready message draft) |

---

## 5. Marketing AI

### `POST /api/ai/ask-marketing`
> Conversational ads intelligence (SSE)

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ question: string, history?: ChatMessage[], dateRange: { from, to } }` |
| **Intent Types** | DIAGNOSE, RANK, BUDGET, ALERT, EXPLAIN |
| **Returns** | SSE stream — text + optional `action_cards[]` |

---

### `POST /api/ai/campaign-draft`
> AI drafts broadcast message template (SSE)

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Body** | `{ intent: string, channel: 'LINE'\|'FB', segmentDescription: string }` |
| **Returns** | SSE stream |

---

## 6. Sales Intelligence

### `POST /api/ai/sales-closer`
> AI-assisted sales closing draft

| | |
|---|---|
| **Auth** | SLS/STF/MGR |
| **Body** | `{ conversationId: uuid, objection?: string }` |
| **Returns** | `{ draft: string, strategy: string }` |

---

### `POST /api/ai/sales-closer/approve`
> Approve sales closer suggestion → send message

| | |
|---|---|
| **Auth** | SLS/STF/MGR |
| **Body** | `{ conversationId: uuid, message: string }` |

---

### `POST /api/ai/promo-advisor`
> AI recommends promotional offer for customer

| | |
|---|---|
| **Auth** | SLS/MGR |
| **Body** | `{ customerId: uuid }` |
| **Returns** | `{ recommendation: string, offer: object }` |

---

### `GET /api/ai/sentiment-dashboard`
> Sentiment analysis overview ทั้ง tenant

| | |
|---|---|
| **Auth** | MGR/ADM |
| **Query** | `{ dateFrom, dateTo }` |
| **Returns** | `{ data: SentimentSummary }` |

---

## 7. Workers (QStash)

### `POST /api/workers/crm-enrich`
> Enrich + score single customer

| | |
|---|---|
| **Auth** | QStash signature |
| **Body** | `{ customerId: uuid, conversationId: uuid }` |

---

### `POST /api/workers/crm-pattern`
> Daily cross-customer pattern analysis (02:00 ICT)

| | |
|---|---|
| **Auth** | QStash signature |

---

### `POST /api/workers/auto-tag`
> Auto-tag customers based on conversation content

| | |
|---|---|
| **Auth** | QStash signature |

---

## 8. Rate Limits & Safety

| Endpoint Group | Rate Limit | Auth Level |
|---------------|-----------|-----------|
| `/api/ai/assistant` | 30 req/hr per user | MGR/ADM |
| `/api/ai/ask` | 60 req/hr per user | All roles |
| `/api/ai/compose-reply` | 120 req/hr per user | All roles |
| `/api/ai/ask-marketing` | 30 req/hr per user | MGR/ADM |
| Workers | No limit (QStash controlled) | System only |
