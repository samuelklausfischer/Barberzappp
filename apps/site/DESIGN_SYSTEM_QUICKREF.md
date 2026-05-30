# BarberZap Design System - Quick Reference

> **Visual Cheat Sheet** - Referência rápida para desenvolvedores

---

## Color Palette

### Primary Colors
```
Gold/Amber (Primary)
HSL: 45 100% 50%      →  #eab308
Tailwind: bg-primary  text-primary  border-primary

Variant Opacities:
bg-primary/5   bg-primary/10   bg-primary/20   bg-primary/30
bg-primary/50  (shadows)
```

### Background System
```
Background Base  HSL: 20 14.3% 4.1%     →  #0b0c0d
Card Base        HSL: 24 9.8% 10%       →  #191a1c
Secondary        HSL: 240 3.7% 15.9%    →  #2a2b33
Muted            HSL: 240 3.7% 15.9%    →  #2a2b33
```

### Text Colors
```
Foreground      HSL: 0 0% 95%          →  #f2f2f2  (primary text)
Muted Foreground HSL: 240 5% 64.9%    →  #a1a1aa  (secondary text)
Primary FG      HSL: 26 83.3% 14.1%    →  #2d2f1b  (text on gold bg)
```

### Status Colors
```
Success  →  text-emerald-400  bg-emerald-400/10
Warning  →  text-amber-400   bg-amber-400/10
Error    →  text-red-400     bg-red-400/10
Info     →  text-primary     bg-primary/10
```

### Border Colors
```
Base Border    →  HSL: 240 3.7% 15.9%  →  #2a2b33
Primary Border →  border-primary
White tint     →  border-white/10, border-white/5
```

## Typography Scale

```
┌─────────────────────┬────────┬──────────────────────────────────────┐
│ Uso                 │ Classe │ Tamanho                               │
├─────────────────────┼────────┼──────────────────────────────────────┤
│ Labels micro        │text-[8px]│ 8px                              │
│ Labels/badges       │text-[10px]│ 10px                            │
│ Small copy          │text-[9px]│ 9px                             │
│ Body small          │text-xs  │ 12px                             │
│ Body                │text-sm  │ 14px                             │
│ Subtitle            │text-base│ 16px                             │
│ Section heading     │text-lg  │ 18px                             │
│ Card title          │text-xl  │ 20px                             │
│ Page title          │text-2xl-3xl│ 24-36px                        │
│ Hero titles         │text-4xl-7xl│ 36-72px                        │
│ Pricing display     │text-8xl-9xl│ 96-128px                       │
└─────────────────────┴────────┴──────────────────────────────────────┘
```

### Font Weights
```
font-black   →  Títulos principais, CTAs, logotipos
font-bold    →  Subtítulos, itens de lista, valores
font-semibold→  Botões padrão
font-medium  →  Descrições, parágrafos
```

### Typography Modifiers
```
italic                 →  Títulos, subtítulos, marca
uppercase              →  Headlines, badges, labels
tracking-widest        →  Labels largos
tracking-tighter       →  Headlines compactas
tracking-[0.2em]       →  Badges com espaçamento
tracking-[0.3em]       →  Badges muito largos
```

## Spacing Scale

### Section spacing
```
Mobile: py-20    (80px)  →  Seções padrão
Desktop: py-24   (96px)  →  Seções principais
Small:    py-16   (64px)  →  Seções menores
```

### Component spacing
```
gap-2     (8px)   →  Small gaps
gap-3     (12px)  →  Medium gaps
gap-4     (16px)  →  Standard gaps
gap-6     (24px)  →  Large gaps
gap-8     (32px)  →  XL gaps
gap-12    (48px)  →  Section grid gaps
```

### Padding
```
p-4       (16px)  →  Card standard
p-6       (24px)  →  Card medium
p-8       (32px)  →  Card large
p-10      (40px)  →  Modal, pricing card
px-4      (16px)  →  Button standard
px-6      (24px)  →  Button large
```

## Border Radius

```
rounded-lg       →  8px    (buttons, inputs)
rounded-xl       →  12px   (cards, badges)
rounded-2xl      →  16px   (icon containers, modals)
rounded-[2rem]   →  32px   (image containers)
rounded-[2.5rem] →  40px   (modal container)
rounded-[3rem]   →  48px   (comparison card, hero)
rounded-full     →  100%   (badges, circles)
```

## Shadows

```
shadow-lg        →  Soft shadow
shadow-xl        →  Large shadow
shadow-2xl       →  Extra large (hero image, modal)
shadow-[0_0_15px_rgba(234,179,8,0.4)]  →  Primary glow small
shadow-[0_0_30px_rgba(234,179,8,0.4)]  →  Primary glow large
shadow-[0_0_40px_rgba(234,179,8,0.25)] →  Card glow
shadow-[0_0_50px_rgba(234,179,8,0.05)] →  Subtle glow
shadow-[0_20px_50px_rgba(234,179,8,0.2)]→ Image glow
```

