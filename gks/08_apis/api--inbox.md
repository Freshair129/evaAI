---
id: "api--inbox"
type: "api"
module: "MOD-INBOX"
status: "stable"
version: "1.1.0"
summary: "API specs สำหรับ Inbox — Conversations, Messages, Webhooks LINE/FB, Agent Mode Toggle, AI Reply"
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
  implements: ["[[FEAT-004_Inbox]]", "[[FEAT-017_LINEAgentMode]]", "[[FEAT-018_InboxAIPanel]]"]
  used_by: ["[[api--crm]]", "[[api--ai]]", "[[api--marketing]]"]
  references: ["[[entity--conversation]]", "[[ALGO--webhook-signature]]", "[[SAFETY--tenant-isolation]]"]
  guards: ["[[SAFETY--tenant-isolation]]", "[[ALGO--webhook-signature]]"]
  contradicts: []

touch_points:
  - "src/app/api/conversations/route.js"
  - "src/app/api/conversations/[id]/route.js"
  - "src/app/api/webhooks/line/route.js"
  - "src/app/api/webhooks/line-monitor/route.js"
  - "src/app/api/ai/agent-mode/toggle/route.js"
  - "src/app/api/ai/compose-reply/route.js"
  - "src/lib/line/lineUtil.js"
  - "src/lib/line/intentParser.js"

owner: "@architect"
tags: [inbox, conversations, webhook, line, facebook, agent-mode]
created_at: 2026-04-15
updated_at: 2026-04-15
created_by: "MSP-AGT-EVA-COWORK"
updated_by: "MSP-AGT-EVA-COWORK"
---

# API — Inbox

## 1. Conversations

### `GET /api/conversations`
> Paginated conversation list — Redis-cached, SLA < 500ms

| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| `page` | int | default 1 |
| `limit` | int | default 20 |
| `status` | enum | open\|closed\|pending |
| `channel` | enum | facebook\|line |
| `search` | string | ค้นหาจาก customer name |
| `agentId` | uuid | filter by assigned agent |

| | |
|---|---|
| **Auth** | `withAuth(domain:'inbox', action:'R')` |
| **Cache** | Redis — `inbox:list:{tenantId}:{hash}` — 60s TTL |
| **Cache Bust** | เมื่อมี reply ใหม่ หรือ webhook เข้า |
| **Returns** | `{ data: Conversation[], total, page, limit }` |

---

### `GET /api/conversations/{id}`
> Conversation detail พร้อม messages ล่าสุด 50 รายการ

| | |
|---|---|
| **Auth** | `withAuth(domain:'inbox', action:'R')` |
| **Returns** | `{ data: { ...conversation, messages: Message[], customer: Customer } }` |
| **Errors** | `404` ไม่พบ |

---

### `PUT /api/conversations/{id}`
> อัพเดท conversation metadata (status, assigned agent, pipeline stage)

| | |
|---|---|
| **Auth** | `withAuth(domain:'inbox', action:'W')` |
| **Body** | `{ status?: 'open'\|'closed'\|'pending', assignedAgentId?: uuid, pipelineStageId?: uuid }` |
| **Side Effects** | Pusher event `inbox:conversation:updated` |
| **Returns** | `{ data: Conversation }` |

---

## 2. Webhooks (Message Ingestion)

### `POST /api/webhooks/line`
> LINE OA webhook — multi-tenant, async processing, **< 200ms response**

```
Security: HMAC-SHA256 signature verification (X-Line-Signature header)
Multi-tenant: routes by LINE destination → lineOaId → tenantId
```

| | |
|---|---|
| **Auth** | HMAC-SHA256 signature (ดู [[ALGO--webhook-signature]]) |
| **Response** | ส่ง `200 { status: 'ok' }` ทันที ก่อน process |
| **Async Processing** | Enqueue via QStash หรือ in-process async |

**Processing Pipeline:**
1. Verify LINE signature
2. Route to tenant via `lineOaId`
3. Upsert Customer (phone/lineUserId dedup)
4. Upsert Conversation (channel=LINE)
5. Insert Message
6. Parse intent (`intentParser.js`)
7. If `agentMode = AGENT` → trigger AI reply (`/api/ai/agent-process`)
8. Push Pusher event: `inbox:message:new`

| **Returns** | `{ status: 'ok' }` |
|---|---|
| **Errors** | `401` signature invalid |

---

### `POST /api/webhooks/line-monitor`
> LINE monitor webhook — สำหรับ system-level event monitoring

| | |
|---|---|
| **Auth** | LINE signature |
| **Usage** | Monitor OA health, block/unblock events |

---

## 3. Agent Mode (AI Auto-Reply)

### `POST /api/ai/agent-mode/toggle`
> Staff สลับระหว่าง AGENT mode (AI ตอบ) ↔ HUMAN mode (Staff ตอบ)

| | |
|---|---|
| **Auth** | `withAuth` — SLS/STF/MGR |
| **Body** | `{ conversationId: uuid, mode: 'AGENT'\|'HUMAN' }` |
| **Side Effects** | Update `Conversation.agentMode`, reset `agentTurnCount=0` (เมื่อ → AGENT), Pusher notify |
| **Returns** | `{ data: { conversationId, agentMode } }` |

---

### `POST /api/ai/agent-process` *(QStash Worker)*
> AI processes LINE message + replies (internal — called by webhook pipeline)

| | |
|---|---|
| **Auth** | QStash signature verification |
| **Body** | `{ conversationId, messageId, webhookPayload }` |
| **Pipeline** | buildContext → Gemini Flash → escalation check → LINE reply |
| **Escalation Triggers** | keyword match, sentiment < -0.5, turnCount > 3, complex intent |

---

## 4. Pipeline Management

### `GET /api/conversations` (pipeline filter)
> Filter conversations by pipeline stage

| Parameter | คำอธิบาย |
|-----------|---------|
| `pipelineStageId` | uuid — filter by stage |

---

## 5. Real-time (Pusher Events)

| Channel | Event | Payload |
|---------|-------|---------|
| `tenant:{tenantId}:inbox` | `message:new` | `{ conversationId, messageId, preview }` |
| `tenant:{tenantId}:inbox` | `conversation:updated` | `{ conversationId, status, agentMode }` |
| `tenant:{tenantId}:inbox` | `agent:escalation` | `{ conversationId, reason }` |

---

## 6. Permission Summary

| Resource | OWNER | ADM | MGR | STF/SLS |
|----------|-------|-----|-----|---------|
| View conversations | ✅ All | ✅ All | ✅ All | ✅ Assigned |
| Reply | ✅ | ✅ | ✅ | ✅ |
| Toggle Agent Mode | ✅ | ✅ | ✅ | ✅ |
| Update status/assign | ✅ | ✅ | ✅ | ✅ Own |
| Configure Agent Prompt | ✅ | ✅ | ✅ | ❌ |
