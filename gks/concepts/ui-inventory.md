# Zuri Platform — UI Component Inventory

**Version:** 1.0
**Date:** 2026-04-02
**Total:** 32 components — all implemented (0 stubs)

---

## UI Primitives (`src/components/ui/`)

| Component | Purpose | Key Props | LOC |
|---|---|---|---|
| `Badge` | Label chip — 8 color variants + dot indicator | `variant`, `showDot`, `children` | ~30 |
| `Button` | Button — variants, sizes, loading state | `variant`, `size`, `isLoading`, `disabled` | ~45 |
| `Card` | Container with optional header/footer | `header`, `footer`, `padding`, `children` | ~25 |
| `DataTable` | Generic table — columns config, empty state, row click | `columns`, `data`, `isLoading`, `onRowClick`, `emptyState` | ~85 |
| `Input` | Form input — label, icon, error, required | `label`, `type`, `error`, `icon`, `required` | ~40 |
| `Modal` | Dialog overlay — sm/md/lg sizes, body scroll lock | `isOpen`, `onClose`, `title`, `footer`, `size` | ~60 |

---

## Shared (`src/components/shared/`)

| Component | Purpose | Key Props | LOC |
|---|---|---|---|
| `EmptyState` | Empty state — icon, title, description, CTA | `icon`, `title`, `description`, `action` | ~25 |
| `LoadingSkeleton` | Skeleton placeholders — Line, Card, TableRow, Avatar, StatCard + default Loader | — | ~75 |
| `Pagination` | Page controls — numbers, ellipsis, prev/next | `currentPage`, `totalPages`, `onPageChange` | ~65 |
| `SearchBar` | Debounced search input with clear button | `onSearch`, `placeholder` | ~55 |
| `StatCard` | Metric card with trend indicator and icon | `label`, `value`, `trend`, `icon` | ~50 |

---

## Layout (`src/components/layouts/`)

| Component | Purpose | Key Props | LOC |
|---|---|---|---|
| `DashboardShell` | Root layout — composes Sidebar + Topbar + main | `children` | ~15 |
| `Sidebar` | Dark vertical nav — 7 items + settings, active state | — (reads `usePathname`) | ~50 |
| `Topbar` | Header — page title, notification bell, user menu | `title` | ~75 |

---

## CRM (`src/components/crm/`)

| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `CustomerList` | Table with search + lifecycle stage filter | — (internal state) | ~150 | `/crm` |
| `CustomerDetail` | Tabbed detail — Info, Orders, Conversations, Enrollment | `customerId` | ~200 | `/crm/[id]` |

---

## Inbox (`src/components/inbox/`)

| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `ConversationList` | Left panel — conversation cards, channel badges, unread count | `conversations`, `selectedId`, `onSelect` | ~110 | `/inbox` |
| `ChatView` | Center panel — message bubbles, auto-scroll | `messages`, `isLoading` | ~100 | `/inbox` |
| `ReplyBox` | Text input — auto-expand, emoji/attachment buttons, Enter-to-send | `onSend`, `isLoading` | ~80 | `/inbox` |
| `CustomerCard` | Right panel — profile, labels, ad attribution, courses owned | `customer` | ~180 | `/inbox` |
| `ChatPOS` | Quick Sale panel (toggle) — product search, cart, create order | `conversationId` | ~170 | `/inbox` (right panel toggle) |

---

## POS (`src/components/pos/`)

| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `PremiumPOS` | Full POS — product grid, search, cart sidebar, payment modal | — (internal state) | ~200 | `/pos` |
| `CartPanel` | Cart sidebar — items, discount input, checkout | `items`, `onRemoveItem`, `onCheckout` | ~140 | `PremiumPOS` |

---

## Marketing (`src/components/marketing/`)

| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `MetricCard` | Reusable metric — label, value, trend, icon | `label`, `value`, `trend`, `icon` | ~50 | `/marketing` |
| `ROASChart` | ROAS line chart — custom tooltip, target reference line | `data`, `targetROAS` | ~90 | `/marketing` |
| `CampaignTable` | Campaign metrics table — ROAS calc, status badges | `campaigns` | ~100 | `/marketing/campaigns` |
| `DailyBriefCard` | 4-metric summary card — contacts, leads, hot prospects, revenue | `metrics` | ~55 | `/marketing/daily-brief` |

---

## Kitchen (`src/components/kitchen/`)

| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `RecipeCard` | Recipe card — category badge, ingredient count, prep time | `recipe` | ~30 | `/kitchen/recipes` |
| `StockTable` | Inventory table — status badges, expiry alerts, reorder | `items`, `onReorder` | ~120 | `/kitchen/stock` |
| `POTimeline` | PO stage progress — Draft → Pending → Approved → … → Received | `currentStage`, `stages` | ~70 | `/kitchen/procurement` |

---

## Schedule (`src/components/schedule/`)

| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `CalendarView` | Monthly calendar — class display, date nav, click handlers | `classes`, `onDateSelect`, `onClassSelect` | ~140 | `/schedule` |
| `AttendanceMarker` | Attendance — QR scan placeholder, quick-mark buttons, status counts | `classId`, `onMark` | ~180 | `/schedule` |

---

## Summary

| Group | Count | Total LOC |
|---|---|---|
| UI Primitives | 6 | ~285 |
| Shared | 5 | ~270 |
| Layout | 3 | ~140 |
| CRM | 2 | ~350 |
| Inbox | 5 | ~640 |
| POS | 2 | ~340 |
| Marketing | 4 | ~295 |
| Kitchen | 3 | ~220 |
| Schedule | 2 | ~320 |
| **Total** | **32** | **~2,860** |

---

## Missing Components (not yet created)

| Component | Needed for | Priority |
|---|---|---|
| `PipelineStageBar` | Inbox — stage tab filter bar (FEAT-INBOX §3.1b) | High |
| `PipelineStageEditor` | Settings → Inbox → Pipeline CRUD | High |
| `EnrollmentCard` | `/courses/[id]` — student enrollment list | Medium |
| `CertificateViewer` | Enrollment — download/preview certificate | Medium |
| `SlipUploader` | POS / Billing — upload slip image for OCR | Medium |
| `AIComposeFAB` | Inbox — floating button to trigger compose-reply | Medium |
| `NotificationBell` | Topbar — web push notification drawer | Low |
| `TenantSwitcher` | Admin — OWNER switches between tenants | Low |
