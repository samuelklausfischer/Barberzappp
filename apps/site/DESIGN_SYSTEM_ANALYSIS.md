# BarberZap Design System Analysis

> **Data**: 2026-02-23  
> **Versão**: 1.0  
> **Objetivo**: Extrair e documentar o design system da landing page para aplicação no dashboard admin

---

## 1. Color Palette

### 1.1 CSS Variables (HSL)
Todas as cores são definidas como variáveis HSL no `:root`:

```css
/* Light/Dark Mode - Single Dark Theme */
--background: 20 14.3% 4.1%;          /* #0b0c0d - Dark background */
--foreground: 0 0% 95%;               /* #f2f2f2 - Light text */
--card: 24 9.8% 10%;                  /* #191a1c - Card background */
--card-foreground: 0 0% 95%;          /* #f2f2f2 - Card text */
--popover: 0 0% 9%;                   /* #171717 - Popover bg */
--popover-foreground: 0 0% 95%;       /* #f2f2f2 */

/* Primary - Gold/Amber */
--primary: 45 100% 50%;               /* #eab308 - Gold/Yellow */
--primary-foreground: 26 83.3% 14.1%; /* #2d2f1b - Dark brown text on primary */

/* Secondary */
--secondary: 240 3.7% 15.9%;          /* #2a2b33 - Secondary bg */
--secondary-foreground: 0 0% 98%;     /* #fafafa */

/* Muted */
--muted: 240 3.7% 15.9%;              /* #2a2b33 */
--muted-foreground: 240 5% 64.9%;     /* #a1a1aa - Silver text */

/* Accent */
--accent: 240 3.7% 15.9%;             /* #2a2b33 */
--accent-foreground: 0 0% 98%;        /* #fafafa */

/* Destructive - Error */
--destructive: 0 62.8% 30.6%;         /* #7f1d1d - Red/Reddish */
--destructive-foreground: 0 0% 98%;   /* #fafafa */

/* Border & Input */
--border: 240 3.7% 15.9%;             /* #2a2b33 - Border color */
--input: 240 3.7% 15.9%;              /* #2a2b33 - Input border */
--ring: 45 100% 50%;                  /* #eab308 - Focus ring (primary) */

/* Border Radius */
--radius: 0.5rem;                     /* 8px */
```

### 1.2 Tailwind Color Tokens

```jsx
// Semântica
bg-background          // Background principal
bg-card                // Fundo de cards
bg-primary             // Gold/Amber (#eab308)
bg-secondary           // Cinza escuro (#2a2b33)
bg-muted               // Texto secundário bg
bg-destructive         // Vermelho erro

text-foreground        // Texto principal (95% branco)
text-muted-foreground  // Texto secundário (64.9% branco)
text-primary           // Gold/Amber
text-primary-foreground// Texto sobre primary

border-border          // Bordas
border-primary         // Borda gold
// etc.
```

### 1.3 Custom Gradients

```css
/* Gold Gradient */
.text-gradient-gold {
  background: linear-gradient(to right, #ca8a04, #facc15, #ca8a04);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Radial Background (Hero) */
bg-gradient-radial from-primary/10 to-transparent

/* Dark Gradient Background */
bg-gradient-dark (custom - likely from-dark/80 to-black)
```

### 1.4 Opacity Variants

Muito uso de opacidades com a paleta primária:
- `primary/5`, `primary/10`, `primary/20`, `primary/30`, `primary/40`
- `primary/50` (para sombras)
- `bg-white/5`, `bg-white/10` (para overlays)
- `bg-white/20` (backdrops)

---

## 2. Typography

### 2.1 Font Family
```css
font-sans  /* System default sans-serif */
```

### 2.2 Font Weights Used
```jsx
text-[10px]          // Labels, badges, tracking
font-black           // Títulos, CTAs, ênfase (fonte mais pesada)
font-bold            // Subtítulos, destaques
font-semibold        // Botões padrão
font-medium          // Descrições
```

### 2.3 Typography Scale

