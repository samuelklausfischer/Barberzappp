# BarberZap Admin Panel - Responsive Strategy

## Breakpoint Definitions

| Breakpoint | Tailwind Class | Min Width | Target Device | Key Layout Changes |
|------------|----------------|-----------|---------------|-------------------|
| `sm` | `sm:` | 640px | Large Mobile | Bottom nav shows, sidebar as drawer |
| `md` | `md:` | 768px | Tablet | Sidebar collapsible, full-width content |
| `lg` | `lg:` | 1024px | Desktop | Fixed sidebar, multi-column layouts |
| `xl` | `xl:` | 1280px | Large Desktop | Maximum content width, extra columns |

> Note: All layouts are designed **mobile-first**. Default styles apply to mobile (<640px), then enhanced with breakpoint prefixes.

## Component Behavior by Breakpoint

### 1. Sidebar Navigation

#### Mobile (<640px)
- **State**: Hidden (drawer mode)
- **Trigger**: Hamburger menu in TopBar
- **Behavior**: Full-screen overlay with backdrop blur
- **Close**: X button or backdrop click
- **Animation**: Slide from left (300ms)
- **Z-index**: 50 (above all content)
- **Width**: 100% full screen

```jsx
// Mobile Sidebar
<div className="fixed inset-0 z-50 lg:hidden">
  {/* Backdrop */}
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg" />
  
  {/* Sidebar Drawer */}
  <aside className="fixed left-0 top-0 h-full w-[280px] bg-slate-900 
                    border-r border-slate-800">
    {/* Menu Items */}
  </aside>
</div>
```

#### Tablet (640px - 1023px)
- **State**: Collapsible by default
- **Trigger**: Collapse/Expand toggle
- **Default**: Expanded on larger tablets, collapsed on smaller
- **Width**: 240px (expanded) / 64px (collapsed)
- **Behavior**: Off-canvas style or overlay
- **Transition**: Smooth width change (200ms)

```jsx
// Tablet Sidebar
<aside className={`fixed left-0 top-0 h-full border-r border-slate-800 
                    transition-all duration-200 ${isExpanded ? 'w-64' : 'w-16'}`}>
  {/* Expanded/Collapsed items */}
</aside>
```

#### Desktop (≥1024px)
- **State**: Fixed, expanded by default
- **Width**: 260px standard
- **Behavior**: Persistent on screen
- **Position**: Fixed left, below TopBar
- **Main Content Shift**: Adjusts margin-left
- **Scroll**: Independent scrolling menu

```jsx
// Desktop Sidebar
<aside className="fixed left-0 top-[64px] bottom-0 w-[260px] 
                  bg-slate-900 border-r border-slate-800 
                  overflow-y-auto hidden lg:block">
  {/* Full navigation */}
</aside>
```

### 2. TopBar (Header)

#### Mobile (<640px)
- **Branding**: Logo icon only (no text)
- **Search**: Icon that triggers search modal
- **User Menu**: Avatar only, no dropdown label
- **Menu Button**: Hamburger visible
- **Height**: 56px (compact)

```jsx
<header className="fixed top-0 left-0 right-0 h-14 bg-slate-900/95 
                backdrop-blur-xl border-b border-slate-800 
                flex items-center justify-between px-4 z-40">
  <Menu />  {BrandIcon}  {SearchIcon}  {Avatar}
</header>
```

#### Tablet & Desktop (≥640px)
- **Branding**: Full logo + text
- **Search**: Inline search input
- **User Menu**: Avatar + name + dropdown
- **Height**: 64px (standard)

```jsx
<header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/95 
                backdrop-blur-xl border-b border-slate-800 
                flex items-center justify-between px-6 z-40">
  <BrandLogo />  {SearchInput}  {UserMenu}
</header>
```

### 3. Main Content Area

#### Mobile (<640px)
- **Padding**: 12px top/bottom, 16px left/right
- **Top Margin**: 56px + 80px = 136px (TopBar + BottomNav)
- **Bottom Margin**: 80px (for BottomNav)
- **Grid**: 1 column only
- **Card Layout**: Full width stacked

```jsx
<main className="pt-[136px] pb-20 px-4 min-h-screen 
                 bg-gradient-to-br from-slate-900 to-slate-950">
  <div className="space-y-4">
    {/* Cards stacked vertically */}
  </div>
</main>
```

#### Tablet (640px - 1023px)
- **Padding**: 16px top/bottom, 24px left/right
- **Sidebar Offset**: Adjusted based on sidebar state
- **Grid**: 1-2 columns depending on content
- **Card Layout**: 2 columns for metric cards

```jsx
<main className={`pt-20 pb-8 px-6 min-h-screen 
                  transition-all duration-200 ${hasSidebar ? 'lg:ml-64' : ''}`}>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Responsive grid */}
  </div>
</main>
```

#### Desktop (≥1024px)
- **Padding**: 24px top/bottom, 32px left/right
- **Margin Left**: 260px (sidebar width)
- **Grid**: 2-4 columns depending on content
- **Card Layout**: Dashboard uses 4-column metrics

```jsx
<main className="pt-20 pb-8 px-8 min-h-screen 
                 ml-[260px] bg-gradient-to-br from-slate-900 to-slate-950">
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* 4-column metrics grid */}
  </div>
</main>
```

### 4. Mobile Bottom Navigation

#### Mobile Only (<640px)
- **Position**: Fixed bottom
- **Height**: 64px
- **Items**: 4 main routes (Dashboard, Agenda, WhatsApp, +Menu)
- **Style**: Glass morphism with backdrop blur
- **Active Indicator**: Pill shape with glow
- **Hidden on**: Tablet & Desktop

