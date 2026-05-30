# BarberZap Admin Panel - Design Tokens

> **Last Updated:** 2026-02-25  
> **Version:** 1.0.0  
> **Theme:** Dark Professional with Gold Accents

---

## Table of Contents
- [Color Palette](#color-palette)
- [Typography Scale](#typography-scale)
- [Spacing System](#spacing-system)
- [Border Radius](#border-radius)
- [Shadows & Effects](#shadows--effects)
- [Animation Tokens](#animation-tokens)
- [Z-Index Scale](#z-index-scale)
- [Breakpoints](#breakpoints)
- [Tailwind Configuration](#tailwind-configuration)

---

## Color Palette

### Primary Colors (Gold/Amber Accent)

| Token | CSS Variable | HSL/Hex | Usage |
|-------|--------------|---------|-------|
| `gold-50` | `--color-gold-50` | `hsl(45, 100%, 97%)` | Ultra light gold backgrounds |
| `gold-100` | `--color-gold-100` | `hsl(45, 96%, 92%)` | Light gold highlights |
| `gold-200` | `--color-gold-200` | `hsl(45, 93%, 84%)` | Subtle gold borders |
| `gold-300` | `--color-gold-300` | `hsl(43, 93%, 73%)` | Gold tints |
| `gold-400` | `--color-gold-400` | `hsl(38, 92%, 55%)` | Gold shades |
| `gold-500` | `--color-gold-500` | `hsl(38, 95%, 46%)` | **Primary accent** |
| `gold-600` | `--color-gold-600` | `#d97706` | Primary accent dark |
| `gold-700` | `--color-gold-700` | `#b45309` | Pressed states |
| `gold-800` | `--color-gold-800` | `#92400e` | Dark gold accents |
| `amber-400` | `--color-amber-400` | `#fbbf24` | Bright gold highlights |
| `amber-500` | `--color-amber-500` | `#f59e0b` | Secondary gold accent |

```css
:root {
  /* Gold/Amber Primary */
  --color-gold-50: 45  100%  97%;
  --color-gold-100: 45  96%   92%;
  --color-gold-200: 45  93%   84%;
  --color-gold-300: 43  93%   73%;
  --color-gold-400: 38  92%   55%;
  --color-gold-500: 38  95%   46%;
  --color-gold-600: 27  91%   47%;
  --color-gold-700: 23  79%   39%;
  --color-gold-800: 24  67%   32%;
  
  /* Amber Variants */
  --color-amber-400: 38  92%   50%;
  --color-amber-500: 35  87%   47%;
}
```

### Background Colors (Slate Dark Theme)

| Token | CSS Variable | HSL | Usage |
|-------|--------------|-----|-------|
| `bg-primary` | `--bg-primary` | `hsl(222, 47%, 11%)` | Main page background |
| `bg-secondary` | `--bg-secondary` | `hsl(217, 33%, 17%)` | Card/panel background |
| `bg-tertiary` | `--bg-tertiary` | `hsl(215, 28%, 22%)` | Nested backgrounds |
| `bg-elevated` | `--bg-elevated` | `hsl(217, 33%, 25%)` | Elevated surfaces |
| `bg-glass` | `--bg-glass` | `hsla(217, 33%, 17%, 0.5)` | Glass morphism |

```css
:root {
  /* Backgrounds - Slate Dark */
  --bg-primary: 222 47% 11%;     /* slate-900 equivalent */
  --bg-secondary: 217 33% 17%;   /* slate-800 equivalent */
  --bg-tertiary: 215 28% 22%;    /* slate-700/800 mix */
  --bg-elevated: 217 33% 25%;
  --bg-glass: 217 33% 17% / 0.5;
  
  /* Light backgrounds for contrast areas */
  --bg-overlay: 0 0% 0% / 0.75;
  --bg-glass-light: 0 0% 100% / 0.05;
}
```

### Text Colors (High Contrast)

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `text-primary` | `--text-primary` | Main headings, important text |
| `text-secondary` | `--text-secondary` | Body text, labels |
| `text-tertiary` | `--text-tertiary` | Captions, helper text |
| `text-muted` | `--text-muted` | Disabled states |
| `text-inverse` | `--text-inverse` | Text on gold/dark backgrounds |

```css
:root {
  /* Text Colors */
  --text-primary: 0 0% 100%;        /* White */
  --text-secondary: 215 20% 65%;   /* Cool gray-400 */
  --text-tertiary: 215 16% 47%;    /* Cool gray-500 */
  --text-muted: 215 16% 35%;       /* Cool gray-600 */
  --text-inverse: 0 0% 7%;         /* Near black */
  
  /* Link Colors */
  --text-link: 38 95% 46%;
  --text-link-hover: 38 100% 50%;
}
```

### Status Colors (Semantic)

| Token | CSS Variable | HSL | Usage |
|-------|--------------|-----|-------|
| `success` | `--color-success` | `hsl(142, 71%, 45%)` | Completed, active |
| `success-bg` | `--color-success-bg` | `hsl(142, 71%, 45%, 0.15)` | Success backgrounds |
| `warning` | `--color-warning` | `hsl(38, 95%, 46%)` | Pending, attention |
| `warning-bg` | `--color-warning-bg` | `hsl(38, 95%, 46%, 0.15)` | Warning backgrounds |
| `error` | `--color-error` | `hsl(0, 84%, 60%)` | Cancelled, errors |
| `error-bg` | `--color-error-bg` | `hsl(0, 84%, 60%, 0.15)` | Error backgrounds |
| `info` | `--color-info` | `hsl(201, 89%, 52%)` | Information, neutral |
| `info-bg` | `--color-info-bg` | `hsl(201, 89%, 52%, 0.15)` | Info backgrounds |

```css
:root {
  /* Status Colors */
  --color-success: 142 71% 45%;
  --color-success-bg: 142 71% 45% / 0.15;
  
  --color-warning: 38 95% 46%;
  --color-warning-bg: 38 95% 46% / 0.15;
  
  --color-error: 0 84% 60%;
  --color-error-bg: 0 84% 60% / 0.15;
  
  --color-info: 201 89% 52%;
  --color-info-bg: 201 89% 52% / 0.15;
}
```

### Border Colors

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `border-default` | `--border-default` | Standard borders |
| `border-hover` | `--border-hover` | Hover states |
| `border-focus` | `--border-focus` | Focus rings |
| `border-muted` | `--border-muted` | Subtle dividers |

```css
:root {
  /* Border Colors */
  --border-default: 216 33% 25%;
  --border-hover: 216 33% 35%;
  --border-focus: 38 95% 46%;
  --border-muted: 215 16% 20%;
  
  /* Border opacity modifiers */
  --border-opacity-subtle: 0.3;
  --border-opacity-default: 0.5;
  --border-opacity-strong: 1;
}
```

---

## Typography Scale

### Font Families

```css
:root {
  --font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  --font-heading: 'Plus Jakarta Sans', 'Inter', sans-serif;
}
```

### Type Scale (Modular Scale 1.25)

| Level | Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|-------|------|--------|-------------|----------------|-------|
| **Display** | `--font-display` | 48px | 700 | 1.1 | -1% | Hero titles |
| **H1** | `--font-h1` | 36px | 600 | 1.2 | -1% | Page titles |
| **H2** | `--font-h2` | 28px | 600 | 1.25 | 0% | Section headers |
| **H3** | `--font-h3` | 22px | 600 | 1.3 | 0% | Card titles |
| **H4** | `--font-h4` | 18px | 600 | 1.4 | 0% | Subsection headers |
| **Body Large** | `--font-body-lg` | 16px | 400 | 1.6 | 0% | Primary body text |
| **Body** | `--font-body-base` | 14px | 400 | 1.5 | 0% | Default text |
| **Body Small** | `--font-body-sm` | 13px | 400 | 1.5 | 0% | Labels, captions |
| **Caption** | `--font-caption` | 12px | 400 | 1.4 | 0% | Helper text |
| **Overline** | `--font-overline` | 11px | 600 | 1.2 | 5% | Tags, badges |


| Code | `--font-code` | 13px | 400 | 1.5 | 0% | Code snippets |

```css
:root {
  /* Type Scale */
  --font-display: 48px;
  --font-h1: 36px;
  --font-h2: 28px;
  --font-h3: 22px;
  --font-h4: 18px;
  --font-body-lg: 16px;
  --font-body-base: 14px;
  --font-body-sm: 13px;
  --font-caption: 12px;
  --font-overline: 11px;
  --font-code: 13px;
  
  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.1;
  --leading-snug: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.6;
  --leading-loose: 1.8;
  
  /* Letter Spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}
```

---

## Spacing System

### 8-Point Grid System

All spacing values follow the 8-point grid system (multiples of 4px for half-steps).

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | No spacing |
| `space-1` | 4px | Tight spacing, icon gaps |
| `space-2` | 8px | Small gaps, padding-xs |
| `space-3` | 12px | Compact spacing |
| `space-4` | 16px | Standard spacing, padding-sm |
| `space-5` | 20px | Medium spacing |
| `space-6` | 24px | Comfortable spacing, padding-md |
| `space-8` | 32px | Sections, padding-lg |
| `space-10` | 40px | Large sections |
| `space-12` | 48px | Major sections, padding-xl |
| `space-16` | 64px | Page margins, hero spacing |
| `space-20` | 80px | Container gaps |
| `space-24` | 96px | Major vertical breaks |

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
  --space-24: 6rem;    /* 96px */
}

/* Container Padding Tokens */
:root {
  --container-padding-xs: var(--space-2);
  --container-padding-sm: var(--space-4);
  --container-padding-md: var(--space-6);
  --container-padding-lg: var(--space-8);
  --container-padding-xl: var(--space-12);
}
```

### Gap Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `gap-xs` | 4px | Icon + label |
| `gap-sm` | 8px | Compact grids |
| `gap-md` | 12px | Card grids |
| `gap-lg` | 16px | Form fields |
| `gap-xl` | 24px | Section columns |

```css
:root {
  --gap-xs: var(--space-1);
  --gap-sm: var(--space-2);
  --gap-md: var(--space-3);
  --gap-lg: var(--space-4);
  --gap-xl: var(--space-6);
}
```

---

## Border Radius

### Roundness Scale

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0px | Square elements |
| `radius-sm` | 4px | Small buttons, badges |
| `radius-base` | 8px | Cards, inputs, buttons |
| `radius-md` | 12px | Modals, panels |
| `radius-lg` | 16px | Large cards |
| `radius-xl` | 24px | Hero sections, major containers |
| `radius-full` | 9999px | Pills, avatars |

```css
:root {
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-base: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}
```

---

## Shadows & Effects

### Glass Morphism Effects

| Token | Value | Usage |
|-------|-------|-------|
| `glass-sm` | `backdrop-blur-sm bg-slate-800/30` | Light glass overlay |
| `glass-base` | `backdrop-blur-md bg-slate-800/50` | Standard glass |
| `glass-lg` | `backdrop-blur-lg bg-slate-800/60` | Heavy glass |
| `glass-xl` | `backdrop-blur-xl bg-slate-800/70` | Deep glass |

```css
:root {
  /* Glass Morphism */
  --backdrop-blur-sm: blur(4px);
  --backdrop-blur-md: blur(8px);
  --backdrop-blur-lg: blur(12px);
  --backdrop-blur-xl: blur(16px);
  
  /* Glass Backgrounds */
  --glass-bg-sm: hsl(217 33% 17% / 0.3);
  --glass-bg-md: hsl(217 33% 17% / 0.5);
  --glass-bg-lg: hsl(217 33% 17% / 0.6);
  --glass-bg-xl: hsl(217 33% 17% / 0.7);
  
  /* Glass Borders */
  --glass-border: hsl(217 33% 25% / 0.5);
}
```

### Card Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-none` | none | Flat elements |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle elevation |
| `shadow-base` | `0 4px 6px rgba(0,0,0,0.4)` | Cards |
| `shadow-md` | `0 8px 16px rgba(0,0,0,0.5)` | Elevated cards |
| `shadow-lg` | `0 16px 32px rgba(0,0,0,0.6)` | Modals, dropdowns |
| `shadow-glow-gold` | `0 0 20px rgba(251, 191, 36, 0.3)` | Gold glow accent |
| `shadow-glow-blue` | `0 0 20px rgba(59, 130, 246, 0.3)` | Blue glow accent |

```css
:root {
  /* Shadows */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px hsl(0 0% 0% / 0.3);
  --shadow-base: 0 4px 6px hsl(0 0% 0% / 0.4);
  --shadow-md: 0 8px 16px hsl(0 0% 0% / 0.5);
  --shadow-lg: 0 16px 32px hsl(0 0% 0% / 0.6);
  --shadow-xl: 0 24px 48px hsl(0 0% 0% / 0.7);
  
  /* Glow Effects */
  --shadow-glow-gold: 0 0 20px hsl(38 92% 50% / 0.3);
  --shadow-gold-subtle: 0 0 10px hsl(38 92% 50% / 0.2);
  --shadow-glow-blue: 0 0 20px hsl(217 91% 60% / 0.3);
  --shadow-glow-green: 0 0 20px hsl(142 71% 45% / 0.3);
  --shadow-glow-red: 0 0 20px hsl(0 84% 60% / 0.3);
}
```

---

## Animation Tokens

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `duration-instant` | 50ms | Immediate feedback |
| `duration-fast` | 150ms | Hover states, micro-interactions |
| `duration-base` | 300ms | Standard transitions |
| `duration-slow` | 500ms | Page transitions, modals |
| `duration-slower` | 700ms | Complex animations |
| `duration-duration` | 1000ms | Entrance animations |

```css
:root {
  --duration-instant: 50ms;
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 700ms;
  --duration-duration: 1000ms;
}
```

### Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `ease-linear` | `linear` | Continuous animations |
| `ease-out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | Exit transitions |
| `ease-in` | `cubic-bezier(0.55, 0.055, 0.675, 0.19)` | Enter transitions |
| `ease-in-out` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | Full cycles |
| `ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Bouncy feedback |
| `ease-elastic` | `cubic-bezier(0.68, -0.6, 0.32, 1.6)` | Spring effects |
| `ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard smooth |

```css
:root {
  --ease-linear: linear;
  --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-in: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  --ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Transition Presets

| Token | Value | Usage |
|-------|-------|-------|
| `transition-fast` | `150ms ease-out` | Hover effects |
| `transition-base` | `300ms ease-out` | Standard transitions |
| `transition-slow` | `500ms ease-in-out` | Modal/drawer animations |
| `transition-glow` | `300ms ease-smooth` | Glow/pulse effects |

```css
:root {
  --transition-fast: 150ms var(--ease-out);
  --transition-base: 300ms var(--ease-out);
  --transition-slow: 500ms var(--ease-in-out);
  --transition-glow: 300ms var(--ease-smooth);
}

/* Keyframe Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideLeft {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideRight {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes scaleOut {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes glow {
  0%, 100% { box-shadow: var(--shadow-gold-subtle); }
  50% { box-shadow: var(--shadow-glow-gold); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
```

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-dropdown` | 100 | Dropdown menus |
| `z-sticky` | 200 | Sticky headers |
| `z-fixed` | 300 | Fixed elements |
| `z-modal-backdrop` | 400 | Modal backdrop |
| `z-modal` | 500 | Modal content |
| `z-popover` | 600 | Popovers, tooltips |
| `z-notification` | 700 | Toast notifications |
| `z-max` | 999 | Top layer |

```css
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-notification: 700;
  --z-max: 999;
}
```

---

## Breakpoints

Responsive breakpoints following Tailwind's default system.

| Token | Min Width | Device | Usage |
|-------|-----------|--------|-------|
| `xs` | 0px | Extra small phones | Base styles |
| `sm` | 640px | Small phones | Mobile |
| `md` | 768px | Tablets | Tablet portrait |
| `lg` | 1024px | Small laptops | Tablet landscape / Laptop |
| `xl` | 1280px | Desktops | Desktop |
| `2xl` | 1536px | Large desktops | Large screens |

```css
:root {
  --breakpoint-xs: 0;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Container Max Widths

| Token | Value | Usage |
|-------|-------|-------|
| `container-sm` | 640px | Small content |
| `container-md` | 768px | Medium content |
| `container-lg` | 1024px | Default content |
| `container-xl` | 1280px | Wide content |
| `container-2xl` | 1536px | Full content |

```css
:root {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}
```

---

## Tailwind Configuration

### `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx,vue,svelte}',
    './components/**/*.{js,jsx,ts,tsx,vue,svelte}',
    './app/**/*.{js,jsx,ts,tsx,vue,svelte}',
  ],
  theme: {
    extend: {
      colors: {
        // Gold/Amber Primary
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        // Slate Backgrounds
        slate: {
          850: '#151e32',
          950: '#020617',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'overline': ['11px', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(251, 191, 36, 0.3)',
        'glow-gold-subtle': '0 0 10px rgba(251, 191, 36, 0.2)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'fade-out': 'fadeOut 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'slide-left': 'slideLeft 300ms ease-out',
        'slide-right': 'slideRight 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'scale-out': 'scaleOut 200ms ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(251, 191, 36, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      zIndex: {
        'dropdown': 100,
        'sticky': 200,
        'fixed': 300,
        'modal-backdrop': 400,
        'modal': 500,
        'popover': 600,
        'notification': 700,
      },
    },
  },
  plugins: [],
}
```

### `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## CSS Variables Quick Reference

Copy this into your global CSS file:

```css
@layer base {
  :root {
    /* === Colors === */
    /* Gold/Amber Primary */
    --color-gold-50: 45 100% 97%;
    --color-gold-100: 45 96% 92%;
    --color-gold-200: 45 93% 84%;
    --color-gold-300: 43 93% 73%;
    --color-gold-400: 38 92% 55%;
    --color-gold-500: 38 95% 46%;
    --color-gold-600: 27 91% 47%;
    --color-gold-700: 23 79% 39%;
    --color-gold-800: 24 67% 32%;
    
    /* Amber */
    --color-amber-400: 38 92% 50%;
    --color-amber-500: 35 87% 47%;
    
    /* Backgrounds */
    --bg-primary: 222 47% 11%;
    --bg-secondary: 217 33% 17%;
    --bg-tertiary: 215 28% 22%;
    --bg-elevated: 217 33% 25%;
    --bg-glass: 217 33% 17% / 0.5;
    --bg-overlay: 0 0% 0% / 0.75;
    
    /* Text Colors */
    --text-primary: 0 0% 100%;
    --text-secondary: 215 20% 65%;
    --text-tertiary: 215 16% 47%;
    --text-muted: 215 16% 35%;
    --text-inverse: 0 0% 7%;
    --text-link: 38 95% 46%;
    
    /* Status Colors */
    --color-success: 142 71% 45%;
    --color-success-bg: 142 71% 45% / 0.15;
    --color-warning: 38 95% 46%;
    --color-warning-bg: 38 95% 46% / 0.15;
    --color-error: 0 84% 60%;
    --color-error-bg: 0 84% 60% / 0.15;
    --color-info: 201 89% 52%;
    --color-info-bg: 201 89% 52% / 0.15;
    
    /* Border Colors */
    --border-default: 216 33% 25%;
    --border-hover: 216 33% 35%;
    --border-focus: 38 95% 46%;
    --border-muted: 215 16% 20%;
    
    /* === Typography === */
    --font-display: 48px;
    --font-h1: 36px;
    --font-h2: 28px;
    --font-h3: 22px;
    --font-h4: 18px;
    --font-body-lg: 16px;
    --font-body-base: 14px;
    --font-body-sm: 13px;
    --font-caption: 12px;
    --font-overline: 11px;
    
    /* === Spacing === */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-12: 3rem;
    
    /* === Border Radius === */
    --radius-sm: 4px;
    --radius-base: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-full: 9999px;
    
    /* === Transitions === */
    --duration-fast: 150ms;
    --duration-base: 300ms;
    --duration-slow: 500ms;
    --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
    --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    
    /* === Shadows === */
    --shadow-sm: 0 1px 2px hsl(0 0% 0% / 0.3);
    --shadow-base: 0 4px 6px hsl(0 0% 0% / 0.4);
    --shadow-md: 0 8px 16px hsl(0 0% 0% / 0.5);
    --shadow-lg: 0 16px 32px hsl(0 0% 0% / 0.6);
    --shadow-glow-gold: 0 0 20px hsl(38 92% 50% / 0.3);
    
    /* === Z-Index === */
    --z-dropdown: 100;
    --z-sticky: 200;
    --z-modal: 500;
    --z-notification: 700;
  }
}

/* === Glass Morphism Utility === */
.glass {
  background: hsl(var(--bg-glass));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border-default) / 0.5);
}

.glass-strong {
  background: hsl(217 33% 17% / 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid hsl(var(--border-default));
}
```

---

## Color Swatches Overview

```
GOLD/AMBER PRIMARY
┌─────────────────────────────────────────────────┐
│ ████ gold-50   ████ gold-100  ████ gold-200    │ Light tints
│ ████ gold-300  ████ gold-400  ████ gold-500    │ Standard
│ ████ gold-600  ████ gold-700  ████ gold-800    │ Dark shades
└─────────────────────────────────────────────────┘

BACKGROUND - SLATE DARK
┌─────────────────────────────────────────────────┐
│                                                │
│  bg-primary (slate-900) ━━━━━━ Deepest dark    │
│  bg-secondary (slate-800) ━━━ Dark cards      │
│  bg-tertiary (slate-700) ━━━─ Light panels     │
│                                                │
└─────────────────────────────────────────────────┘

STATUS COLORS
┌─────────────────────────────────────────────────┐
│ ● Success:  Green-500 (Emerald)                │
│ ● Warning:  Amber-500 (Gold)                  │
│ ● Error:    Red-500                            │
│ ● Info:     Blue-500                           │
└─────────────────────────────────────────────────┘
```

---

## Usage Examples

### Apply Design Tokens in CSS

```css
.my-card {
  background: hsl(var(--bg-secondary));
  border: 1px solid hsl(var(--border-default));
  border-radius: var(--radius-base);
  padding: var(--space-6);
  box-shadow: var(--shadow-base);
  transition: all var(--duration-base) var(--ease-out);
}

.my-card:hover {
  border-color: hsl(var(--border-hover));
  box-shadow: var(--shadow-md);
}

.my-heading {
  font-size: var(--font-h2);
  font-weight: 600;
  color: hsl(var(--text-primary));
  line-height: var(--leading-snug);
}

.gold-accent {
  color: hsl(var(--color-gold-500));
}

.gold-glow {
  box-shadow: var(--shadow-glow-gold);
}
```

### Apply with Tailwind Classes

```html
<!-- Card with Glass Effect -->
<div class="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-md">
  <!-- Content -->
</div>

<!-- Gold Button -->
<button class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg px-6 py-3 transition-all duration-150">
  Book Appointment
</button>

<!-- Status Badge -->
<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
  <span class="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
  Active
</span>
```

---

## Design System Philosophy

### Core Principles

1. **Professional Confidence** - Gold accents convey premium quality without being flashy
2. **High Contrast** - Dark backgrounds with bright text ensure readability
3. **8-Point Grid** - Consistent spacing creates visual harmony
4. **Subtle Depth** - Glass morphism and shadows add polish without distraction
5. **Clear Hierarchy** - Typography and color guide user attention naturally

### Accessibility Targets

- **Contrast Ratio:** WCAG AA minimum 4.5:1 for normal text, 3:1 for large text
- **Touch Targets:** Minimum 44×44px for interactive elements
- **Focus States:** Visible 2px gold border with glow effect
- **Motion:** Respect `prefers-reduced-motion` for animations

---

**End of Design Tokens Document**