| Uso | Classe | Tamanho | Contexto |
|-----|--------|---------|----------|
| Labels/Badges | `text-[8px]` - `text-[10px]` | 8-10px | Uppercase, tracking-wide |
| Micro copy | `text-[9px]` | 9px | Disclaimers, legal |
| Small text | `text-xs` | 12px | Metadados |
| Body text | `text-sm` - `text-base` | 14-16px | Descrições, conteúdo |
| Subtítulos | `text-lg` - `text-xl` | 18-20px | Subsections |
| títulos | `text-3xl` - `text-5xl` | 30-48px | Section headings |
| Hero Títulos | `text-4xl` - `text-7xl` | 36-72px | Hero, principais CTAs |
| Destaques | `text-8xl` - `text-9xl` | 96-128px | Pricing display |

### 2.4 Typography Patterns

```jsx
// Uppercase + Italic + Tracking (Brand style)
font-black italic uppercase tracking-widest  // CTAs principais
font-black italic uppercase tracking-tighter  // Logos, títulos

// Tracking patterns
tracking-[0.2em]      // Badges, labels largos
tracking-[0.3em]      // Badges muito largos
tracking-widest       // Uppercase text
tracking-tighter      // Headlines compactas

// Italic patterns
italic                // Títulos, subtítulos, destaques
```

---

## 3. Spacing Scale

### 3.1 Container Padding
```jsx
px-4        // Mobile (16px)
container   // Responsivo com padding automático
```

### 3.2 Section Spacing
```jsx
py-20       // Seções padrão (80px)
py-24       // Seções principais (96px)
py-16       // Menor seções (64px)
mb-16       // Espaço após headings (64px)
mb-12       // Entre elementos (48px)
mb-8        // Espaço menor (32px)
```

### 3.3 Element Spacing
```jsx
gap-2       // 8px entre itens
gap-3       // 12px
gap-4       // 16px
gap-6       // 24px
gap-8       // 32px
gap-12      // 48px (grids)
```

### 3.4 Component Spacing
```jsx
p-4         // Padding padrão card (16px)
p-6         // Padding médio (24px)
p-8         // Padding grande (32px)
px-6 py-5   // Accordion items
p-10        // Modal, pricing card
```

---

## 4. Border Radius

```jsx
--radius: 0.5rem  // 8px (base)

// Used patterns
rounded-lg       // 8px - Default buttons, inputs
rounded-xl       // 12px - Cards, badges
rounded-2xl      // 16px - Icon containers, modals, input placeholders
rounded-[1rem]   // 16px - Specific use
rounded-3xl      // 24px - Testimonial cards, feature cards
rounded-[2rem]   // 32px - Image containers, hero cards
rounded-[2.5rem] // 40px - Modal, pricing cards
rounded-[3rem]   // 48px - Comparison cards, hero image
rounded-full     // 100% - Badges, icon circles
```

---

## 5. Shadows

### 5.1 Shadow Patterns

```jsx
shadow-lg          // Componentes destacados
shadow-xl          // Cards com destaque
shadow-2xl         // Hero image, pricing cards, modals
shadow-primary/20  // Sombra tintada com primary
shadow-primary/40  // Sombra mais forte (buttons)

// Glow effects
shadow-[0_0_15px_rgba(234,179,8,0.4)]  // Primary glow
shadow-[0_0_30px_rgba(234,179,8,0.4)]  // Strong glow
shadow-[0_0_40px_rgba(234,179,8,0.25)] // Card glow on scroll
shadow-[0_0_50px_rgba(234,179,8,0.05)] // Subtle ambient glow
shadow-[0_20px_50px_rgba(234,179,8,0.2)] // Image glow
```

### 5.2 Blur Effects

```jsx
backdrop-blur-sm     // Blur leve (4px)
backdrop-blur-md     // Blur médio (12px)
backdrop-blur-lg     // Blur forte (16px)
backdrop-blur-xl     // Blur muito forte (24px)

blur-3xl             // Background blur (64px)
```

---

## 6. Components Styles

### 6.1 Button Component

```jsx
// Variants implementadas
const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]',
  outline: 'border border-primary/20 bg-transparent hover:bg-primary/10 text-primary',
  hero: 'bg-primary text-primary-foreground font-black text-xl px-8 py-4 hover:scale-105 transition-transform shadow-2xl tracking-tighter',
  cta: 'bg-primary text-primary-foreground font-bold border-2 border-primary hover:bg-transparent hover:text-primary'
};

const sizes = {
  default: 'h-10 px-4 py-2',
  lg: 'h-12 px-8 text-base',
  xl: 'h-14 px-10 text-lg rounded-xl'
};

// Base classes
inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus:outline-none
```

