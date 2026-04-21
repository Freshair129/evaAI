---
id: "ADR--TUI-INK-STACK"
phase: 2
type: "adr"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.80
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-TRI-BRAIN"]
  implements: ["FRAME--TRI-BRAIN-ARCHITECTURE"]
  used_by: []
---

# ADR--TUI-INK-STACK — Use Ink (React for CLI) for TUI

> **Status:** Accepted
> **Date:** 2026-04-21

---

## Context

Boss เลือก UI เป็น **TUI** (เหมือน Claude Code) ต้องการ layout หลาย panel + streaming + permission dialog + keyboard shortcut

---

## Decision

ใช้ **Ink** (React สำหรับ terminal) + TypeScript

### Reasons
- Claude Code ใช้ Ink เป็น reference — แปลว่าทำ UX แบบเดียวกันได้
- React mental model ง่าย (component + hook + state)
- Ecosystem ครบ: `ink-spinner`, `ink-text-input`, `ink-select-input`, `ink-gradient`
- Rendering ลื่น (diff-based เหมือน DOM)
- Integrate กับ TypeScript + Vitest ง่าย

### Stack

| Layer | Library | Purpose |
|---|---|---|
| Renderer | `ink@5` | Core |
| Components | `@inkjs/ui`, `ink-text-input` | Prompt/select |
| State | React Context + reducer | Session, permissions |
| Streaming | AsyncIterable → `useEffect` | Brain output stream |
| Testing | `ink-testing-library` + Vitest | Snapshot |
| Runtime | Node.js ≥ 20 + `tsx` | No build step in dev |

---

## Alternatives Considered

### A. Plain CLI (readline + chalk)
- ✅ เบาที่สุด
- ❌ ไม่สามารถทำ multi-panel ได้
- ❌ Streaming ดู clunky (ต้อง clear line เอง)

### B. blessed / neo-blessed
- ✅ Powerful, widget เยอะ
- ❌ API ยาก, ไม่ actively maintained
- ❌ Imperative — state management ลำบาก

### C. @clack/prompts
- ✅ สวย, modern
- ❌ เน้น wizard-style ไม่ใช่ full TUI
- ❌ ไม่เหมาะกับ multi-panel chat

### D. Ink (chosen)
- ✅ React mental model
- ✅ Community + example มาก (Vercel, GitHub Copilot CLI)
- ✅ Hot reload ใน dev
- ❌ Overhead React runtime (~50ms startup)
- ❌ ต้อง JSX/TSX compile

### E. Rust TUI (ratatui) + Node bridge
- ❌ เพิ่ม language barrier
- ❌ Integration cost สูงกว่าประโยชน์

---

## Consequences

### Positive
- Component-based UI — reusable
- Test ได้ด้วย ink-testing-library
- Developer experience ดี (React devs ออนบอร์ดได้เร็ว)

### Negative
- Bundle ใหญ่กว่า CLI plain (~5MB vs 500KB)
- Startup slower (~100-200ms)
- บาง terminal เก่ารองรับ ANSI ไม่ครบ → fallback mode

### Fallback
- ถ้า TTY ไม่รองรับ → auto fallback เป็น CLI mode (plain text)
- Flag `--no-tui` บังคับ CLI mode สำหรับ CI/pipe

---

## Layout Design

```
┌─ EVA Tri-Brain ─────────────── Session: MSP-SESS-260421001 ──┐
│ [Chat]                       │ [Context]                      │
│                              │ Retrieved (top 3):             │
│ Boss: ช่วย refactor cart.ts    │  • CONCEPT--POS (0.89)        │
│ EVA: กำลังอ่านไฟล์...           │  • ADR--042 (0.81)            │
│      [Tool: Read src/..]      │  • FLOW--checkout (0.76)      │
│                              │                                │
│                              │ [Brains]                       │
│                              │  LIMBIC ● idle                 │
│                              │  CORTEX ● planning  ▓▓▓░░      │
│                              │  MOTOR  ● idle                 │
│                              │                                │
│                              │ [Session]                      │
│                              │  tokens: 1,240 / 200k          │
│                              │  cost:   $0.018                │
├──────────────────────────────┴────────────────────────────────┤
│ > _                                                            │
└─ Tab:panel  Esc:cancel  Ctrl+P:perms  Ctrl+M:brain  ?:help ──┘
```

### Keyboard Map
- `Tab` — สลับระหว่าง Chat / Context panel
- `Esc` — cancel pending tool call / close dialog
- `Ctrl+P` — toggle permission mode
- `Ctrl+M` — manual override brain selection
- `Ctrl+L` — clear chat
- `?` — help overlay

---

## Implementation Notes

- Entry: `bin/eva.js` uses `tsx` to run `src/ui/app.tsx`
- Root component: `<App><SessionProvider><Layout/></SessionProvider></App>`
- Streams: ใช้ `useReducer` + `useEffect` subscribe async iterable
- Permission dialog: modal overlay ด้วย `<Box position="absolute">` (Ink v5)