```jsx
<nav className="fixed bottom-0 left-0 right-0 h-16 
               bg-slate-900/90 backdrop-blur-xl 
               border-t border-slate-800 flex lg:hidden">
  {/* 4 navigation items */}
</nav>
```

#### Tablet & Desktop (≥640px)
- **Visibility**: Hidden entirely
- **Replacement**: Full sidebar navigation

### 5. Cards & Metrics

#### Mobile (<640px)
- **Padding**: 16px
- **Border Radius**: 12px
- **Layout**: Full width, stacked
- **Typography**: Compact labels

```jsx
<div className="bg-slate-800/50 backdrop-blur-xl 
                border border-slate-700/50 
                rounded-xl p-4 w-full">
  {/* Content */}
</div>
```

#### Desktop (≥1024px)
- **Padding**: 24px
- **Border Radius**: 16px
- **Layout**: Grid-based, hover lift effect
- **Typography**: Larger, clearer

```jsx
<div className="bg-slate-800/50 backdrop-blur-xl 
                border border-slate-700/50 
                rounded-2xl p-6 hover:-translate-y-1 
                hover:shadow-lg hover:shadow-amber-500/10 
                transition-all duration-300">
  {/* Content */}
</div>
```

## Responsive Utilities

### Container Classes

```jsx
// Mobile-first container
<div className="w-full px-4 md:px-6 lg:px-8 xl:px-12">
  {/* Content */}
</div>

// Max-width constrained container
<div className="w-full max-w-7xl mx-auto px-4">
  {/* Content */}
</div>
```

### Grid Patterns

```jsx
// Responsive grid
<div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* Items */}
</div>

// Dashboard metrics grid (special pattern)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  {/* Metric Cards */}
</div>
```

### Typography Responsive

```jsx
// Page title
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Dashboard
</h1>

// Section heading
<h2 className="text-lg md:text-xl lg:text-2xl font-semibold">
  Recent Appointments
</h2>

// Body text
<p className="text-sm md:text-base lg:text-lg">
  Content goes here
</p>
```

## Hide/Show Patterns

### Mobile Only
```jsx
<div className="lg:hidden">
  {/* Mobile-specific content */}
</div>
```

### Desktop Only
```jsx
<div className="hidden lg:block">
  {/* Desktop-specific content */}
</div>
```

### Tablet & Desktop
```jsx
<div className="hidden md:flex">
  {/* Content visible on tablet and up */}
</div>
```

### Portrait vs Landscape
```jsx
<div className="portrait:hidden">
  {/* Landscape only */}
</div>

<div className="landscape:hidden">
  {/* Portrait (mobile) only */}
</div>
```

## Touch Target Improvements (Mobile)

### Minimum Tap Target: 44x44px

```jsx
// Interactive elements
<button className="min-h-[44px] min-w-[44px] p-2">
  <Icon className="w-5 h-5" />
</button>

// Nav items
<a className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
  <Icon /> <span>Label</span>
</a>
```

## Performance Optimizations

### Responsive Images
```jsx
<Image
  src="/hero.jpg"
  alt="Hero"
  className="w-full h-auto"
  width={800}
  height={400}
  priority
/>
```

### Conditional Component Loading
```jsx
const MobileComponent = lazy(() => import('./MobileComponent'));
const DesktopComponent = lazy(() => import('./DesktopComponent'));

{isMobile ? (
  <Suspense fallback={<Loading />}>
    <MobileComponent />
  </Suspense>
) : (
  <Suspense fallback={<Loading />}>
    <DesktopComponent />
  </Suspense>
)}
```

## Mobile-First Testing Checklist

- [ ] Single-thumb navigation works comfortably
- [ ] Bottom nav doesn't overlap important content
- [ ] Search is accessible (modal or inline)
- [ ] Forms are full width with adequate input height
- [ ] Tables are horizontally scrollable on mobile
- [ ] Popups modals have enough padding for touch
- [ ] Sidebar drawer closes on route change
- [ ] Toast notifications positioned above bottom nav
- [ ] Empty states show helpful next steps

## Custom Breakpoints (If Needed)

If more specific breakpoints are needed, they can be added to Tailwind config:

```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '480px',    // Extra small mobile
      'sm': '640px',    // Default small mobile
      'md': '768px',    // Default tablet
      'lg': '1024px',   // Default desktop
      'xl': '1280px',   // Default large desktop
      '2xl': '1536px',  // Extra large desktop
    }
  }
}
```

## Animation Considerations

### Mobile
- Use transform instead of top/left for animations
- 60fps smooth transitions (200-300ms)
- Minimal blur effects on low-end devices
- No hover states (use touch-active instead)

### Desktop
- Can use more complex hover effects
- Parallax and subtle animations acceptable
- Glass morphism fully supported

## Common Responsive Issues & Solutions

### Issue: Bottom nav overlaps content at bottom
```jsx
// Solution: Add padding-bottom to main content  
<main className="pb-20 lg:pb-8">
  {/* Content */}
</main>
```

### Issue: Sidebar covers content on mobile
```jsx
// Solution: Close sidebar on mobile route change
useEffect(() => {
  setMobileSidebarOpen(false);
}, [location.pathname]);
```

### Issue: Text too small on mobile
```jsx
// Solution: Use responsive text classes
<p className="text-sm md:text-base">
  {/* Content */}
</p>
```

### Issue: Not enough tap space on mobile
```jsx
// Solution: Add wrapper with min dimensions
<button className="min-h-[44px] min-w-[44px]">
  <Icon />
</button>
```