### 6.2 Card Patterns

```jsx
// Card básico
bg-card border border-border rounded-[2.5rem] p-8

// Card com hover
bg-card/30 border border-border p-8 rounded-[2rem] hover:border-primary/30 transition-colors

// Card destacado (primary)
bg-primary/5 border-2 border-primary/20 rounded-[3rem] p-8 md:p-12 shadow-[0_0_50px_rgba(234,179,8,0.05)]

// Card com icônia circular
w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary

// Badge dentro de card
bg-primary/20 text-primary text-[9px] font-black uppercase px-3 py-1 rounded-full
```

### 6.3 Input Fields

```jsx
// Label
text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block

// Input
w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-primary outline-none transition-all

// Input variants
bg-white/5 border border-white/10
bg-white/10 rounded border border-white/10
```

### 6.4 Badges & Tags

```jsx
// Badge outline
text-primary font-bold mb-4 uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20

// Badge sólido
bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full

// Small badge
text-[8px] font-black text-white
text-[9px] font-black uppercase tracking-[0.2em]

// Destructive badge
bg-destructive text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full
```

### 6.5 Lists (Checkmarks)

```jsx
// Check item
flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground
<CheckCircle className="text-primary shrink-0" size={14} />

// Check circle container
w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.4)]

// X (destructive) circle
w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5
<X className="text-destructive" size={14} />
```

### 6.6 Avatar/Circle

```jsx
// Avatar simples
w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center font-black text-primary border border-primary/30

// Avatar notification
w-12 h-12 bg-primary rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-primary/20
```

### 6.7 Modal

```jsx
// Overlay
fixed inset-0 z-[300] bg-black/80 backdrop-blur-md

// Modal container
bg-card border-t-4 border-primary w-full max-w-md rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl

// Close button
absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors
```

### 6.8 Accordion Item

```jsx
// Item container
bg-card border border-border rounded-xl px-6 mb-4 transition-colors hover:border-primary/50

// Button
w-full flex items-center justify-between py-5 text-left font-semibold text-lg hover:text-primary

// Chevron rotation
<chevrons/Down className="transition-transform duration-300 {isOpen ? 'rotate-180' : ''}" />
```

### 6.9 Navigation/Header

```jsx
// Navbar
fixed top-0 left-0 right-0 z-50 transition-all duration-300

// Scrolled state
bg-background/90 backdrop-blur-lg border-b border-border

// Logo container
w-9 h-9 bg-primary rounded-lg flex items-center justify-center

// Logo text
text-xl font-bold italic uppercase tracking-tighter
```

---

## 7. Animations & Motion

### 7.1 Custom CSS Animations

```css
/* Pulse Gold Glow */
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

/* Infinite Marquee (Scroll) */
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-50% - 12px)); }
}

.infinite-marquee {
  display: flex;
  width: max-content;
  animation: marquee 30s linear infinite;
}

.infinite-marquee:hover {
  animation-play-state: paused;
}
```

### 7.2 Framer Motion Patterns

```jsx
// Fade Up (section entry)
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, amount: 0.3 }}
transition={{ duration: 0.6 }}

// Stagger (multiple items)
transition={{ delay: i * 0.2 }}

// Scale In (Hero)
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ delay: 0.3 }}

// Modal
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
// Container with scale
initial={{ scale: 0.9, y: 20 }}
animate={{ scale: 1, y: 0 }}
exit={{ scale: 0.9, y: 20 }}

// Accordion height transition
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
exit={{ height: 0, opacity: 0 }}

// Continuous pulse (pricing glow)
animate={{ 
  scale: [1, 1.1, 1], 
  opacity: [0.3, 0.6, 0.3] 
}}
transition={{ 
  duration: 4, 
  repeat: Infinity, 
  ease: "easeInOut" 
}}
```

### 7.3 ScrollCard (Scroll-based animations)

```jsx
// Scale & blur on scroll
scale: useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.05, 0.9])
opacity: useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.5, 0.8, 1, 0.8, 0.5])
glow: useTransform(scrollYProgress, [0, 0.5, 1], [
  "0px 0px 0px rgba(234,179,8,0)",
  "0px 0px 40px rgba(234,179,8,0.25)",
  "0px 0px 0px rgba(234,179,8,0)"
])
```

