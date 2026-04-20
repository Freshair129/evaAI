# Skill: Domain Expert — POS & Orders

> Trigger: ทำงานเกี่ยวกับ POS, Orders, Transactions, Payments, Slips
> Purpose: โหลด domain context สำหรับ POS module

## Context to Load

```
Read docs/gotchas/database-identity.md      # G-DB-02 (dbId vs id)
Read docs/gotchas/marketing-attribution.md   # G-MKT-02, G-MKT-04 (slip OCR)
```

## Key Rules

### Two POS Modes
```
Full POS (/pos)     → walk-in, no conversationId → Store Revenue
Quick Sale (Inbox)  → from chat, has conversationId → Ads Revenue
```
- Staff ต้อง train: walk-in ใช้ Full POS ไม่ใช่ Quick Sale

### Order → Conversation Link (G-DB-02)
```
Order.conversationId = conv.id (UUID)     ✅ ถูก
Order.conversationId = conv.conversationId (t_xxx)  ❌ ผิด
```

### Slip OCR (ADR-039)
```
confidence ≥ 0.80 → auto-create PENDING Transaction
confidence < 0.80 → log warning, manual add
Employee verify → slipStatus = VERIFIED → Order CLOSED
```
- ROAS คำนวณจาก VERIFIED เท่านั้น

### Revenue Classification (ADR-030)
```
Order.conversationId = null  → Store Revenue
Order.conversationId = UUID  → Ads Revenue
```

### Order ID Format
```
ORD-YYYYMMDD-NNN (daily serial, zero-padded)
PAY-YYYYMMDD-NNN (transaction)
```

### VAT
- Rate from `system_config.yaml` (getVatRate()) — ห้าม hardcode 0.07

## Checklist Before Commit
- [ ] conversationId uses UUID not t_xxx
- [ ] VAT from systemConfig not hardcoded
- [ ] Slip OCR confidence threshold = 0.80
- [ ] Order type set correctly (ONLINE vs WALKIN)
- [ ] $transaction for order + transaction creation
