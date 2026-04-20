---
id: "ds--elevation"
type: "design-system"
summary: "Elevation & Depth: Glassmorphism DNA"
status: "active"
---
# Elevation & Depth: Glassmorphism DNA

Instead of solid, impermeable layers, The Silent Supporter uses **Glassmorphism** to create a sense of context and connection. The interface elements don't block the background; they gently blur it, keeping the user grounded in their current workflow.

- **Glass Nav & Cards:** `background: rgba(255, 255, 255, 0.06);` with a `backdrop-filter: blur(14px);`. This subtle transparency makes the UI feel light and unobtrusive.
- **Diffused Shadows (`var(--shadow-lg)`):** Shadows are wide and soft (`0 12px 40px rgba(0,0,0,0.10)`). For primary actions, we use a warm **Brand Glow** (`rgba(232, 130, 12, 0.35)`) to guide clicks without aggressively demanding attention.