### 7.4 Hover Effects

```jsx
// Button scale
hover:scale-105 transition-transform

// Border color transition
hover:border-primary/30 transition-colors
hover:border-primary/50 transition-colors

// Grayscale restore (images)
grayscale group-hover:grayscale-0 transition-all duration-700

// Card hover (primary version)
group hover:border-primary/50 shadow-[0_0_50px_rgba(234,179,8,0.05)]

// Gradient reveal
absolute -inset-0.5 bg-gradient-to-b from-primary/20 to-transparent rounded-[3rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500
```

---

## 8. Z-Index Layers

```jsx
z-10      // Content over gradient backgrounds (hero)
z-20      // Badges on cards
z-[100]   // Social proof notification
z-[200]   // Image lightbox
z-[300]   // Lead modal (highest)
z-50      // Navbar (fixed)
```

---

## 9. Icons

### 9.1 Icon Library
- **Lucide React** - Versão ^0.454.0

### 9.2 Common Icons Used

```jsx
// Brand/Navegação
Scissors, Menu, X, ChevronLeft, ChevronRight, ArrowRight

// Features benefícios
Zap, Clock, ShieldCheck, CheckCircle, RefreshCcw, Gift, Users

// Status
Star, TriangleAlert, Smartphone

// UI elements
ChevronDown, Users
```

### 9.3 Icon Patterns

```jsx
// Icon container padrão
w-5 h-5 text-primary-foreground  // Logo pequeno
size={32}                        // Feature icons
size={20}                        // List icons
size={14}                        // Small checkmarks
size={12}                        // Micro labels

// Background icon containers
w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary
w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary
w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center

// Icon transitions
transition-transform  // On hover
transition-all duration-700  // Image containers
```

---

## 10. Layout Patterns

### 10.1 Container

```jsx
container mx-auto px-4
```

### 10.2 Grid Patterns

```jsx
// Responsive grid padrão
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8

// Benefits section
grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto

// Comparison
grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12

// Feature tags
grid grid-cols-1 sm:grid-cols-2 gap-3
```

### 10.3 Flex Patterns

```jsx
// Centered content
flex items-center justify-center

// Space between
flex items-center justify-between

// Navigation links
hidden md:flex items-center gap-6

// List items
flex items-start gap-4

// Button with icon
inline-flex items-center justify-center gap-2
```

### 10.4 Max-Widths

```jsx
max-w-none          // Full width
max-w-xs            // Mobile
max-w-sm            // 384px
max-w-md            // 512px (Modal, pricing)
max-w-lg            // Modals
max-w-xl            // Pricing card
max-w-2xl           // Large content
max-w-3xl           // FAQ section
max-w-4xl           // Footer
max-w-5xl           // Hero image, lightbox
max-w-6xl           // Content sections, benefits
max-w-8xl           // Very wide sections
```

---

## 11. Responsive Breakpoints

Os breakpoints padrão do Tailwind são usados:
- **Mobile**: `sm:` (640px+)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)
- **XL**: `xl:` (1280px+)

### 11.1 Common Responsive Patterns

```jsx
// Hide/Show elements
hidden md:block          // Desktop only
block md:hidden          // Mobile only

// Grid columns
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

// Text size
text-4xl md:text-7xl

// Padding
p-8 md:p-12

// Margin
gap-8 lg:gap-12

// Width
w-[68vw] sm:w-52 lg:w-[350px]
w-full sm:w-auto
```

---

## 12. Scrolling

```css
/* Hide scrollbar */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Base */
overflow-x-hidden  // Prevent horizontal scroll
w-full            // Ensure full width
```

---

## 13. Selection Style

```css
selection:bg-primary/30 selection:text-primary
```

Seleção de texto usa primary/amarelo com 30% de opacidade.

---

## 14. Theme Mode

**Status**: Dark Mode Only (Single Theme)

