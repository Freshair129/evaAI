---
id: "ui--shared"
type: "inventory"
summary: "UI Shared components list"
status: "active"
---
# Shared (`src/components/shared/`)

| Component | Purpose | Key Props | LOC |
|---|---|---|---|
| `EmptyState` | Empty state — icon, title, description, CTA | `icon`, `title`, `description`, `action` | ~25 |
| `LoadingSkeleton` | Skeleton placeholders — Line, Card, TableRow, Avatar, StatCard + default Loader | — | ~75 |
| `Pagination` | Page controls — numbers, ellipsis, prev/next | `currentPage`, `totalPages`, `onPageChange` | ~65 |
| `SearchBar` | Debounced search input with clear button | `onSearch`, `placeholder` | ~55 |
| `StatCard` | Metric card with trend indicator and icon | `label`, `value`, `trend`, `icon` | ~50 |
