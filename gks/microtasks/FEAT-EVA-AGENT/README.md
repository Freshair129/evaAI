# FEAT-EVA-AGENT — Tri-Brain Agent MVP Microtasks

> **Phase:** P4 — Implementation Breakdown
> **Feature:** EVA Tri-Brain Agent (runtime เทียบเคียง Claude Code)
> **Traceability:**
> - P1: `gks/concepts/CONCEPT--EVA-TRI-BRAIN.md`
> - P2: `gks/frameworks/FRAME--TRI-BRAIN-ARCHITECTURE.md`, ADRs, FLOW
> - P3: `gks/blueprints/BLUEPRINT--brains.yaml`, `tools.yaml`, `memory.yaml`

## Overview

20 microtasks แบ่งเป็น 6 groups ตาม dependency chain รันแบบ parallel ได้ใน group 2 และ group 4

## Execution Graph

```
Group 1: Bootstrap (serial)
  T1 → T2 → T3

Group 2: Brains (parallel)
  ├─ T4 (Cortex)
  ├─ T5 (Motor)
  └─ T6 (Limbic)

Group 3: Memory (serial)
  T7 → T8 → T9 → T10

Group 4: Tools (parallel)
  ├─ T11 (Registry)
  ├─ T12 (FS tools)
  ├─ T13 (Bash)
  └─ T14 (Knowledge tools)

Group 5: Orchestrator (serial)
  T15 → T16 → T17

Group 6: UI (serial)
  T18 → T19 → T20
```

## Task Index

| ID | Name | Runner | Depends On |
|---|---|---|---|
| T1 | Scaffold project | Human+Cortex | — |
| T2 | Shared types | Cortex+Motor | T1 |
| T3 | Config loader | Motor | T2 |
| T4 | Cortex adapter | Motor | T2, T3 |
| T5 | Motor adapter | Motor | T2 |
| T6 | Limbic adapter | Motor | T2 |
| T7 | GKS reader | Motor | T2 |
| T8 | Embedder | Motor | T3 |
| T9 | Vector store | Motor | T8 |
| T10 | Memory store | Cortex+Motor | T7, T9 |
| T11 | Tool registry | Motor | T2 |
| T12 | FS tools | Motor | T11 |
| T13 | Bash tool | Motor | T11 |
| T14 | Knowledge tools | Motor | T10, T11 |
| T15 | Permission system | Cortex+Motor | T11 |
| T16 | Router | Cortex+Motor | T4, T5, T6 |
| T17 | ReAct loop | Cortex+Motor | T15, T16, T10 |
| T18 | Ink app shell | Motor | T17 |
| T19 | Ink panels | Motor | T18 |
| T20 | CLI entry | Motor | T19 |

## Human Gates (ต้องให้ Boss approve ก่อนผ่าน)

- ✋ **After T3** — review config schema ก่อนเขียน brain adapter
- ✋ **After T10** — test memory retrieval กับ GKS จริง
- ✋ **After T17** — smoke test orchestrator โดย mock UI
- ✋ **After T20** — full acceptance ตาม `manifest.yaml#mvp_acceptance`

## Next

เมื่อ Boss approve P1-P3 artifacts แล้ว → เริ่ม T1 (scaffold)