## Backdrop Blur

```
backdrop-blur-sm   →  4px   (subtle)
backdrop-blur-md   →  12px  (medium)
backdrop-blur-lg   →  16px  (strong)
backdrop-blur-xl   →  24px  (very strong)

Common组合:
bg-background/90 backdrop-blur-lg
bg-card/90 backdrop-blur-lg
bg-black/80 backdrop-blur-md
```

## Z-Index Layers

```
z-10     →  Content over gradient backgrounds
z-20     →  Badges on cards
z-50     →  Navbar (fixed)
z-[100]  →  Social proof notification
z-[200]  →  Image lightbox
z-[300]  →  Modal (highest)
```

## Common Component Patterns

### Button
```
Base: inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus:outline-none

Variants:
default:  bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]
outline:  border border-primary/20 bg-transparent hover:bg-primary/10 text-primary
hero:     bg-primary text-primary-foreground font-black text-xl px-8 py-4 hover:scale-105 shadow-2xl tracking-tighter
cta:      bg-primary text-primary-foreground font-bold border-2 border-primary hover:bg-transparent hover:text-primary
```

### Card
```
Standard: bg-card border border-border rounded-xl hover:border-primary/30 transition-colors

Highlight: bg-primary/5 border-2 border-primary/20 rounded-[2rem] p-6 md:p-8 shadow-[0_0_50px_rgba(234,179,8,0.05)]

With icon: w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary
```

### Input Field
```
Label: text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 block
Input: w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-primary outline-none transition-all

With icon: pl-10 (padding left to make room for icon)
Error: border-red-400
```

### Badge
```
Small: text-[8px] font-black px-3 py-1
Medium: text-[10px] font-black uppercase tracking-widest badge-base

Outline: bg-primary/10 border border-primary/20 text-primary
Solid: bg-primary text-primary-foreground
```

### Avatar
```
Small: w-8 h-8 px-2 py-1
Medium: w-12 h-12
Large: w-16 h-16

Styles:
bg-primary/20 rounded-full flex items-center justify-center font-black text-primary border border-primary/30
bg-primary rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-primary/20
```

### Modal
```
Overlay: fixed inset-0 z-[300] bg-black/80 backdrop-blur-md

Container: bg-card border-t-4 border-primary w-full max-w-md rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl

Close button: absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors
```

## Utility Classes (Add to index.css)

```css
/* Gradient text */
.text-gradient-primary {
  @apply bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-clip-text text-transparent;
}

/* Glass morphism */
.glass {
  @apply bg-background/60 backdrop-blur-xl border border-white/5;
}

.glass-heavy {
  @apply bg-background/80 backdrop-blur-2xl border border-border;
}

/* Custom scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}
```

## Animations

### CSS Keyframes (in index.css)
```css
@keyframes pulse-gold {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.8; 
    transform: scale(1.02); 
    filter: drop-shadow(0 0 15px rgba(234,179,8,0.4)); 
  }
}

.animate-pulse-gold {
  animation: pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Framer Motion Patterns
```jsx
// Fade up
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, amount: 0.3 }}
transition={{ duration: 0.6 }}

// Stagger
transition={{ delay: i * 0.1 }}

// Pulse continuous
animate={{ 
  scale: [1, 1.1, 1], 
  opacity: [0.3, 0.6, 0.3] 
}}
transition={{ 
  duration: 4, 
  repeat: Infinity, 
  ease: "easeInOut" 
}}

// Modal entry/exit
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
initial={{ scale: 0.9, y: 20 }}
animate={{ scale: 1, y: 0 }}
exit={{ scale: 0.9, y: 20 }}
```

## Responsive Breakpoints

```
Mobile  →  - (default)
SM      →  640px (sm:...)
MD      →  768px (md:...)
LG      →  1024px (lg:...)
XL      →  1280px (xl:...)

Common patterns:
hidden md:block           →  Desktop only
block md:hidden           →  Mobile only
grid-cols-1 md:grid-cols-2 lg:grid-cols-3  →  Responsive grid
text-4xl md:text-7xl      →  Responsive typography
```

## Grid Patterns

```
2 column:
grid grid-cols-1 md:grid-cols-2 gap-6

3 column:
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