A landing page usa um tema dark único com:
- Background muito escuro (quase preto)
- Texto claro (95% branco)
- Acentos em gold/amarelo (#eab308)

**Recommendation for Dashboard**:
Considerar suporte a light mode e dark mode com toggle, mantendo a paleta gold/amber como accent color.

---

## 15. Futuristic Enhancements Recommendations

### 15.1 Glassmorphism (Already in use)
```jsx
// Current usage
bg-background/90 backdrop-blur-lg
bg-card/90 backdrop-blur-lg

// Expansion for dashboard
bg-white/5 backdrop-blur-xl
bg-background/80 backdrop-blur-2xl
```

### 15.2 Gradient Enhancements

```jsx
// Gradient borders (not yet used)
before:absolute before:inset-0 before:rounded-xxx before:bg-gradient-to-b 
before:from-primary/20 before:to-transparent before:p-0.5

// Gradient masks
mask-image-gradient-linear-to-t
```

### 15.3 Micro-interactions

```jsx
// Hover lift
hover:-translate-y-1 transition-transform

// Hover glow
hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]

// Subtle scale
hover:scale-[1.02] transition-transform

// Focus states
focus:ring-2 focus:ring-primary/50 outline-none
```

### 15.4 Smooth Transitions

```jsx
// Already well implemented
transition-all duration-300
transition-colors
transition-transform duration-500
```

### 15.5 Visual Noise/Texture

```jsx
// Potential add for dashboard
bg-[url('/noise.png')] bg-[length:256px] bg-[repeat] opacity-[0.02]
```

### 15.6 Motion Considerations

```jsx
// Subtle floating animation
animate-float (custom keyframe)

// Stagger reveal on dashboard panels
framer-motion staggerChildren

// Page transitions
framer-motion AnimatePresence
```

---

## 16. Dashboard Application Guidelines

### 16.1 Theme Application

```jsx
// Use tokens instead of hardcoded values
bg-background        // Dashboard backgrounds
bg-card             // Sidebar panels, main content areas
bg-primary           // Accent buttons, highlights
border-border       // Panel dividers, table borders
text-foreground     // Primary text
text-muted-foreground  // Labels, secondary text
```

### 16.2 Component Mapping

| Landing Page Component | Dashboard Equivalent |
|------------------------|---------------------|
| Button (variants) | Dashboard buttons, actions |
| Card style | Panel cards, data widgets |
| Badge | Status indicators, tags |
| Input fields | Form fields, filters |
| Modal | Dialogs, forms overlays |
| Accordion | Collapsible sections |
| SectionHeading | Page headers, section titles |
| ScrollCard | Data cards with hover effects |
| List items | Table rows, list items |
| Avatar | User profile, client avatars |

### 16.3 Spacing Guidelines

```jsx
// Dashboard layout
py-8                  // Section spacing within dashboard
py-6                  // Card grouping spacing
gap-4                 // Widget grid gaps
gap-6                 // Larger component gaps
p-6                   // Card padding
pl-8 pr-8             // Sidebar/mcain content spacing
```

### 16.4 Typography Guidelines

```jsx
// Page titles
text-3xl md:text-4xl font-black italic uppercase tracking-tighter

// Section headers
text-xl md:text-2xl font-bold italic

// Card titles
text-lg font-bold

// Labels
text-[10px] font-bold uppercase tracking-widest text-muted-foreground

// Data values
text-2xl md:text-3xl font-black text-primary

// Body text
text-sm text-muted-foreground
```

### 16.5 Dashboard-specific Components

```jsx
// Sidebar item
px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-3

// Active sidebar item
bg-primary/10 text-primary border-l-2 border-primary

// Data card
bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors

// Stat card with glow
bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.1)]

// Table row
border-b border-border hover:bg-white/5 transition-colors

// Table cell
px-6 py-4

// Pagination button
w-12 h-12 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 flex items-center justify-center text-medium transition-all
```

### 16.6 Status Colors (for state indicators)

```jsx
// Active/Success
text-emerald-400 bg-emerald-400/10 border-emerald-400/30

// Warning/Pending
text-amber-400 bg-amber-400/10 border-amber-400/30

// Error/Danger
text-red-400 bg-red-400/10 border-red-400/30

// Neutral/Inactive
text-muted-foreground bg-muted-foreground/10
```

### 16.7 Icon Guidelines for Dashboard

```jsx
// Small icons
size={16}  // List items, small buttons
size={18}  // Table headers
size={20}  // Standard UI

// Medium icons
size={24}  // Sidebar items, feature highlights
size={28}  // Section headers

// Large icons
size={32}  // Empty states
size={48}  // Hero/dashboard welcome

// Icon containers with background
w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center
w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center
```

---

## 17. Recommended Custom Tailwind Classes (for Dashboard)

```jsx
// Gradient text utility (add to index.css)
.text-gradient-primary {
  @apply bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-clip-text text-transparent;
}

// Glass morphism utility
.glass {
  @apply bg-background/60 backdrop-blur-xl border border-white/5;
}

.glass-heavy {
  @apply bg-background/80 backdrop-blur-2xl border border-border;
}

// Glow effects
.glow-primary {
  @apply shadow-[0_0_30px_rgba(234,179,8,0.2)];
}

.glow-subtle {
  @apply shadow-[0_0_20px_rgba(234,179,8,0.1)];
}

// Smooth transitions
.transition-smooth {
  @apply transition-all duration-300 ease-out;
}

// Scrollable area
.scrollbar-thin {
  @apply scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent scrollbar-w-2;
}
```

---

## 18. Summary & Key Takeaways

### 18.1 Brand Identity
- **Primary Color**: Gold/Amber (#eab308) - Energetic, premium
- **Typography**: Bold, uppercase, italic - Strong, masculine, modern
- **Aesthetic**: Dark theme, barber/salon feel, clean yet powerful

### 18.2 Design Philosophy
- **High Contrast**: Dark backgrounds with bright gold accents
- **Strong Typography**: Font weights and spacing command attention
- **Subtle Motion**: Smooth transitions, scroll-based animations
- **Glassmorphism**: Backdrop blur with transparency
- **Rounded Corners**: Consistent rounded elements (xl to 3rem)

### 18.3 Component DNA
- All components share consistent:
  - Border colors (`border-border`, `border-primary/30`)
  - Surface backgrounds (`bg-card`, `bg-background`)
  - Text hierarchy with uppercase tracking
  - Hover states with primary color
  - Shadow/glow effects

### 18.4 Dashboard Strategy
1. **Maintain Brand**: Keep gold/amber primary, dark theme base
2. **Enhance UX**: Add more interactive states, micro-interactions
3. **Modular Design**: Use card-based components for data displays
4. **Accessibility**: Maintain high contrast, clear typography
5. **Performance**: Smooth transitions, scroll-based motion

### 18.5 Files Reference

| File | Purpose |
|------|---------|
| `src/index.css` | CSS variables, custom animations |
| `src/App.jsx` | Main layout, navigation, component usage patterns |
| `src/components/ui/Button.jsx` | Button component with variants |
| `src/components/ui/SectionHeading.jsx` | Section heading pattern |
| `src/components/ui/ScrollCard.jsx` | Scroll animation card |
| `src/components/ui/AccordionItem.jsx` | Accordion pattern |
| `src/components/sections/*` | Various UI patterns and component usage |
| `tailwind.config.js` | Tailwind configuration and color tokens |

---

## 19. Tailwind Classes Cheat Sheet (Quick Reference)

```jsx
// Brand colors
bg-background bg-card bg-primary bg-secondary bg-muted
text-foreground text-primary text-muted-foreground
border-border border-primary

// Typography
font-black font-bold font-semibold font-medium
text-gradient-gold
italic uppercase
tracking-tighter tracking-widest tracking-[0.2em]

// Spacing
py-20 py-24 mb-16 gap-4 gap-6 gap-8 gap-12

// Borders
rounded-lg rounded-xl rounded-2xl rounded-[2rem] rounded-[2.5rem] rounded-[3rem]
border border-border border-primary/30

// Shadows & Glow
shadow-lg shadow-xl shadow-2xl
shadow-[0_0_30px_rgba(234,179,8,0.4)]

// Backdrop
backdrop-blur-sm backdrop-blur-md backdrop-blur-lg backdrop-blur-xl

// Transitions
transition-all duration-300 transition-colors transition-transform
hover:scale-105 hover:border-primary/30

// Animations
animate-pulse-gold
infinite-marquee

// Flex/Grid
flex items-center justify-between justify-center
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
container mx-auto px-4

// Misc
relative z-10 z-50 z-[300] fixed inset-0
overflow-hidden
select-none
```

---

**End of Design System Analysis**

Este documento deve servir como referência completa para a implementação do design system no dashboard admin do BarberZap, mantendo consistência com a landing page atual.