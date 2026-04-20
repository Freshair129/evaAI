---
id: "moc"
type: "moc"
summary: "Root index of the project Knowledge Graph (GKS) — updated for V2+V3 hybrid architecture"
status: "active"
version: "2.0.0"
tags: [moc, index, navigation]
created_at: 2026-04-14
updated_at: 2026-04-19
updated_by: "@claude-opus-4-7"
---
# 🗺️ Project Knowledge Graph (MOC)

> **Read first**: [[agent-protocol|Agent Protocol]] · [[README|L0 Index README]]
> **Architecture**: `msp/ARCHITECTURE_OVERVIEW.md` · [[PROTO--gks-v3-architecture|GKS v3 Assembly Line]]

---

## 🏗️ Core Modules
- [[MOD--core]] — Foundation, Multi-tenancy, Auth, DB
- [[MOD--crm]] — Customer 360, Identity Resolution
- [[MOD--billing]] — Invoice, Payment, Slip verification
- [[MOD--inbox]] — Omni-channel Unified Messaging
- [[MOD--pos]] — Point of Sale, Floor Plan, Tables
- [[MOD--ai]] — AI Assistant, NL2SQL, Gemini
- [[MOD--analytics]] — Dashboards, Reporting
- [[MOD--enrollment]] — Course, Student Lifecycle
- [[MOD--kitchen]] — Recipes, FEFO Inventory

See: [[modules-index|Full Module Directory]]

---

## 🚀 Features
- [[FEAT--multi-tenant]] · [[FEAT--customer-profile]] · [[FEAT--crm-core]]
- [[FEAT--billing]] · [[FEAT--pos-onsite]] · [[feat--pos-delivery]] · [[feat--pos-mobile]]
- [[FEAT--inbox]] · [[FEAT--inbox-pipeline]]
- [[FEAT--ai-assistant-core]] · [[FEAT--daily-brief]] · [[FEAT--workflow-automation]]
- [[FEAT--certification-logic]] · [[feat--accounting-integration]]

See: [[features-index|Full Feature Directory]]

---

## 📜 Protocols (Cross-cutting Standards)
- [[PROTO--multi-tenancy]] · [[PROTO--rbac-security]] · [[PROTO--data-flow]]
- [[PROTO--repo-pattern]] · [[PROTO--ai-safety]] · [[PROTO--stack-core]]
- [[PROTO--billing-flow]] · [[PROTO--message-routing]] · [[PROTO--inbox-realtime]]
- [[PROTO--automation-cron]] · [[PROTO--attendance-checkin]] · [[PROTO--hardware-connection]]
- [[PROTO--task-management]] · [[PROTO--gks-v3-architecture]]

---

## 🛡️ Laws & Non-negotiables
- [[laws|LAWS]] — Architectural invariants index
- [[AUDIT_LOG_SPEC|Audit Log Specification]]

---

## 🎨 Architecture Decisions (Recent highlights)
- [[ADR-062]] — Obsidian as Single Source of Truth
- [[ADR-064]] — Doc-to-Code Three-Phase Workflow
- [[ADR-066]] — Component Size Limit (500 LOC)
- [[ADR-069]] — AI Context Layer (Gemini Context Caching)
- [[ADR-071]] — AI Rulebook + Auditor Sync
- [[ADR-073]] — Rulebook Navigator System
- [[ADR-076]] — Multi-Agent Branch Strategy
- [[ADR-078]] — Squash-merge Guardrails

**All 22 ADRs**: grep `atomic_index.jsonl` for `"type":"architecture_decision"`.

---

## ⚙️ Build & Codegen (V3 Layer)
- **Phase 1** (Product narrative): `gks/phase1_docs/`
- **Phase 2** (Atomic): `gks/phase2_atomic/` ← this vault
- **Phase 3** (Blueprints): `gks/phase3_blueprints/` — YAML contracts
- **Phase 3.5** (Micro-tasks): `gks/phase3.5_microtasks/` — codegen units
- Detailed guide: `gks/phase3.5_microtasks/README.md`
- Reports: [[EXP-2026-04-19-qwen-codegen|Qwen Benchmark]] · [[EXP-2026-04-19-phase35-pilot|Phase 3.5 Pilot]]

---

## 🔎 L0 Search (Token-efficient)
- [[README|00_index README]] — how to use L0 index
- `atomic_index.jsonl` — 1 line per atomic file (~22 KB, scan this first)
- `atomic_index.meta.json` — counts + duplicates + last validation
- `atomic_validation_report.json` — latest drift report

Commands:
```bash
npm run msp:index     # rebuild L0 index
npm run msp:validate  # drift check
npm run msp:check     # both (runs as pre-commit)
npm run msp:codegen <FEAT-id>  # Qwen micro-task codegen
npm run msp:compose <FEAT-id>  # deterministic joiner
```

---

## 🤖 Agent Protocol
- [[agent-protocol|Agent Protocol — Read First]]
- LLM write contract: `.brain/msp/LLM_Contract/phase2_atomic_contract.yaml`
- Codegen contract: `.brain/msp/LLM_Contract/codegen_microtask_contract.yaml`

---

## 🎨 Design System
- [[DS--colors|Colors]]
- [[DS--components-interactions|Components & Interactions]]
- [[DS--elevation|Elevation]]

---

## 📘 Tech Reference
- [[TECH_STACK|Full Tech Stack]]
- [[core|Core Stack Summary]] · [[integrations|External Integrations]]
- [[endpoints|API Endpoints Registry]]
- [[WEBHOOK_EVENT_CATALOG|Webhook Event Catalog]]
- [[DEV_TOOLS|Developer Tools]]

---

## 🧪 Experiments & Devlog
- `gks/14_devlog/task/` — task logs
- `gks/14_devlog/implement/` — implementation blueprints (MSP-IMP-*)
- `gks/14_devlog/experiment/` — empirical studies
  - [[EXP-2026-04-19-qwen-codegen|Qwen 2.5 Coder Benchmark]]
  - [[EXP-2026-04-19-phase35-pilot|Phase 3.5 Pilot Report]]

---

## 📊 Flows
- [[flows-index|Data Flows Index]]
- [[flow--customer-data-fetch|Customer Data Fetch Flow]]

---

*Last updated 2026-04-19 — post-V2/V3 hybrid migration, Phase 3.5 micro-task codegen live, MOC links normalized to canonical IDs (no folder prefixes — Obsidian resolves by ID).*