4 column:
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6
```

## Max-Width Reference

```
max-w-xs     →  320px   (modal small)
max-w-sm     →  384px   (mobile)
max-w-md     →  512px   (modal, pricing)
max-w-lg     →  512px
max-w-xl     →  448px
max-w-2xl    →  672px
max-w-3xl    →  768px   (FAQ, form)
max-w-4xl    →  896px   (footer)
max-w-5xl    →  1024px  (hero, lightbox)
max-w-6xl    →  1152px  (sections)
max-w-7xl    →  1280px  (dashboard)
max-w-8xl    →  1536px  (full width)
```

## Icons (Lucide React)

```bash
npm install lucide-react
```

### Common Sizes
```
Micro:   size={12}   (labels, small indicators)
Small:   size={14}   (checkmarks)
Medium:  size={16}   (standard UI)
Large:   size={20}   (table headers, sidebar)
XL:      size={24}   (sidebar items, highlights)
XXL:     size={28}   (section headers)
XXXL:    size={32}   (hero icons)
```

### Icon Containers
```
Small: w-10 h-10 bg-primary/20 rounded-lg
Medium: w-12 h-12 bg-primary/20 rounded-full
Large: w-16 h-16 bg-primary/10 rounded-2xl
```

## Dashboard-Specific Patterns

### Sidebar Item (Active)
```
bg-primary/10 text-primary border-l-2 border-primary
```

### Sidebar Item (Inactive)
```
text-muted-foreground hover:bg-white/5 hover:text-foreground
```

### Data Card
```
bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors
```

### Stat Card with Glow
```
bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.1)]
```

### Table Row
```
border-b border-border hover:bg-white/5 transition-colors
px-6 py-4
```

### Pagination Button
```
w-12 h-12 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 flex items-center justify-center
```

## Hover Effects

```
Hover scale:
hover:scale-105 transition-transform

Hover border:
hover:border-primary/30 transition-colors
hover:border-primary/50 transition-colors

Hover shadow:
hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]
hover:shadow-xl

Hover background:
hover:bg-primary/10
hover:bg-white/5
```

## Focus States

```
focus:border-primary outline-none
focus:ring-2 focus:ring-primary/50 outline-none
```

## Selection Style

```css
selection:bg-primary/30 selection:text-primary
```

Selection de texto usa primary/amarelo com 30% de opacidade.

## Quick Class Combinations

### Hero Title
```jsx
text-4xl md:text-7xl font-black leading-[1.1] italic tracking-tighter uppercase
```

### Section Title
```jsx
text-3xl md:text-5xl font-black mb-6 italic leading-tight uppercase
```

### Section Subtitle
```jsx
text-muted-foreground text-lg leading-relaxed
```

### Badge (Section Label)
```jsx
inline-block text-primary font-bold mb-4 uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20
```

### Logo Text
```jsx
text-xl font-bold italic uppercase tracking-tighter
Barber<span className="text-primary">Zap</span>
```

### CTA Button (Hero)
```jsx
bg-primary text-primary-foreground font-black text-xl px-8 py-4 hover:scale-105 transition-transform shadow-2xl tracking-tighter
```

### Card with Border
```jsx
bg-card border border-border rounded-[2rem] p-8 relative group hover:border-primary/30 transition-all shadow-xl
```

### Glass Card
```jsx
bg-card/90 backdrop-blur-lg border border-white/5
```

### Gradient Text
```jsx
text-gradient-gold
bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-clip-text text-transparent
```

## CSS Variables (Reference)

```css
:root {
  --background: 20 14.3% 4.1%;
  --foreground: 0 0% 95%;
  --card: 24 9.8% 10%;
  --card-foreground: 0 0% 95%;
  --primary: 45 100% 50%;
  --primary-foreground: 26 83.3% 14.1%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 45 100% 50%;
  --radius: 0.5rem;
}
```

## File Structure Reference

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── SectionHeading.jsx
│   │   ├── ScrollCard.jsx
│   │   └── AccordionItem.jsx
│   └── sections/
│       ├── HeroSection.jsx
│       ├── BenefitsSection.jsx
│       ├── ComparisonSection.jsx
│       └── ...
├── index.css          (CSS variables, custom classes)
├── App.jsx            (Main layout)
├── main.jsx
└── tailwind.config.js
```

## Common Import Patterns

```jsx
// Icons
import { Scissors, Menu, X, ChevronDown, CheckCircle } from 'lucide-react';

// Components
import Button from './components/ui/Button';
import SectionHeading from './components/ui/SectionHeading';

// Animation
import { motion, useScroll, useTransform } from 'framer-motion';
```

## Brand Identity Summary

```
Colors:  Dark theme with gold/amber accents
Style:   Bold, uppercase, italic typography
Vibe:    Premium, energetic, modern, barber/salon aesthetic
```

---

**Quick Reference End**

Use this sheet as a fast lookup while building the dashboard. For complete details, refer to `DESIGN_SYSTEM_ANALYSIS.md` and `DASHBOARD_COMPONENTS_GUIDE.md`.
