---
id: "ADR--CONNECTOR-TRANSPORT"
phase: 2
type: "adr"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.80
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-MESSAGING-CONNECTORS"]
  implements: ["CONCEPT--EVA-MESSAGING-CONNECTORS"]
---

# ADR--CONNECTOR-TRANSPORT — Transport choices for LINE + Telegram

> **Status:** Accepted · **Date:** 2026-04-21

## Decision

- **LINE**: Webhook (native `node:http` server)
- **Telegram**: Long-polling (`getUpdates`)
- **Deps added**: **0** — ใช้ native http + fetch + HMAC-SHA256 เท่านั้น

## Rationale

### LINE → Webhook (ไม่มีทางเลือก)
- LINE Messaging API ไม่มี polling endpoint
- ต้องมี public HTTPS URL (Boss ใช้ ngrok/cloudflare tunnel ได้ตอนพัฒนา)
- Signature verify ด้วย HMAC-SHA256 ของ raw body + channel secret

### Telegram → Long-polling (เลือก)
| Option | Pros | Cons |
|---|---|---|
| Long-poll | ไม่ต้อง HTTPS, ทำงานหลัง NAT, เริ่มง่าย | 1 bot 1 process, ต้องมี loop |
| Webhook | Push-based, ไม่มี poll overhead | ต้อง HTTPS, cert management |

เลือก long-poll เพราะ setup ง่ายกว่ามาก สำหรับ dev/personal use

### Native http + raw fetch (ไม่ใช่ express/telegraf)
- Zero new dependencies
- HMAC verification ~20 บรรทัด
- LINE API wrapper ~40 บรรทัด, TG wrapper ~30 บรรทัด
- ถ้าต้องขยาย (multi-provider, rich UI) ค่อย swap เข้า SDK ทีหลัง

## Consequences

### Positive
- Build size เล็ก startup เร็ว
- ไม่มี transitive deps ที่เสี่ยง
- Signature verify / error handling ทุกอย่างอยู่ในโค้ดเรา ตรวจสอบได้ง่าย

### Negative
- ไม่ได้ retry/backoff automatic (ต้องเขียนเอง)
- ไม่มี type-safe event parsing (แต่มี Zod)
- Edge cases (media, flex msg) ต้องเขียนเอง — แต่อยู่ใน out-of-scope

### Mitigation
- ใช้ Zod schema ตรวจสอบ inbound payload
- retry 1 ครั้งบน 5xx จาก LINE reply API
- Long-poll loop มี exponential backoff on error (2s → 4s → 8s max 30s)
