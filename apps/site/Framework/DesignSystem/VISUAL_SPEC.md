# BarberZap Admin Panel - Visual Specification

> **Last Updated:** 2026-02-25  
> **Version:** 1.0.0  
> **Based On:** Design Tokens v1.0.0, Component Guidelines v1.0.0

---

## Table of Contents
- [Visual Overview](#visual-overview)
- [Layout Structure](#layout-structure)
- [Page Mockups](#page-mockups)
- [Component Examples](#component-examples)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Animation Specifications](#animation-specifications)
- [Iconography](#iconography)
- [Image Guidelines](#image-guidelines)

---

## Visual Overview

### Design Philosophy

The BarberZap Admin Panel embodies **professional confidence** through:

1. **Dark Premium Theme** - Slate-900 foundation creates a sophisticated, focused environment
2. **Gold Accent System** - Amber/gold highlights guide attention without overwhelming
3. **Glass Morphism** - Subtle transparency and blur for modern depth
4. **Clean Typographic Hierarchy** - Clear visual path from headings to captions
5. **Consistent Spacing** - 8-point grid ensures visual harmony

### Key Visual Characteristics

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Glass blur, sticky, gold logo, user avatar        │
├─────────────────────────────────────────────────────────────┤
│  SIDEBAR       │                                           │
│  (Desktop)     │  MAIN CONTENT AREA                        │
│                │                                           │
│  • Nav items   │  • Stats Cards (gold glow on hover)       │
│  • Active:     │  • Data Tables (subtle borders)           │
│    bg-amber-500│  • Form Cards (glass morphism)            │
│    /text-gold-│  • Lists (hover states)                   │
│ 500           │                                           │
│                │  PADDING: 24-48px                         │
│  ICON: 20px    │  GRID: gaps 16-24px                       │
│  GAP: 12px     │                                           │
└─────────────────────────────────────────────────────────────┘
```

### Color Application Strategy

**Primary Accent (Gold/Amber):**
- Primary buttons (CTAs)
- Active navigation states
- Important status indicators
- Progress bars
- Focus rings

**Background Hierarchy:**
- Level 0: `bg-slate-900` - Page background
- Level 1: `bg-slate-800/50` - Card backgrounds
- Level 2: `bg-slate-700` - Elevated surfaces, dropdowns
- Level 3: `bg-white` - Input backgrounds (rare)

**Text Hierarchy:**
```css
H1:      36px, 600 weight, white, letter-spacing: -1%
H2:      28px, 600 weight, white
H3:      22px, 600 weight, white
Body:    14px, 400 weight, slate-400
Caption: 12px, 400 weight, slate-500
Overline:11px, 600 weight, uppercase, tracking +5%
```

---

## Layout Structure

### Overall Layout (Desktop: 1280px+)

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER (Height: 64px)                                            │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [Gold Logo] "BarberZap"  [Nav Links]           [User Menu] │ │
│ └────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┬──────────────────────────────────────────┐│
│ │                  │                                          ││
│ │   SIDEBAR        │   MAIN CONTENT                          ││
│ │   (Width: 256px) │   (Padding: 32px)                       ││
│ │                  │   (Max-width: none)                     ││
│ │   • Dashboard    │                                          ││
│ │   • Appointments │   ┌────────────────────────────────────┐ ││
│ │   • Clients      │   │ PAGE HEADER                        │ ││
│ │   • Staff        │   │ Breadcrumbs + Title + Actions     │ ││
│ │   • Services     │   └────────────────────────────────────┘ ││
│ │   • Reports      │                                          ││
│ │                  │   ┌────────────────────────────────────┐ ││
│ │                  │   │                                    │ ││
│ │   ─────────────  │   │   CONTENT                         │ ││
│ │   Management     │   │                                    │ ││
│ │                  │   │   (Cards, Tables, Forms)          │ ││
│ │   • Settings     │   │                                    │ ││
│ │   • Billing      │   │                                    │ ││
│ │                  │   │                                    │ ││
│ │   ─────────────  │   └────────────────────────────────────┘ ││
│ │   Bottom User    │                                          ││
│ │   Profile        │                                          ││
│ │                  │                                          ││
│ └──────────────────┴──────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

### Tablet Layout (768px - 1023px)

```
┌─────────────────────────────────────────┐
│ HEADER (Height: 64px)                   │
│ [Logo] [Hamburger]              [User]  │
├─────────────────────────────────────────┤
│                                         │
│ MAIN CONTENT (Padding: 24px)            │
│                                         │
│ • Stats Grid: 2 columns                 │
│ • Tables: Scrollable x-axis             │
│ • Cards: Full width / 2 columns         │
│                                         │
└─────────────────────────────────────────┘

SIDEBAR: Slide-in drawer (hidden by default)
```

### Mobile Layout (0px - 767px)

```
┌────────────────────────────┐
│ HEADER (Height: 56px)       │
│ [Logo] [Menu]        [User] │
├────────────────────────────┤
│                            │
│ MAIN (Padding: 16px)       │
│                            │
│ • Stats: Stacked vertical  │
│ • Tables: Full width       │
│ • Cards: Stacked full      │
│ • Forms: Stacked inputs    │
│                            │
└────────────────────────────┘

NAVIGATION: Bottom tab bar (optional)
```

---

## Page Mockups

### 1. Dashboard Page

**Purpose:** Overview of barbershop performance at a glance

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard > Overview │ [Date Picker]         [View Options] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │Revenue  │ │Clients  │ │Appts    │ │Staff    │           │
│ │$4,521   │ │128      │ │45       │ │8        │           │
│ │+12.5%   │ │+8       │ │+3       │ │100%     │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│ ┌─────────────────────────────────┐ ┌────────────────────┐ │
│ │ Today's Schedule                │ │ Revenue Chart     │ │
│ │ ──────────────────────────      │ │ ─────────────────  │ │
│ │ 2:00PM  John Doe  Haircut       │ │ [Line Graph]      │ │
│ │ 3:30PM  Jane S.   Beard Trim    │ │                   │ │
│ │ 4:00PM  Mike R.   Shave         │ │ Weekly Trend      │ │
│ │ ...                            │ │                   │ │
│ └─────────────────────────────────┘ └────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Top Services This Month                                 │ │
│ │ ───────────────────────────────────────                 │ │
│ │ Haircut         ████████████░░  68%  • 156 bookings    │ │
│ │ Beard Trim      ████████░░░░░░░  42%  • 97 bookings     │ │
│ │ Shave           ████░░░░░░░░░░░  25%  • 58 bookings     │ │
│ │ Hair Color      ██░░░░░░░░░░░░░  15%  • 35 bookings     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Component Details:**

**Stats Card:**
```html
<div class="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 
            hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
  <div class="flex items-center justify-between mb-4">
    <div class="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
      <!-- Icon: Dollar sign -->
    </div>
    <span class="text-xs font-medium text-emerald-400 bg-emerald-500/15 px-2 py-1 rounded-full">
      +12.5%
    </span>
  </div>
  <p class="text-3xl font-bold text-white">$4,521</p>
  <p class="text-sm text-gray-400 mt-1">Total Revenue</p>
</div>
```

---

### 2. Appointments List Page

**Purpose:** View, filter, and manage all appointments

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard > Appointments > All                              │
├─────────────────────────────────────────────────────────────┤
│ [Search Input] [Filter:] [Status ▼] [Barber ▼] [Date Range] │
│                                        [+ New Appointment]  │
├─────────────────────────────────────────────────────────────┤
│ Tabs:  All  |  Confirmed (24)  |  Pending (8)  | Cancelled │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Client       │ Service│Barber│Time       │Status│Actions││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ┌─┐ John     │ Haircut│ [MJ] │2:00 PM    │🟢Confirmed│⋯││
│ │ │ │Doe       │30min   │      │Today      │           │ ││
│ │ └─┘jd@email  │        │      │           │           │ ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ┌─┐ Jane     │ Beard  │ [TS] │3:30 PM    │🟡Pending  │⋯││
│ │ │ │Smith     │Trim    │      │Today      │           │ ││
│ │ └─┘js@email  │20min   │      │           │           │ ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ... (more rows)                                          ││
│ └─────────────────────────────────────────────────────────┘│
│                    ← Previous  1  2  3  Next →               │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Appointment Detail Modal

**Purpose:** View full appointment details and take actions

**Layout:**
```
┌────────────────────────────────────────────────────┐
│ New Appointment                            [×]      │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ STEP 1 OF 3: Client Information              │  │
│ │ ▓▓▓░░░                                      │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│  Client Name                        │              │
│  ┌────────────────────────────────────────┐     │
│  │ Search or create new client...          │     │
│  └────────────────────────────────────────┘     │
│                                                    │
│  OR select from recent:                             │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐         │
│  │  JD   │ │  TS   │ │  MJ   │ │  [+ ] │         │
│  │ John  │ │Thomas │ │Mike   │ │New    │         │
│  │ Doe   │ │Smith  │ │Ross   │ │Client │         │
│  └───────┘ └───────┘ └───────┘ └───────┘         │
│                                                    │
│                                    [Cancel] [Next→]│
└────────────────────────────────────────────────────┘
```

---

### 4. Settings Page

**Purpose:** Configure barbershop settings

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Settings > General                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Shop Information                                        ││
│ │ ─────────────────────────────────                       ││
│ │                                                           ││
│ │ Shop Name                                                ││
│ │ ┌─────────────────────────────────────────────────┐    ││
│ │ │ Downtown Cuts & Shaves                          │    ││
│ │ └─────────────────────────────────────────────────┘    ││
│ │                                                           ││
│ │ Address                                                   ││
│ │ ┌─────────────────────────────────────────────────┐    ││
│ │ │ 123 Main Street, Suite 100                       │    ││
│ │ └─────────────────────────────────────────────────┘    ││
│ │                                                           ││
│ │ Phone Number                                             ││
│ │ ┌─────────────────────────────────────────────────┐    ││
│ │ │ (555) 123-4567                                   │    ││
│ │ └─────────────────────────────────────────────────┘    ││
└─────────────────────────────────────────────────────────────┘
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Operating Hours                                         ││
│ │ ─────────────────────────────────                       ││
│ │                                                           ││
│ │ Monday     [ 9:00 AM ] ─ [ 7:00 PM ]  [☑️ Open]         ││
│ │ Tuesday    [ 9:00 AM ] ─ [ 7:00 PM ]  [☑️ Open]         ││
│ │ Wednesday  [ 9:00 AM ] ─ [ 7:00 PM ]  [☑️ Open]         ││
│ │ Thursday   [ 9:00 AM ] ─ [ 7:00 PM ]  [☑️ Open]         ││
│ │ Friday     [ 9:00 AM ] ─ [ 8:00 PM ]  [☑️ Open]         ││
│ │ Saturday   [ 9:00 AM ] ─ [ 6:00 PM ]  [☑️ Open]         ││
│ │ Sunday     [─────────] ─ [─────────]  [☐ Closed]        ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                    [Cancel] [Save Changes]  │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Staff Management Page

**Purpose:** Manage barbers and staff members

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard > Staff                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────────┐ ┌──────────────────────────────────┐  │
│ │ Quick Stats      │ │ All Staff (8)      [+ Add Staff] │  │
│ │ ─────────        │ │ ─────────────────────────────    │  │
│ │                  │ │                                  │  │
│ │ Active:    6     │ │ ┌──────────┐ ┌──────────┐       │  │
│ │ On Break:  1     │ │ │          │ │          │       │  │
│ │ Off Duty:  1     │ │ │   MJ     │ │   TS     │       │  │
│ │                  │ │ │Michael   │ │Thomas    │       │  │
│ └──────────────────┘ │ │Johnson   │ │Smith     │       │  │
│                     │ │Master    │ │Barber    │       │  │
│                     │ │Barber    │ │          │       │  │
│                     │ │🟢 Active │ │🟢 Active │       │  │
│                     │ │⭐ 4.9    │ │⭐ 4.7    │       │  │
│                     │ └──────────┘ └──────────┘       │  │
│                     │   [View] [Edit]  [View] [Edit]   │  │
│                     └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Staff Card Detail:
┌────────────────┐
│  ┌──────────┐  │
│  │          │  │  Michael Johnson
│  │   MJ     │  │  Master Barber
│  │          │  │  ─────────────
│  └──────────┘  │  
│  🟢 Active     │  Services: Haircut, Beard Trim, Shave
│  ⭐ 4.9 (127)  │  Today: 5 appointments
│                │  This Week: 32 appointments
│  [View Schedule│  Revenue Today: $187
│   View Profile │  
│  Send Message] │
└────────────────┘
```

---

## Component Examples

### Interactive Component States

#### Button States

```
┌─────────────────────────────────────────────────────────────┐
│ Button State Examples                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             
│ PRIMARY:                                                     
│ ┌──────────────────────┐                                    │
│ │  Book Appointment    │ ← Default (amber-500 bg)           │
│ └──────────────────────┘                                    │
│ ┌──────────────────────┐                                    │
│ │  Book Appointment    │ ← Hover (amber-600 + shadow)       │
│ └──────────────────────┘                                    │
│ ┌──────────────────────┐                                    │
│ │  ⠙ Book Appointment  │ ← Loading (spinner)                │
│ └──────────────────────┘                                    │
│ ┌──────────────────────┐                                    │
│ │  Book Appointment    │ ← Disabled (opacity 50%)           │
│ └──────────────────────┘                                    │

 SECONDARY:                                                   
│ ┌──────────────────────┐                                    │
│ │  Cancel              │ ← Default (slate-700 border)       │
│ └──────────────────────┘                                    │

 GHOST:                                                       
│ ╱ Cancel ╲         ← Default (transparent)                    │

 ICON:                                                        
│ ┌──────────────────────┐                                    │
│ │  [✏️]  [🗑️]  [👁]   │ ← Icon buttons 44×44px min         │
│ └──────────────────────┘                                    │
```

#### Input States

```
┌─────────────────────────────────────────────────────────────┐
│ Input State Examples                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             
│ DEFAULT:                                                     
│ ┌──────────────────────────────────────────────────┐       │
│ │ Enter client name...                              │       │
│ └──────────────────────────────────────────────────┘       │
│ │ Label: Client Name                                       │
│                                                             
│ HOVER:                                                       
│ ┌──────────────────────────────────────────────────┐       │
│ │ Enter client name...                              │ ← darker border│
│ └──────────────────────────────────────────────────┘       │
│                                                             
│ FOCUS:                                                       
│ ┌╔══════════════════════════════════════════════════╗┐       │
│ ║│Enter client name...                            │║       │
│ ╚╩══════════════════════════════════════════════════╝╝       │
│ ↓ Gold ring (2px focus ring + glow)                        │
│                                                             
│ ERROR:                                                       
│ ┌════════════════════════════════════════════════════┐       │
│ ││Enter client name...                            ││       │
│ └════════════════════════════════════════════════════┘       │
│ │ Label: Client Name     ← red color                      │
│ │ "This field is required" ← red error message            │
│                                                             
│ DISABLED:                                                    
│ ┌──────────────────────────────────────────────────┐       │
│ │ Pre-filled value (read-only)                     │       │
│ └──────────────────────────────────────────────────┘       │
│ ↑ Muted background                                      │
```

#### Card Hover Effects

```
┌─────────────────────────────────────────────────────────────┐
│ Card Hover Animation (300ms ease-out)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             
│ Default:                             Hovered:                │
│ ┌──────────────┐                   ┌──────────────┐         │
│ │ $4,521       │                   │ $4,521       │         │
│ │ +12.5%       │                   │ +12.5%       │         │
│ │ □            │    lift -1px →    │ □            │         │
│ │              │    +shadow-md →   │ ✨gold glow   │         │
│ └──────────────┘                   └──────────────┘         │
```

---

## Responsive Breakpoints

### Breakpoint Table

| Breakpoint | Min Width | Devices | Key Adjustments |
|------------|-----------|---------|-----------------|
| **xs** | 0px | Phones (< 640px) | Stacked layout, full-width cards, bottom nav |
| **sm** | 640px | Large phones | 2-column stats, reduced padding |
| **md** | 768px | Tablets | Sidebar as drawer, 3-column stats |
| **lg** | 1024px | Laptops | Full sidebar visible, standard padding |
| **xl** | 1280px | Desktops | 4-column stats, expanded tables |
| **2xl** | 1536px | Large screens | Max content width, spacious layout |

### Layout Transformations

#### Stats Grid

```
xs (<640px):    sm (640px+):   md (768px+):   xl (1280px+):
┌──────────┐   ┌────┐ ┌────┐   ┌────┐ ┌────┐ ┌────┐   ┌────┐┌────┐┌────┐┌────┐
│ Revenue  │   │Rev ││Cli │   │Rev ││Cli ││Appt│   │Rev ││Cli ││Appt││Strf│
├──────────┤   ├────┤├────┤   ├────┤├────┤├────┤   ├────┤├────┤├────┤├────┤
│ Clients  │   │Appt││Strf│   │Strf││Staff│      │     │     │     │     │
├──────────┤   └────┘└────┘   └────┘└────┘└────┘   └────┘└────┘└────┘└────┘
│Apptmnts  │
├──────────┤   
│  Staff   │   
└──────────┘   
```

#### Sidebar Behavior

| Breakpoint | Sidebar State | Trigger |
|------------|---------------|---------|
| xs - md | Hidden | Hamburger menu icon in header |
| lg - 2xl | Fixed visible | Always visible on left |
| Any (desktop) | Collapsible | User can toggle |

#### Navigation

**Mobile Bottom Navigation (xs only):**

```
┌──────────────────────────────────────┐
│                                      │
│           Main Content               │
│                                      │
├──────────────────────────────────────┤
│ [🏠 Home] [📅 Schedule] [👥 Clients]│
│    💚           ⚪           ⚪     │
└──────────────────────────────────────┘
```

**Mobile Hamburger Drawer (sm-md):**

```
Screen tapped → Drawer slides from left (80% width)
Backdrop blurred
Close button top-right
```

---

## Animation Specifications

### Animation Reference

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| `fadeIn` | 200ms | ease-out | Modal entrance |
| `fadeOut` | 150ms | ease-out | Modal exit |
| `slideUp` | 300ms | ease-out | Lists appearing |
| `slideDown` | 300ms | ease-out | Dropdowns |
| `slideLeft` | 300ms | ease-out | Navigating back |
| `slideRight` | 300ms | ease-out | Forward navigation |
| `scaleIn` | 200ms | ease-out | Modals, popovers |
| `scaleOut` | 150ms | ease-out | Closing modals |
| `shimmer` | 1.5s | linear | Loading skeletons |
| `pulse` | 2s | ease-in-out | Status indicators |
| `glow` | 2s | ease-in-out | Gold accent animations |

### Micro-interaction Timing

```css
/* Hover states - Fast and responsive */
.button:hover {
  transition: all 150ms ease-out;
  transform: translateY(-1px);
}

/* Card hover - Slightly more dramatic */
.card:hover {
  transition: all 300ms ease-out;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Focus states - Instant feedback */
.input:focus-within {
  transition: border-color 100ms ease-out, box-shadow 200ms ease-out;
}

/* Loading states - Smooth skeletons */
.skeleton {
  animation: shimmer 1.5s infinite linear;
}

/* Page transitions - Smooth but not distracting */
.page-enter {
  animation: fadeIn 200ms ease-out;
}
```

### Entrance Animations by Component

| Component | Entrance Animation |
|-----------|-------------------|
| Modal | Scale in from center (200ms) |
| Dropdown | Slide down (200ms) + fade in |
| Toast | Slide up from bottom (300ms) |
| Sidebar | Slide from left (300ms) |
| Drawer (right) | Slide from right (300ms) |
| List items | Staggered slide up (50ms delay each) |
| Cards | Staggered fade + scale (100ms delay each) |

---

## Iconography

### Icon System

**Source:** Heroicons or Lucide Icons (24px default)

**Style:**
- Stroke width: 1.5px to 2px
- Rounded line caps & joins
- Consistent visual weight

**Sizes:**
- xs: 16px (inline)
- sm: 18px (buttons, labels)
- md: 20px (default navigation)
- lg: 24px (headers, feature icons)
- xl: 32px (empty states, hero)

### Icon Color Palette

| Context | Color |
|---------|-------|
| Default (inactive) | `text-gray-500` |
| Active/Selected | `text-amber-500` |
| Hover | `text-white` |
| Actions (edit) | `text-gray-400` → hover `text-white` |
| Danger (delete) | `text-red-400` |
| Success | `text-emerald-400` |
| Info | `text-blue-400` |
| Warning | `text-amber-500` |

### Core Icon Set

**Navigation:**
- Home/Home
- Calendar
- Users (Clients)
- User/Circle (Staff)
- Scissors (Services)
- Chart Bar (Reports)
- Cog (Settings)

**Actions:**
- Plus (Add)
- Pencil (Edit)
- Eye (View)
- Trash (Delete)
- Search
- Filter
- More Vertical (Menu)

**Status:**
- Check (Success)
- X (Error/Close)
- Clock (Pending)
- Alert Triangle (Warning)
- Info (Info)

---

## Image Guidelines

### Avatar Images

**Shapes:**
- User avatars: Circle (`rounded-full`)
- Service icons: Rounded square (`rounded-xl`)

**Sizes:**
```css
avatar-xs: 24px   /* 3xl text */
avatar-sm: 32px   /* 2xl text */
avatar-md: 40px   /* lg text */
avatar-lg: 48px   /* md text */
avatar-xl: 64px   /* xl text */
avatar-2xl: 96px  /* 3xl text */
```

**Fallback (No Image):**
```html
<!-- Gradient background with initials -->
<div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 
            flex items-center justify-center text-sm font-bold text-slate-900">
  JD
</div>

<!-- Solid color variation -->
<div class="w-12 h-12 rounded-full bg-slate-700 
            flex items-center justify-center text-sm font-medium text-white">
  MJ
</div>
```

### Service Images

**Style:** Clean, professional, minimal

**Fallback Colors (by service category):**
```css
Haircut:   amber-500/15 text-amber-500
Beard:     blue-500/15 text-blue-500
Shave:     purple-500/15 text-purple-500
Color:     pink-500/15 text-pink-500
Style:     emerald-500/15 text-emerald-500
```

---

## Spacing Reference

### Standard Padding by Container

| Container | Mobile (xs) | Tablet (sm-md) | Desktop (lg+) |
|-----------|-------------|----------------|---------------|
| Page content | 16px | 24px | 32px |
| Card | 16px | 20px | 24px |
| Modal | 16px | 20px | 24px |
| Form section | 12px | 16px | 20px |

### Gap Sizes

| Context | Gap Value |
|---------|-----------|
| Form fields | 16-24px |
| List items | 0 (with border) or 12px (no border) |
| Grid columns | 16-24px |
| Button groups | 4px |
| Icon + label | 8px |
| Row sections | 24-32px |
| Major sections | 48-64px |

---

## Typography Reference

### Hierarchy Visual Guide

```
H1 (Display - 48px)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Barbershop Overview
Bold (-1% letter-spacing)

H2 (36px)
━━━━━━━━━━━━━━━━━━━━━━━
Today's Schedule
Semi-bold

H3 (22px)
━━━━━━━━━━━━━━━
Upcoming Appointments
Semi-bold

H4 (18px)
━━━━━━━━━━━
Quick Stats
Semi-bold

Body Large (16px)
─────────
Use this for important body text, primary
information in cards and detail views.

Body (14px)
──────
Default text for body content, descriptions,
paragraph text throughout the application.

Body Small (13px)
─────
Labels, form descriptions, secondary body text.

Caption (12px)
────
Helper text, timestamps, metadata.

Overline (11px)
━━━
CATEGORY LABELS
All caps, +5% tracking

Code (13px)
────
`font-family: monospace`
For data IDs, codes, snippets.
```

---

## Color Application Examples

### Status Color Usage

```html
<!-- Success - Confirmed appointments -->
<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full 
              text-xs font-medium bg-emerald-500/15 text-emerald-400">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
  Confirmed
</span>

<!-- Warning - Pending appointments -->
<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full 
              text-xs font-medium bg-amber-500/15 text-amber-500">
  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
  Pending
</span>

<!-- Error - Cancelled appointments -->
<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full 
              text-xs font-medium bg-red-500/15 text-red-400">
  <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
  Cancelled
</span>
```

### Gold Accent Guidelines

**DO use gold for:**
 ✅ Primary CTA buttons
 ✅ Active navigation items
 ✅ Important status (pending, attention needed)
 ✅ Progress indicators
 ✅ Focus rings
 ✅ Achievements/rewards

**DON'T use gold for:**
 ❌ Body text (hard to read)
 ❌ Large background areas (overwhelming)
 ❌ Error messages (confusing)
 ❌ Information-only content (distracting)

---

## Glass Morphism Recipes

### Standard Glass Card

```css
.glass-card {
  background: hsl(217 33% 17% / 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid hsl(217 33% 25% / 0.5);
  border-radius: 16px;
}
```

### Glass Input

```css
.glass-input {
  background: hsl(217 33% 17% / 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid hsl(217 33% 25%);
  border-radius: 8px;
}
```

### Glass Modal Backdrop

```css
.glass-backdrop {
  background: hsl(0 0% 0% / 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
```

---

## Implementation Checklist

When implementing the design system, ensure:

- [ ] All colors use CSS variables from design tokens
- [ ] Spacing follows 8-point grid (4px multiples)
- [ ] Font sizes follow modular scale
- [ ] Focus states are visible (2px gold ring)
- [ ] Hover states have visual feedback
- [ ] Loading states are provided for async actions
- [ ] Empty states exist for data lists
- [ ] Error states are clear with red accent
- [ ] Success states use green accent
- [ ] Gold accent used sparingly (1-2 per section)
- [ ] Glass morphism applied consistently
- [ ] Breakpoints tested (xs, sm, md, lg, xl, 2xl)
- [ ] Touch targets minimum 44×44px
- [ ] Contrast ratios meet WCAG AA
- [ ] Reduced motion respected
- [ ] ARIA labels on icon-only buttons
- [ ] Keyboard navigation works for all interactive elements
- [ ] Loading skeletons for async content
- [ ] Toast notifications for feedback
- [ ] Confirmation dialogs for destructive actions

---

## Design System File Structure

```
Framework/
└── DesignSystem/
    ├── DESIGN_TOKENS.md          ← CSS variables, Tailwind config
    ├── COMPONENT_GUIDELINES.md   ← Component usage, examples
    └── VISUAL_SPEC.md            ← This file - mockups, layout
```

## Quick Reference

### Color Palette (HSL)

```
Gold/Accent:     38 95% 46%
Background:      222 47% 11%
Card:            217 33% 17%
Text Primary:    0 0% 100%
Text Secondary:  215 20% 65%
Border:          216 33% 25%
```

### Common Utility Classes

```html
<!-- Button -->
class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg px-6 py-3 transition-all duration-150"

<!-- Card -->
class="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6"

<!-- Input -->
class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"

<!-- Badge (Success) -->
class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400"

<!-- Badge (Pending) -->
class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-500"
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-25 | Initial design system for BarberZap Admin Panel |

---

**End of Visual Specification**
