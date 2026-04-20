---
id: "ds--components"
type: "design-system"
summary: "Components & Interactions"
status: "active"
---
# Components & Interactions

### Form Inputs & The "Underline"
- **State:** Inputs avoid heavy boxes. They use "The Underline" (`border-bottom: 2px solid`) which softly shifts to `brand` (#E8820C) on focus. This acts as a gentle nudge rather than a harsh boundary.

### AI & Support Modules (Rest Blue)
- **AI Toasts & Suggestions:** Use `rest-blue` backgrounds with `rest-blue-text`. This distinct palette separates "Zuri's helpful voice" from the user's actionable workflow, visually distinguishing the "Silent Supporter."

### Micro-Interactions (The Zuri Pulse)
- **Hover States:** Buttons and floating shapes use a slow, breathable easing (`transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)`). They gently scale up (`hover:scale-[1.02]`) rather than snapping, reinforcing the "human-like" responsiveness of the system.
