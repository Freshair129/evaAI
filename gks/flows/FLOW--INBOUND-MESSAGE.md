---
id: "FLOW--INBOUND-MESSAGE"
phase: 2
type: "flow"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.80
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-MESSAGING-CONNECTORS"]
  implements: ["ADR--CONNECTOR-TRANSPORT"]
---

# FLOW--INBOUND-MESSAGE — From LINE/TG to Reply

```
[user sends msg]
        │
        ▼
 ┌──────────────┐      ┌──────────────┐
 │ LINE webhook │      │ TG long-poll │
 │ + HMAC verify│      │ getUpdates   │
 └──────┬───────┘      └──────┬───────┘
        │ Event                │ Update
        ▼                      ▼
        └──────────┬───────────┘
                   ▼
          normalize → IncomingMessage
              { platform, chatId, userId,
                text, isMention, chatType }
                   │
                   ▼
          ┌─────────────────┐
          │  Group chat?    │───no──┐
          └────────┬────────┘       │
                   yes               │
                   ▼                 │
          Mentioned bot? ──no──▶  SKIP (return 200)
                   │yes             │
                   ▼◀───────────────┘
          ┌─────────────────┐
          │ Rate-limit check│
          │ 5 msg/min/chat  │
          └────────┬────────┘
                   │
              exceeded? ──yes──▶ reply "กำลังยุ่ง รอสักครู่"
                   │no
                   ▼
         Session Map: chatId → Session (create if new)
                   │
                   ▼
         AgentLoop.run(text)
            ├── Limbic intent
            ├── router (tool allowlist = bot subset)
            ├── retrieve memory
            ├── Cortex plan
            ├── execute steps (read-only tools)
            └── Limbic stylize → Thai reply
                   │
                   ▼
         platform.reply(chatId, text)
           ├── LINE: replyToken if within 1min else push
           └── TG: sendMessage(chat_id, text)
```

## Invariants

- LINE request ที่ signature ไม่ผ่าน → return 401, ไม่ route ต่อ
- Every inbound event → audit log (platform:chatId:msgId:timestamp)
- Session ของแต่ละ chatId ไม่แชร์ history กัน
- Tool ที่ `sideEffect` ≠ `read` + ไม่ใช่ `GksSearch`/`GksLookup` → ห้ามรันใน bot mode
- Rate limit เกิน → ไม่ call brain (ประหยัด API cost)

## Error Handling

| Error | Action |
|---|---|
| LINE signature invalid | return 401, log warning |
| LINE reply token expired (>1min) | fallback to push_message |
| TG network error | exponential backoff, max 30s between polls |
| AgentLoop throws | reply "ขออภัย ระบบมีปัญหาชั่วคราว" + log |
| Brain API down | reply "AI ใช้งานไม่ได้ตอนนี้ ลองใหม่อีกครั้ง" |
