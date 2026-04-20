---
id: "modules-index"
type: "moc"
summary: "Central directory of all system modules — synced from atomic_index.jsonl SSOT"
status: "active"
version: "2.0.0"
updated_at: 2026-04-19
updated_by: "@claude-opus-4-7"
---
# 📦 System Modules Index

Live count: **9 modules** in `gks/phase2_atomic/` (canonical id: `MOD--*`).

---

## 🏗️ Core & Infrastructure
- [[MOD--core]] — Shared DB, Multi-Tenant Isolation, Global Config
- [[MOD--ai]] — AI Engine: NL2SQL, Gemini, Automation Architecture
- [[MOD--analytics]] — Business Intelligence, Dashboards, Reporting

## 💰 Commerce & Billing
- [[MOD--billing]] — Invoicing, Payment, Slip Verification, Tax
- [[MOD--pos]] — Point of Sale, Floor Plan, Table Management

## 🤝 CRM & Communication
- [[MOD--crm]] — Customer 360, Identity Resolution
- [[MOD--inbox]] — Omni-channel Messaging & Pipeline

## 🍳 Logistics & Education
- [[MOD--enrollment]] — Course & Student Lifecycle
- [[MOD--kitchen]] — Recipes, FEFO Inventory, Stock

---

## Module Boundaries (Upstream ← / → Downstream)

| Module | Upstream (depends on) | Downstream (consumers) |
|---|---|---|
| [[MOD--core]] | — | all |
| [[MOD--crm]] | core, inbox | billing |
| [[MOD--billing]] | crm, pos | analytics, accounting |
| [[MOD--inbox]] | core | crm |
| [[MOD--pos]] | crm, billing | kitchen, analytics |
| [[MOD--ai]] | core | all (read-only) |
| [[MOD--analytics]] | core | dashboards |
| [[MOD--enrollment]] | crm | billing |
| [[MOD--kitchen]] | pos | analytics |

*Individual module files declare precise boundaries in their `## 2. Boundaries` section.*

---

*Auto-sync: live count regenerated via `npm run msp:index`. Edit this MOC by hand to adjust groupings.*
