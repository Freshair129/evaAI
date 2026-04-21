---
id: "CONCEPT--EVA-MESSAGING-CONNECTORS"
phase: 1
type: "concept"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.80
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-TRI-BRAIN"]
  implements: []
  used_by: []
---

# CONCEPT--EVA-MESSAGING-CONNECTORS — LINE OA + Telegram Integration

> **Phase:** P1
> **Created:** 2026-04-21

## 1. Goal

ให้ Boss คุยกับ EVA Agent ได้จากมือถือผ่าน **LINE OA** และ **Telegram** โดยไม่ต้องนั่งหน้าคอม — agent รันเป็น background service, รับข้อความ → process ผ่าน Tri-Brain → ตอบกลับเป็นภาษาไทยสุภาพ

## 2. Scope

### In Scope (MVP)
- ✅ LINE OA: webhook inbound + reply/push API outbound
- ✅ Telegram: long-polling inbound + sendMessage outbound
- ✅ 1:1 chat support (primary use case)
- ✅ Group chat support with @mention detection (opt-in response)
- ✅ Per-chat session (memory isolated per user/group)
- ✅ Rate limit: 5 msg/min/chat
- ✅ Thai-first reply (Limbic stylize เสมอ)
- ✅ Read-only tool allowlist (bot ต้องห้าม Bash/Write/Edit)

### Out of Scope (Phase 2+)
- ❌ Image/sticker/voice input
- ❌ Rich messages (Flex Message, inline keyboards) — plain text เท่านั้น
- ❌ Push notifications เชิงรุก (bot ไม่เริ่มคุยเอง)
- ❌ Web UI สำหรับจัดการ bot

## 3. User Stories

- **US-01** — Boss ถาม "ยอดขายวันนี้" ใน LINE → EVA query GKS + ตอบเป็นไทย
- **US-02** — ทีมงานใน Telegram group พิมพ์ "@eva ช่วยสรุป ADR ล่าสุด" → EVA ตอบ, ข้อความอื่นใน group ไม่ถูก trigger
- **US-03** — Boss ถามเดิม 2 ครั้งใน 1 นาที — ครั้งที่ 6 ใน 60 วินาทีเจอ rate limit
- **US-04** — Session ของ Boss ใน LINE ไม่ปนกับของคนอื่น, memory แยกกัน

## 4. Success Metrics

| Metric | Target |
|---|---|
| Time-to-reply | < 5s สำหรับ chat_casual, < 30s สำหรับ code/knowledge |
| Signature verify failures (LINE) | 0 (ทุก request ต้องผ่าน HMAC-SHA256) |
| Group mention precision | > 95% (ไม่ reply เมื่อไม่ถูก mention) |
| Session isolation | 100% (no cross-user memory leak) |

## 5. Non-Goals
- ไม่ทำ bot marketplace / LIFF app
- ไม่รองรับ payment / sticker store
- ไม่รองรับ webhook fan-out ไปหลาย agent
