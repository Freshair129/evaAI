---
id: "features-index"
type: "moc"
summary: "Central directory of all system features — synced from atomic_index.jsonl SSOT"
status: "active"
version: "2.0.0"
updated_at: 2026-04-19
updated_by: "@claude-opus-4-7"
---
# 🚀 System Features Index

Live count: **14 atomic features** in `gks/phase2_atomic/` + **25 Phase 3 blueprints** in `gks/phase3_blueprints/`.

---

## Phase 2 Atomic Features

### 🏗️ Core & Security
- [[FEAT--multi-tenant]] — Shared DB + Row-Level isolation (tenant_id)
- [[FEAT--customer-profile]] — Customer 360, cross-channel identity

### 💰 Billing & POS
- [[FEAT--billing]] — Invoice, Slip OCR, Payment Hooks
- [[FEAT--pos-onsite]] — Floor Plan, Table Status, Onsite Orders
- [[feat--pos-mobile]] — Mobile-first customer ordering (STUB)
- [[feat--pos-delivery]] — Delivery & Rider integration (STUB)

### 🤝 CRM & Messaging
- [[FEAT--crm-core]] — Lifecycle Funnel, Identity Binding
- [[FEAT--inbox]] — Omni-channel Unified Inbox
- [[FEAT--inbox-pipeline]] — Custom Conversation Pipeline + AI Routing

### 🤖 AI & Automation
- [[FEAT--ai-assistant-core]] — Gemini Flash chat integration
- [[FEAT--daily-brief]] — Management Summary to LINE
- [[FEAT--workflow-automation]] — Trigger-Condition-Action

### 🎓 Education
- [[FEAT--certification-logic]] — Hours tracking & Certificate issuance

### 🔌 Integrations
- [[feat--accounting-integration]] — Xero/FlowAccount sync (STUB)

---

## Phase 3 Blueprints (implementation-ready)

`gks/phase3_blueprints/`:

- **FEAT-001** MultiTenant · **FEAT-002** CustomerProfile · **FEAT-003** Billing
- **FEAT-004** Inbox · **FEAT-005** CRM
- **FEAT-006** POS (✅ pilot — [[EXP-2026-04-19-phase35-pilot|see pilot report]])
- **FEAT-007** Enrollment · **FEAT-008** Kitchen · **FEAT-009** POSMobile
- **FEAT-010** DailyBrief · **FEAT-011** AIAssistant · **FEAT-012** POSDelivery
- **FEAT-013** AccountingIntegration · **FEAT-014** WorkflowAutomation
- **FEAT-015** MarketingAds · **FEAT-016** CampaignEngine · **FEAT-017** LINEAgentMode
- **FEAT-018** InboxAIPanel · **FEAT-019** CRMAIInsights · **FEAT-020** AskMarketing
- **FEAT-021** AccountingPlatform · **FEAT-022** ExpressIntegration
- **FEAT-023** PlatformStrategy · **FEAT-024** EmployeeCard · **FEAT-025** OwnershipTransfer

---

## Phase 3.5 Micro-tasks (codegen-ready)

`gks/phase3.5_microtasks/`:

- **FEAT-006** — POS merge endpoint (✅ live, 4/4 tasks passed)
- *(more features to be decomposed — see pilot recommendations)*

---

*Auto-sync: live count regenerated via `npm run msp:index` → `atomic_index.jsonl`. Edit this MOC by hand to adjust groupings.*
