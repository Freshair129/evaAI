---
id: "ds--tokens"
type: "design-system"
summary: "CSS Design Tokens — single source of truth for all design values"
status: "active"
version: "1.0.0"
created_at: 2026-04-20
updated_at: 2026-04-20
updated_by: "@claude-sonnet-4-6"
---
# Design Tokens — CSS Custom Properties

> All visual values live here. Components reference tokens only — never raw hex/px values.

---

## Color Tokens

```css
:root {
  /* ── Surface & Background ── */
  --color-surface:        #F7F8FA;   /* Warm Canvas — page background */
  --color-surface-card:   #FFFFFF;   /* Card Surface — content isolation */
  --color-nav-dark:       #1A1710;   /* Elite Dark — sidebar / topbar */

  /* ── Brand (Amber Citrus) ── */
  --color-brand:          #E8820C;   /* Primary actions, focus, Z-logo */
  --color-brand-dark:     #B86A08;   /* Gradients, active/pressed states */
  --color-brand-glow:     rgba(232, 130, 12, 0.35); /* Shadow glow on CTA */

  /* ── Cognitive Ease ── */
  --color-rest-blue:      #D6ECFA;   /* AI suggestion badges / toasts */
  --color-rest-blue-text: #1A4E6E;   /* Text on rest-blue surfaces */
  --color-mustard:        #C6A052;   /* Secondary muted accent */

  /* ── Semantic ── */
  --color-success:        #22C55E;
  --color-warning:        #F59E0B;
  --color-danger:         #EF4444;
  --color-info:           #3B82F6;

  /* ── Text ── */
  --color-text-primary:   #1A1710;   /* Body copy — same as nav-dark */
  --color-text-secondary: #6B7280;   /* Labels, placeholders */
  --color-text-muted:     #9CA3AF;   /* Disabled, timestamps */
  --color-text-on-brand:  #FFFFFF;   /* Text on brand-colored backgrounds */

  /* ── Border ── */
  --color-border:         rgba(26, 23, 16, 0.10);   /* Subtle dividers */
  --color-border-focus:   var(--color-brand);        /* Focus ring */
}
```

---

## Typography Tokens

```css
:root {
  /* ── Font Families ── */
  --font-heading: 'Prompt', sans-serif;       /* Headlines, UI labels */
  --font-body:    'IBM Plex Sans Thai', 'IBM Plex Sans', sans-serif; /* Body, data */

  /* ── Font Sizes (fluid scale) ── */
  --text-xs:   0.75rem;   /* 12px — timestamp, badge label */
  --text-sm:   0.875rem;  /* 14px — table cells, secondary labels */
  --text-base: 1rem;      /* 16px — body default */
  --text-md:   1.05rem;   /* 16.8px — card body */
  --text-lg:   1.125rem;  /* 18px — section subheadings */
  --text-xl:   1.25rem;   /* 20px — card headings */
  --text-2xl:  1.5rem;    /* 24px — page headlines */
  --text-3xl:  1.875rem;  /* 30px — hero / display (rare) */

  /* ── Font Weights ── */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* ── Line Height ── */
  --leading-tight:  1.25;  /* Headings */
  --leading-normal: 1.5;   /* UI labels */
  --leading-relaxed: 1.7;  /* Body — "conversation text" */

  /* ── Letter Spacing ── */
  --tracking-tight:  -0.01em;
  --tracking-normal:  0;
  --tracking-wide:    0.04em;  /* Uppercase labels, badges */
}
```

---

## Spacing Tokens

```css
:root {
  /* 4px base unit — T-shirt scale */
  --space-1:   0.25rem;   /*  4px */
  --space-2:   0.5rem;    /*  8px */
  --space-3:   0.75rem;   /* 12px */
  --space-4:   1rem;      /* 16px */
  --space-5:   1.25rem;   /* 20px */
  --space-6:   1.5rem;    /* 24px */
  --space-8:   2rem;      /* 32px */
  --space-10:  2.5rem;    /* 40px */
  --space-12:  3rem;      /* 48px */
  --space-16:  4rem;      /* 64px */
  --space-20:  5rem;      /* 80px */

  /* Named semantic aliases */
  --space-card-padding:   var(--space-6);
  --space-section-gap:    var(--space-8);
  --space-page-x:         var(--space-6);   /* Horizontal page margin */
  --space-page-y:         var(--space-8);   /* Vertical page margin */
}
```

---

## Border Radius Tokens

```css
:root {
  --radius-sm:   0.375rem;   /*  6px — badges, tags */
  --radius-md:   0.5rem;     /*  8px — inputs, buttons */
  --radius-lg:   0.75rem;    /* 12px — cards */
  --radius-xl:   1rem;       /* 16px — modals, drawers */
  --radius-2xl:  1.5rem;     /* 24px — floating panels */
  --radius-full: 9999px;     /* Pills, avatars */
}
```

---

## Elevation & Shadow Tokens

```css
:root {
  /* Glassmorphism surface */
  --glass-bg:              rgba(255, 255, 255, 0.06);
  --glass-backdrop:        blur(14px);
  --glass-border:          1px solid rgba(255, 255, 255, 0.12);

  /* Shadow scale (diffused — no harsh drop shadows) */
  --shadow-sm:   0 2px  8px rgba(0, 0, 0, 0.06);
  --shadow-md:   0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg:   0 12px 40px rgba(0, 0, 0, 0.10);

  /* Brand glow — primary CTA only */
  --shadow-brand: 0 4px 20px var(--color-brand-glow);

  /* Input / form underline */
  --input-border-idle:  2px solid rgba(26, 23, 16, 0.15);
  --input-border-focus: 2px solid var(--color-brand);
}
```

---

## Animation Tokens

```css
:root {
  /* Durations */
  --duration-fast:    150ms;
  --duration-normal:  300ms;   /* Default — "Zuri Pulse" */
  --duration-slow:    500ms;

  /* Easing */
  --ease-default:  cubic-bezier(0.25, 0.8, 0.25, 1);   /* Zuri Pulse */
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);   /* Bounce — use sparingly */

  /* Canonical transition shorthand */
  --transition-base:  all var(--duration-normal) var(--ease-default);
  --transition-fast:  all var(--duration-fast) var(--ease-out);
}
```

---

## Z-Index Tokens

```css
:root {
  --z-below:    -1;
  --z-base:      0;
  --z-raised:   10;   /* Cards with hover elevation */
  --z-dropdown: 100;  /* Dropdowns, tooltips */
  --z-sticky:   200;  /* Sticky headers */
  --z-sidebar:  300;  /* Sidebar nav */
  --z-modal:    400;  /* Modals, dialogs */
  --z-toast:    500;  /* Toast notifications */
  --z-overlay:  600;  /* Full-screen overlays */
}
```

---

## Usage Rules

1. **Never hardcode raw values** in component files — always reference a token.
2. **Semantic over primitive** — prefer `--color-brand` over `#E8820C` in CSS.
3. **Glassmorphism** is for layered nav/cards only — not inline content areas.
4. **Brand glow** (`--shadow-brand`) is reserved for primary CTA buttons and the Z-logo mark.
5. **`--transition-base`** is the default for all interactive elements (buttons, links, cards).
