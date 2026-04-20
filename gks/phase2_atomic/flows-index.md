---
id: "flows-index"
type: "moc"
summary: "Index of all architectural data flows in the Zuri Platform"
status: "active"
---
# 🌊 Data Flows & Logic Index

เอกสารรวบรวมขั้นตอนการไหลของข้อมูล (Data Flow) ทั้งหมดในระบบ โดยเชื่อมโยงกับเอกสารสถาปัตยกรรมหลักใน `docs/architecture/data-flows/`

## 🏗️ Core Infrastructure Flows
- [[docs/architecture/data-flows/multi-tenant.md|Multi-Tenancy & Isolation]]
- [[docs/architecture/data-flows/auth.md|Authentication & Session Flow]]
- [[docs/architecture/data-flows/audit.md|Audit Logging Engine]]

## 💬 Messaging & Communication
- [[docs/architecture/data-flows/inbox.md|Unified Inbox (FB/LINE) Flow]]
- [[docs/architecture/data-flows/notifications.md|Notification & Pusher Realtime]]
- [[docs/architecture/data-flows/dsb.md|Daily Sales Brief (AI Analysis)]]

## 🛒 Sales & Operations
- [[docs/architecture/data-flows/crm.md|CRM & Lifecycle Management]]
- [[docs/architecture/data-flows/pos.md|POS Ordering & Payment]]
- [[docs/architecture/data-flows/kitchen.md|Kitchen Display System (KDS)]]
- [[docs/architecture/data-flows/inventory.md|Inventory & FEFO Logic]]

## 🎓 Specialized Logic
- [[docs/architecture/data-flows/enrollment.md|Enrollment & Student Journey]]
- [[docs/architecture/data-flows/tasks.md|Internal Task Management]]
- [[docs/architecture/data-flows/procurement.md|Procurement & Expense Tracking]]
- [[docs/architecture/data-flows/marketing.md|Marketing & Ads Attribution]]
- [[docs/architecture/data-flows/ai.md|AI Agent & Context Layer]]

---
**Note for Agents:** 
ดึงข้อมูลจากไฟล์ต้นทางข้างต้นเมื่อต้องการทำความเข้าใจ Logic เชิงลึกในแต่ละ Module
