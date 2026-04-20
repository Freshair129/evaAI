---
id: "ui--modules"
type: "inventory"
summary: "Business Module Components List"
status: "active"
---
# Business Module Components

## CRM (`src/components/crm/`)
| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `CustomerList` | Table with search + lifecycle stage filter | — (internal state) | ~150 | `/crm` |
| `CustomerDetail` | Tabbed detail — Info, Orders, Conversations, Enrollment | `customerId` | ~200 | `/crm/[id]` |

## Inbox (`src/components/inbox/`)
| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `ConversationList` | Left panel — conversation cards, channel badges, unread count | `conversations`, `selectedId`, `onSelect` | ~110 | `/inbox` |
| `ChatView` | Center panel — message bubbles, auto-scroll | `messages`, `isLoading` | ~100 | `/inbox` |
| `ReplyBox` | Text input — auto-expand, emoji/attachment buttons, Enter-to-send | `onSend`, `isLoading` | ~80 | `/inbox` |
| `CustomerCard` | Right panel — profile, labels, ad attribution, courses owned | `customer` | ~180 | `/inbox` |
| `ChatPOS` | Quick Sale panel (toggle) — product search, cart, create order | `conversationId` | ~170 | `/inbox` (right panel toggle) |

## POS (`src/components/pos/`)
| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `PremiumPOS` | Full POS — product grid, search, cart sidebar, payment modal | — (internal state) | ~200 | `/pos` |
| `CartPanel` | Cart sidebar — items, discount input, checkout | `items`, `onRemoveItem`, `onCheckout` | ~140 | `PremiumPOS` |

## Marketing (`src/components/marketing/`)
| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `MetricCard` | Reusable metric — label, value, trend, icon | `label`, `value`, `trend`, `icon` | ~50 | `/marketing` |
| `ROASChart` | ROAS line chart — custom tooltip, target reference line | `data`, `targetROAS` | ~90 | `/marketing` |
| `CampaignTable` | Campaign metrics table — ROAS calc, status badges | `campaigns` | ~100 | `/marketing/campaigns` |
| `DailyBriefCard` | 4-metric summary card — contacts, leads, hot prospects, revenue | `metrics` | ~55 | `/marketing/daily-brief` |

## Kitchen (`src/components/kitchen/`)
| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `RecipeCard` | Recipe card — category badge, ingredient count, prep time | `recipe` | ~30 | `/kitchen/recipes` |
| `StockTable` | Inventory table — status badges, expiry alerts, reorder | `items`, `onReorder` | ~120 | `/kitchen/stock` |
| `POTimeline` | PO stage progress — Draft → Pending → Approved → … → Received | `currentStage`, `stages` | ~70 | `/kitchen/procurement` |

## Schedule (`src/components/schedule/`)
| Component | Purpose | Key Props | LOC | Used in |
|---|---|---|---|---|
| `CalendarView` | Monthly calendar — class display, date nav, click handlers | `classes`, `onDateSelect`, `onClassSelect` | ~140 | `/schedule` |
| `AttendanceMarker` | Attendance — QR scan placeholder, quick-mark buttons, status counts | `classId`, `onMark` | ~180 | `/schedule` |
