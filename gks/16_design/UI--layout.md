---
id: "ui--layout"
type: "inventory"
summary: "UI Layout components list"
status: "active"
---
# Layout (`src/components/layouts/`)

| Component | Purpose | Key Props | LOC |
|---|---|---|---|
| `DashboardShell` | Root layout — composes Sidebar + Topbar + main | `children` | ~15 |
| `Sidebar` | Dark vertical nav — 7 items + settings, active state | — (reads `usePathname`) | ~50 |
| `Topbar` | Header — page title, notification bell, user menu | `title` | ~75 |
