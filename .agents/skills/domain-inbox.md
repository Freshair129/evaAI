# Skill: Domain Expert — Unified Inbox

> Trigger: ทำงานเกี่ยวกับ Inbox, Conversations, Messages, FB/LINE chat
> Purpose: โหลด domain context สำหรับ Inbox module

## Context to Load

```
Read docs/gotchas/webhook-serverless.md     # G-WH-01 to G-WH-06
Read docs/gotchas/database-identity.md      # G-DB-01 to G-DB-07
Read docs/gotchas/ai-agent.md               # G-AI-03, G-AI-04 (LINE Agent)
```

## Key Rules

### Webhook (NFR1: < 200ms)
- Return 200 BEFORE any processing
- Fire-and-forget to QStash for heavy work
- Verify signatures (FB: hub.verify_token, LINE: X-Line-Signature HMAC)

### Identity Resolution (NFR5)
- Phone = merge key (E.164 format +66XXXXXXXXX)
- Customer upsert by phone → merge facebookId + lineId
- Must use `prisma.$transaction` for identity ops

### Data Flow
```
FB/LINE Webhook → respond 200 → QStash → Worker → Repo → DB
UI → /api/conversations → conversationRepo → DB (never Graph API)
Pusher event → UI auto-refresh
```

### IDs
- Conversation: `conv.id` = UUID (internal), `conv.conversationId` = t_xxx (FB) or LINE userId
- Message: `msg.messageId` = external ID from platform
- Order link: use `conv.id` (UUID) NOT `conv.conversationId`

### Race Conditions (G-WH-02)
- Use `upsert` not `find + create`
- Catch P2002 (duplicate) → safe to ignore

## Checklist Before Commit
- [ ] Webhook returns 200 before processing
- [ ] QStash signature verified on workers
- [ ] conversationId uses UUID not t_xxx for FK references
- [ ] $transaction for identity resolution
- [ ] Pusher event triggered for real-time updates
