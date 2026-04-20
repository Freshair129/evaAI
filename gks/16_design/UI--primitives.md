---
id: "ui--primitives"
type: "inventory"
summary: "UI Primitives components list"
status: "active"
---
# UI Primitives (`src/components/ui/`)

| Component | Purpose | Key Props | LOC |
|---|---|---|---|
| `Badge` | Label chip — 8 color variants + dot indicator | `variant`, `showDot`, `children` | ~30 |
| `Button` | Button — variants, sizes, loading state | `variant`, `size`, `isLoading`, `disabled` | ~45 |
| `Card` | Container with optional header/footer | `header`, `footer`, `padding`, `children` | ~25 |
| `DataTable` | Generic table — columns config, empty state, row click | `columns`, `data`, `isLoading`, `onRowClick`, `emptyState` | ~85 |
| `Input` | Form input — label, icon, error, required | `label`, `type`, `error`, `icon`, `required` | ~40 |
| `Modal` | Dialog overlay — sm/md/lg sizes, body scroll lock | `isOpen`, `onClose`, `title`, `footer`, `size` | ~60 |
