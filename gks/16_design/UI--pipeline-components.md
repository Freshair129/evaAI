---
id: "ui--pipeline-components"
type: "inventory"
summary: "Component specs for PipelineStageBar and PipelineStageEditor"
status: "active"
priority: "high"
needed_for: ["FEAT-INBOX", "Settings → Inbox → Pipeline"]
created_at: 2026-04-20
updated_at: 2026-04-20
updated_by: "@claude-sonnet-4-6"
---
# Pipeline Components

Two high-priority missing components required for the Inbox pipeline feature.

---

## 1. `PipelineStageBar`

**Location:** `src/components/inbox/PipelineStageBar.jsx`  
**Used in:** `/inbox` — stage tab filter bar (FEAT-INBOX §3.1b)  
**LOC estimate:** ~70

### Purpose
Horizontal scrollable tab strip that lets agents filter the conversation list by pipeline stage. The active stage is highlighted in `brand` amber; all others use muted text. Designed to sit directly below the Inbox topbar and above the `ConversationList`.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `stages` | `Stage[]` | ✅ | Ordered array of pipeline stage objects |
| `activeStageId` | `string \| null` | ✅ | Currently selected stage id (`null` = "All") |
| `onStageChange` | `(stageId: string \| null) => void` | ✅ | Callback on tab click |
| `className` | `string` | — | Optional Tailwind overrides |

```ts
// Stage shape
interface Stage {
  id: string;
  label: string;
  color?: string;   // optional hex — falls back to brand token
  count?: number;   // unread/open conversation count badge
}
```

### Visual Spec
- **Layout:** `flex overflow-x-auto` — horizontal scroll on overflow, no wrap.
- **Tab anatomy:**
  - Label text (`--text-sm`, `--font-medium`)
  - Optional count badge — `Badge` primitive with `variant="brand"` or muted
  - Bottom border `2px solid var(--color-brand)` on active tab
- **All tab:** Always rendered first, maps to `activeStageId = null`.
- **Spacing:** `gap-6` between tabs, `px-4 py-2` per tab.
- **Hover:** `color: var(--color-brand)` + `transition: var(--transition-fast)`.
- **Active state:** `color: var(--color-brand)`, `border-bottom: 2px solid var(--color-brand)`, `font-weight: var(--font-semibold)`.
- **Scrollbar:** Hidden (`scrollbar-hide`) — touch/mouse drag to scroll.

### Interaction
- Clicking a tab calls `onStageChange(stage.id)` (or `null` for "All").
- No keyboard trap — standard tab order.
- Stage count badge updates in real-time via parent state (no internal data fetching).

### Example Usage
```jsx
<PipelineStageBar
  stages={pipeline.stages}
  activeStageId={activeStage}
  onStageChange={setActiveStage}
/>
```

---

## 2. `PipelineStageEditor`

**Location:** `src/components/settings/PipelineStageEditor.jsx`  
**Used in:** `Settings → Inbox → Pipeline` — full CRUD for pipeline stages  
**LOC estimate:** ~200

### Purpose
A full CRUD editor for managing pipeline stages within a tenant's Inbox settings. Stages are displayed as a drag-sortable list; each item has inline edit controls. A floating "Add Stage" button opens a `Modal` form.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `pipelineId` | `string` | ✅ | ID of the pipeline being edited |
| `stages` | `Stage[]` | ✅ | Current ordered stages from parent/server |
| `onSave` | `(stages: Stage[]) => Promise<void>` | ✅ | Called with full updated stage array on save |
| `isLoading` | `boolean` | — | Shows skeleton while fetching |
| `maxStages` | `number` | — | Cap on stage count (default: 10) |

```ts
interface Stage {
  id: string;
  label: string;
  color: string;    // hex — user-selectable from a preset palette
  order: number;    // 1-indexed sort order
  isDefault: boolean;  // default stage for new conversations
}
```

### Sub-components (internal)

| Sub-component | Role |
|---|---|
| `StageRow` | Single draggable row — color swatch, label, default toggle, delete |
| `StageFormModal` | Add/Edit modal — label input, color picker, default checkbox |
| `ColorPicker` | Grid of 8 preset swatches (brand, mustard, rest-blue, success, warning, danger, info, slate) |

### Visual Spec

**Stage list:**
- Each `StageRow` uses `DragHandleIcon` on the left for reorder affordance.
- Color swatch: `16×16px` circle using `stage.color`.
- Label: `--text-base`, truncated to 1 line.
- Default badge: small `Badge` with `variant="brand"` if `isDefault`.
- Edit / Delete icon buttons (`--text-sm`, `color: --color-text-secondary`).
- Hover background: `rgba(232, 130, 12, 0.06)` (brand at 6% opacity).
- Separator: `1px solid var(--color-border)` between rows.

**Add Stage button:**
- `Button` with `variant="outline"`, `size="sm"`, `+ Add Stage` label.
- Disabled when `stages.length >= maxStages`.

**Drag & drop:**
- Uses `@dnd-kit/core` + `@dnd-kit/sortable` (already in stack).
- `order` values are re-derived from array index on drop — no gaps.

**Save:**
- `Button variant="primary"` — `Save Changes`.
- Calls `onSave(updatedStages)` — parent owns optimistic update + API call.
- Shows spinner via `isLoading` prop during save.

### Validation Rules
- `label`: 1–40 characters, required, unique within pipeline.
- `color`: must be one of the 8 preset hex values.
- Exactly one stage must have `isDefault: true`.
- Minimum 1 stage; maximum `maxStages` (default 10).

### Stage Form Modal Fields

| Field | Type | Validation |
|---|---|---|
| Stage Name | Text input | Required, 1–40 chars, unique |
| Color | Color swatch picker | One of 8 presets |
| Set as default | Checkbox | Auto-unchecks current default if changed |

### Example Usage
```jsx
<PipelineStageEditor
  pipelineId={pipeline.id}
  stages={pipeline.stages}
  onSave={handleSaveStages}
  isLoading={isMutating}
  maxStages={10}
/>
```

---

## Dependency Map

```
PipelineStageBar
  └─ Badge (ui/Badge)

PipelineStageEditor
  ├─ Modal (ui/Modal)
  ├─ Button (ui/Button)
  ├─ Input (ui/Input)
  ├─ Badge (ui/Badge)
  └─ @dnd-kit/core + @dnd-kit/sortable
```

---

## Design Token Usage

Both components follow [[DS--tokens]] strictly:

| Token | Usage |
|---|---|
| `--color-brand` | Active tab border, active label, hover accent |
| `--color-surface-card` | Row backgrounds |
| `--color-border` | Row dividers, inactive tab borders |
| `--color-text-secondary` | Inactive tab labels, icon buttons |
| `--transition-fast` | Tab hover, row hover transitions |
| `--radius-md` | Stage form modal inputs |
| `--shadow-md` | Stage form modal container |
