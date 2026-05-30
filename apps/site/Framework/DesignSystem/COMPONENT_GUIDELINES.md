# BarberZap Admin Panel - Component Guidelines

> **Last Updated:** 2026-02-25  
> **Version:** 1.0.0  
> **Based On:** Design Tokens v1.0.0

---

## Table of Contents
- [Introduction](#introduction)
- [Button Components](#button-components)
- [Form Elements](#form-elements)
- [Cards & Panels](#cards--panels)
- [Navigation](#navigation)
- [Feedback & Status](#feedback--status)
- [Data Display](#data-display)
- [Overlays & Modals](#overlays--modals)
- [Layout Components](#layout-components)
- [Accessibility Guidelines](#accessibility-guidelines)

---

## Introduction

This document provides comprehensive guidelines for building UI components for the BarberZap Admin Panel. Each component section includes:

- **Variants & States** - Available styles and interactive states
- **Usage Patterns** - When and how to use each component
- **Code Examples** - Tailwind CSS implementations
- **Accessibility Notes** - WCAG compliance requirements

All components use the design tokens defined in `DESIGN_TOKENS.md`.

---

## Button Components

### Primary Button

**Usage:** Main actions, primary calls-to-action (CTAs)

**States:** Default, Hover, Active, Loading, Disabled

```html
<!-- Primary Button -->
<button class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg px-6 py-3 
                   transition-all duration-150 shadow-lg hover:shadow-glow-gold
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
  <span class="flex items-center gap-2">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
    </svg>
    Add New Barber
  </span>
</button>

<!-- Primary Button - Loading State -->
<button class="bg-amber-500 text-slate-900 font-semibold rounded-lg px-6 py-3 cursor-wait"
        disabled>
  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
</button>
```

**Classes:**
- Base: `inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150`
- Variant: `bg-amber-500 hover:bg-amber-600 text-slate-900`
- Loading: `cursor-wait opacity-75`
- Disabled: `opacity-50 cursor-not-allowed`

---

### Secondary Button

**Usage:** Secondary actions, alternative options

```html
<!-- Secondary Button -->
<button class="bg-slate-700/50 hover:bg-slate-700 text-white border border-slate-600 
                   font-medium rounded-lg px-6 py-3 transition-all duration-150
                   hover:border-slate-500 hover:shadow-md">
  Cancel
</button>
```

**Classes:** `bg-slate-700/50 hover:bg-slate-700 border border-slate-600`

---

### Ghost Button

**Usage:** Low-emphasis actions, decorative buttons

```html
<!-- Ghost Button -->
<button class="bg-transparent hover:bg-slate-800/50 text-gray-400 hover:text-white 
                   font-medium rounded-lg px-4 py-2 transition-all duration-150">
  Edit Details
</button>
```

**Classes:** `bg-transparent hover:bg-slate-800/50 text-gray-400 hover:text-white`

---

### Danger Button

**Usage:** Destructive actions (delete, cancel, remove)

```html
<!-- Danger Button -->
<button class="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 
                   font-medium rounded-lg px-4 py-2 transition-all duration-150
                   hover:border-red-500/50 hover:shadow-glow-red">
  Delete Appointment
</button>

<!-- Danger Primary Button -->
<button class="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-6 py-3 
                   transition-all duration-150 shadow-lg hover:shadow-glow-red">
  Confirm Delete
</button>
```

---

### Icon Buttons

**Usage:** Compact actions with icons only

```html
<!-- Icon Button -->
<button class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700/50 
                   transition-all duration-150 hover:shadow-md"
        aria-label="Edit">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
  </svg>
</button>

<!-- Icon Button with Badge -->
<button class="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700/50 
                   transition-all duration-150">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
  </svg>
  <span class="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
</button>
```

---

### Button Group

**Usage:** Segmented controls, related actions

```html
<!-- Button Group -->
<div class="inline-flex rounded-lg bg-slate-800/50 p-1 border border-slate-700/50">
  <button class="px-4 py-2 text-sm font-medium rounded-md bg-slate-700 text-white shadow">
    Day
  </button>
  <button class="px-4 py-2 text-sm font-medium rounded-md text-gray-400 hover:text-white hover:bg-slate-700/50">
    Week
  </button>
  <button class="px-4 py-2 text-sm font-medium rounded-md text-gray-400 hover:text-white hover:bg-slate-700/50">
    Month
  </button>
</div>
```

---

## Form Elements

### Text Input

**Usage:** Single-line text entry, names, emails

```html
<!-- Standard Input -->
<div class="relative">
  <label for="barber-name" class="block text-sm font-medium text-gray-400 mb-1">
    Barber Name
  </label>
  <input type="text" 
         id="barber-name"
         class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-150"
         placeholder="Enter barber name">
</div>

<!-- Input with Icon -->
<div class="relative">
  <label for="email" class="block text-sm font-medium text-gray-400 mb-1">
    Email Address
  </label>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
      </svg>
    </div>
    <input type="email"
           id="email"
           class="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 
                  text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                  focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-150"
           placeholder="barber@barberzap.com">
  </div>
</div>

<!-- Input with Error State -->
<div class="relative">
  <label for="phone" class="block text-sm font-medium text-red-400 mb-1">
    Phone Number
  </label>
  <input type="tel"
         id="phone"
         class="w-full bg-slate-800/50 border border-red-500 rounded-lg px-4 py-3 
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                focus:ring-red-500/50 focus:border-red-500 transition-all duration-150"
         placeholder="(555) 123-4567">
  <p class="mt-1 text-xs text-red-400">Please enter a valid phone number</p>
</div>
```

---

### Textarea

**Usage:** Multi-line text input, descriptions, notes

```html
<!-- Standard Textarea -->
<div class="relative">
  <label for="description" class="block text-sm font-medium text-gray-400 mb-1">
    Description
  </label>
  <textarea id="description"
            rows="4"
            class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 
                   text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                   focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-150 resize-none"
            placeholder="Enter barbershop description..."></textarea>
  <p class="mt-1 text-xs text-gray-500">0/500 characters</p>
</div>
```

---

### Select Dropdown

**Usage:** Selecting from predefined options

```html
<!-- Standard Select -->
<div class="relative">
  <label for="role" class="block text-sm font-medium text-gray-400 mb-1">
    Role
  </label>
  <select id="role"
          class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 
                 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 
                 focus:border-amber-500 transition-all duration-150 appearance-none">
    <option value="">Select a role</option>
    <option value="barber">Barber</option>
    <option value="receptionist">Receptionist</option>
    <option value="manager">Manager</option>
    <option value="admin">Admin</option>
  </select>
  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
    <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
    </svg>
  </div>
</div>
```

---

### Checkbox

**Usage:** Multi-select options, toggles

```html
<!-- Standard Checkbox -->
<div class="flex items-start gap-3">
  <input type="checkbox"
         id="services-1"
         class="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800/50 text-amber-500 
                focus:ring-amber-500/50 focus:ring-offset-0 focus:ring-offset-slate-900"
         checked>
  <label for="services-1" class="text-sm text-gray-300 select-none cursor-pointer">
    Enable online booking
  </label>
</div>

<!-- Checkbox Group -->
<div class="space-y-3">
  <p class="text-sm font-medium text-gray-400">Available Services</p>
  
  <div class="flex items-center gap-3">
    <input type="checkbox" id="svc1" class="w-4 h-4 rounded bg-slate-800/50 border-slate-600 text-amber-500">
    <label for="svc1" class="text-sm text-gray-300">Haircut</label>
  </div>
  
  <div class="flex items-center gap-3">
    <input type="checkbox" id="svc2" class="w-4 h-4 rounded bg-slate-800/50 border-slate-600 text-amber-500">
    <label for="svc2" class="text-sm text-gray-300">Beard Trim</label>
  </div>
  
  <div class="flex items-center gap-3">
    <input type="checkbox" id="svc3" class="w-4 h-4 rounded bg-slate-800/50 border-slate-600 text-amber-500">
    <label for="svc3" class="text-sm text-gray-300">Shave</label>
  </div>
</div>
```

---

### Radio Button

**Usage:** Single-select from mutually exclusive options

```html
<!-- Radio Group -->
<div class="space-y-3">
  <p class="text-sm font-medium text-gray-400">Appointment Type</p>
  
  <div class="flex items-center gap-3">
    <input type="radio" id="walkin" name="type" class="w-4 h-4 bg-slate-800/50 border-slate-600 text-amber-500">
    <label for="walkin" class="text-sm text-gray-300">Walk-in</label>
  </div>
  
  <div class="flex items-center gap-3">
    <input type="radio" id="scheduled" name="type" checked class="w-4 h-4 bg-slate-800/50 border-slate-600 text-amber-500">
    <label for="scheduled" class="text-sm text-gray-300">Scheduled</label>
  </div>
  
  <div class="flex items-center gap-3">
    <input type="radio" id="vip" name="type" class="w-4 h-4 bg-slate-800/50 border-slate-600 text-amber-500">
    <label for="vip" class="text-sm text-gray-300">VIP</label>
  </div>
</div>
```

---

### Toggle Switch

**Usage:** Binary on/off settings

```html
<!-- Standard Toggle -->
<label class="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" class="sr-only peer" checked>
  <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 
                  peer-focus:ring-amber-500/50 rounded-full peer peer-checked:bg-amber-500 
                  peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] 
                  after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all">
  <span class="ml-3 text-sm font-medium text-gray-300">Enable notifications</span>
</label>

<!-- Small Toggle -->
<label class="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" class="sr-only peer">
  <div class="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                  after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all 
                  peer-checked:after:translate-x-4">
  <span class="ml-2 text-sm text-gray-300">Auto-approve</span>
</label>
```

---

### Date & Time Picker

**Usage:** Date selection, time slots, scheduling

```html
<!-- Date Input -->
<div class="relative">
  <label for="date" class="block text-sm font-medium text-gray-400 mb-1">
    Appointment Date
  </label>
  <div class="relative">
    <input type="date"
           id="date"
           class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 
                  text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 
                  focus:border-amber-500 transition-all duration-150
                  [color-scheme:dark]">
  </div>
</div>

<!-- Time Picker -->
<div class="grid grid-cols-2 gap-4">
  <div>
    <label for="time-start" class="block text-sm font-medium text-gray-400 mb-1">
      Start Time
    </label>
    <input type="time"
           id="time-start"
           class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 
                  text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 
                  focus:border-amber-500 transition-all duration-150
                  [color-scheme:dark]">
  </div>
  <div>
    <label for="time-end" class="block text-sm font-medium text-gray-400 mb-1">
      End Time
    </label>
    <input type="time"
           id="time-end"
           class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 
                  text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 
                  focus:border-amber-500 transition-all duration-150
                  [color-scheme:dark]">
  </div>
</div>
```

---

### Form Layouts

**Usage:** Organizing form elements in columns/rows

```html
<!-- Two Column Form -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <label class="block text-sm font-medium text-gray-400 mb-1">First Name</label>
    <input type="text" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
    <input type="text" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
  </div>
</div>

<!-- Inline Form -->
<form class="flex flex-col sm:flex-row gap-4">
  <input type="text" placeholder="Search appointments..." 
         class="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
  <select class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
    <option>All Status</option>
    <option>Confirmed</option>
    <option>Pending</option>
  </select>
  <button type="submit" class="bg-amber-500 text-slate-900 font-semibold rounded-lg px-6 py-3">
    Search
  </button>
</form>
```

---

## Cards & Panels

### Standard Card

**Usage:** Content containers, grouped information

```html
<!-- Standard Card -->
<div class="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-md">
  <div class="px-6 py-5 border-b border-slate-700/50">
    <h3 class="text-lg font-semibold text-white">Recent Activity</h3>
  </div>
  <div class="px-6 py-5">
    <!-- Card Content -->
    <p class="text-gray-400">Activity content goes here...</p>
  </div>
</div>
```

---

### Stats Card

**Usage:** Displaying key metrics, KPIs

```html
<!-- Stats Card -->
<div class="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
  <div class="flex items-center justify-between mb-4">
    <div class="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
      <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    <span class="text-xs font-medium text-emerald-400 bg-emerald-500/15 px-2 py-1 rounded-full">
      +12.5%
    </span>
  </div>
  <div>
    <p class="text-3xl font-bold text-white">$4,521</p>
    <p class="text-sm text-gray-400 mt-1">Total Revenue</p>
  </div>
</div>

<!-- Stats Card - Inline -->
<div class="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
  <div class="flex items-center gap-4">
    <div class="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
      <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    <div>
      <p class="text-xl font-semibold text-white">128</p>
      <p class="text-xs text-gray-400">Completed Today</p>
    </div>
  </div>
</div>
```

---

### List Card

**Usage:** Lists of items, recent activity

```html
<!-- List Card -->
<div class="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-md">
  <div class="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
    <h3 class="text-lg font-semibold text-white">Upcoming Appointments</h3>
    <button class="text-sm text-amber-500 hover:text-amber-400">View All</button>
  </div>
  <div class="divide-y divide-slate-700/50">
    <!-- List Item -->
    <div class="px-6 py-4 hover:bg-slate-700/30 transition-colors cursor-pointer">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-semibold text-white">
            JD
          </div>
          <div>
            <p class="font-medium text-white">John Doe</p>
            <p class="text-sm text-gray-400">Haircut • 30 min</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-medium text-white">2:00 PM</p>
          <p class="text-xs text-amber-500">Today</p>
        </div>
      </div>
    </div>
    
    <!-- More items... -->
  </div>
</div>
```

---

### Profile Card

**Usage:** User profiles, staff cards

```html
<!-- Profile Card -->
<div class="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-md text-center">
  <div class="relative inline-block mb-4">
    <div class="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl font-bold text-slate-900">
      MJ
    </div>
    <span class="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-slate-800 rounded-full"></span>
  </div>
  <h3 class="text-lg font-semibold text-white">Michael Johnson</h3>
  <p class="text-gray-400 text-sm mb-4">Master Barber</p>
  <div class="flex justify-center gap-2 mb-6">
    <span class="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-500">5+ Years</span>
    <span class="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-500">4.9 ★</span>
  </div>
  <div class="grid grid-cols-3 gap-4 text-center">
    <div>
      <p class="text-xl font-bold text-white">1,247</p>
      <p class="text-xs text-gray-400">Cuts</p>
    </div>
    <div>
      <p class="text-xl font-bold text-white">98%</p>
      <p class="text-xs text-gray-400">Rating</p>
    </div>
    <div>
      <p class="text-xl font-bold text-white">$45</p>
      <p class="text-xs text-gray-400">Avg. Tip</p>
    </div>
  </div>
</div>
```

---

## Navigation

### Header Bar

**Usage:** Top navigation, branding, user menu

```html
<!-- Header Bar -->
<header class="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <svg class="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span class="text-xl font-bold text-white">BarberZap</span>
      </div>
      
      <!-- Nav Links -->
      <nav class="hidden md:flex items-center gap-1">
        <a href="#" class="px-4 py-2 text-sm font-medium text-amber-500 bg-amber-500/10 rounded-lg">Dashboard</a>
        <a href="#" class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-slate-800/50">Appointments</a>
        <a href="#" class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-slate-800/50">Clients</a>
        <a href="#" class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-slate-800/50">Staff</a>
      </nav>
      
      <!-- User Menu -->
      <div class="flex items-center gap-3">
        <button class="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800/50">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
        </button>
        <div class="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white cursor-pointer hover:ring-2 hover:ring-amber-500/50 transition-all">
          A
        </div>
      </div>
    </div>
  </div>
</header>
```

---

### Sidebar Navigation

**Usage:** Main navigation, menu items

```html
<!-- Sidebar -->
<aside class="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 z-40 hidden lg:block">
  <div class="p-6">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
        <svg class="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <span class="text-xl font-bold text-white">BarberZap</span>
    </div>
    
    <nav class="space-y-1">
      <!-- Active Nav Item -->
      <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-amber-500 bg-amber-500/10 rounded-xl">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
        Dashboard
      </a>
      
      <!-- Nav Item -->
      <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        Appointments
      </a>
      
      <!-- Nav Item with Badge -->
      <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        Clients
        <span class="ml-auto bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">3</span>
      </a>
      
      <!-- Section Divider -->
      <div class="pt-4 mt-4 border-t border-slate-800">
        <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Management</p>
      </div>
      
      <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        Staff
      </a>
      
      <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        Services
      </a>
      
      <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        Reports
      </a>
    </nav>
  </div>
  
  <!-- bottom section -->
  <div class="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-slate-900">
        A
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white truncate">Admin User</p>
        <p class="text-xs text-gray-400 truncate">admin@barberzap.com</p>
      </div>
      <button class="p-2 text-gray-400 hover:text-white hover:bg-slate-800/50 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
      </button>
    </div>
  </div>
</aside>
```

---

### Breadcrumbs

**Usage:** Page hierarchy, navigation path

```html
<!-- Breadcrumbs -->
<nav class="flex items-center gap-2 text-sm">
  <a href="#" class="text-gray-400 hover:text-amber-500 transition-colors">
    Dashboard
  </a>
  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
  </svg>
  <a href="#" class="text-gray-400 hover:text-amber-500 transition-colors">
    Appointments
  </a>
  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
  </svg>
  <span class="text-white font-medium">Today's Schedule</span>
</nav>
```

---

### Tabs

**Usage:** Organizing content into sections

```html
<!-- Tabs -->
<div class="border-b border-slate-700">
  <nav class="-mb-px flex gap-6" aria-label="Tabs">
    <button class="pb-4 px-1 border-b-2 border-amber-500 text-amber-500 text-sm font-medium">
      All Appointments
    </button>
    <button class="pb-4 px-1 border-b-2 border-transparent text-gray-400 hover:text-white hover:border-slate-600 text-sm font-medium transition-colors">
      Confirmed
      <span class="ml-2 px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400">24</span>
    </button>
    <button class="pb-4 px-1 border-b-2 border-transparent text-gray-400 hover:text-white hover:border-slate-600 text-sm font-medium transition-colors">
      Pending
      <span class="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400">8</span>
    </button>
    <button class="pb-4 px-1 border-b-2 border-transparent text-gray-400 hover:text-white hover:border-slate-600 text-sm font-medium transition-colors">
      Cancelled
    </button>
  </nav>
</div>

<!-- Segmented Tabs (Pill Style) -->
<div class="inline-flex rounded-lg bg-slate-800/50 p-1 border border-slate-700/50">
  <button class="px-6 py-2 text-sm font-medium rounded-md bg-slate-700 text-white shadow">
    Schedule
  </button>
  <button class="px-6 py-2 text-sm font-medium rounded-md text-gray-400 hover:text-white">
    Calendar
  </button>
  <button class="px-6 py-2 text-sm font-medium rounded-md text-gray-400 hover:text-white">
    List View
  </button>
</div>
```

---

## Feedback & Status

### Badges & Tags

**Usage:** Status indicators, labels, categories

```html
<!-- Status Badges -->
<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></span>
  Confirmed
</span>

<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-500">
  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
  Pending
</span>

<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400">
  <span class="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
  Cancelled
</span>

<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">
  In Progress
</span>

<!-- Solid Badge -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-500 text-slate-900">
  Premium
</span>

<!-- Outline Badge -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border border-amber-500 text-amber-500">
  VIP
</span>

<!-- Tag Pills -->
<div class="flex flex-wrap gap-2">
  <span class="px-3 py-1 rounded-lg text-xs font-medium bg-slate-700 text-gray-300">Haircut</span>
  <span class="px-3 py-1 rounded-lg text-xs font-medium bg-slate-700 text-gray-300">Beard Trim</span>
  <span class="px-3 py-1 rounded-lg text-xs font-medium bg-slate-700 text-gray-300">Shave</span>
</div>
```

---

### Alert/Notification

**Usage:** Important messages, system notifications

```html
<!-- Success Alert -->
<div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
  <div class="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
    </svg>
  </div>
  <div class="flex-1">
    <p class="text-sm font-medium text-emerald-400">Appointment Confirmed</p>
    <p class="text-xs text-gray-400 mt-0.5">The appointment has been successfully scheduled.</p>
  </div>
  <button class="text-gray-400 hover:text-white">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>
</div>

<!-- Warning Alert -->
<div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
  <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>
  <div class="flex-1">
    <p class="text-sm font-medium text-amber-500">Payment Required</p>
    <p class="text-xs text-gray-400 mt-0.5">Please complete payment before the appointment date.</p>
  </div>
</div>

<!-- Error Alert -->
<div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
  <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
  <div class="flex-1">
    <p class="text-sm font-medium text-red-400">Booking Failed</p>
    <p class="text-xs text-gray-400 mt-0.5">The selected time slot is no longer available.</p>
  </div>
</div>

<!-- Info Alert -->
<div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
  <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
  <div class="flex-1">
    <p class="text-sm font-medium text-blue-400">New Feature Available</p>
    <p class="text-xs text-gray-400 mt-0.5">You can now accept online payments directly.</p>
  </div>
  <button class="text-xs font-medium text-blue-400 hover:text-blue-300">
    Learn more
  </button>
</div>
```

---

### Toast Notification

**Usage:** ephemeral feedback messages

```html
<!-- Toast Notification -->
<div class="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-4 flex items-center gap-3 z-[700] animate-slide-up">
  <div class="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
    <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>
  </div>
  <div class="flex-1">
    <p class="text-sm font-medium text-white">Changes Saved</p>
    <p class="text-xs text-gray-400">Your settings have been updated.</p>
  </div>
  <button class="text-gray-400 hover:text-white p-1">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>
</div>
```

---

### Progress Indicators

**Usage:** Loading states, progress tracking

```html
<!-- Spinner -->
<div class="flex items-center justify-center">
  <svg class="animate-spin w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
</div>

<!-- Progress Bar -->
<div>
  <div class="flex justify-between text-sm mb-2">
    <span class="text-gray-400">Import Progress</span>
    <span class="text-white font-medium">75%</span>
  </div>
  <div class="w-full bg-slate-700 rounded-full h-2">
    <div class="bg-amber-500 h-2 rounded-full transition-all duration-500" style="width: 75%"></div>
  </div>
</div>

<!-- Circular Progress -->
<div class="relative w-24 h-24">
  <svg class="w-24 h-24 transform -rotate-90">
    <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="none" class="text-slate-700"/>
    <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="none" class="text-amber-500"
            stroke-dasharray="251.2" stroke-dashoffset="62.8" stroke-linecap="round"/>
  </svg>
  <div class="absolute inset-0 flex items-center justify-center">
    <span class="text-2xl font-bold text-white">75%</span>
  </div>
</div>
```

---

## Data Display

### Table

**Usage:** Structured data, lists, records

```html
<!-- Data Table -->
<div class="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-slate-900/50">
        <tr>
          <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Client
          </th>
          <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Service
          </th>
          <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Barber
          </th>
          <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Time
          </th>
          <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Status
          </th>
          <th class="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-700/50">
        <!-- Row -->
        <tr class="hover:bg-slate-700/30 transition-colors cursor-pointer">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white">
                JD
              </div>
              <div>
                <p class="font-medium text-white">John Doe</p>
                <p class="text-xs text-gray-400">john@example.com</p>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <p class="text-white">Haircut</p>
            <p class="text-xs text-gray-400">30 min</p>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-xs font-medium text-amber-500">
                MJ
              </div>
              <span class="text-white">Michael J.</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <p class="text-white">2:00 PM</p>
            <p class="text-xs text-gray-400">Today</p>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
              Confirmed
            </span>
          </td>
          <td class="px-6 py-4 text-right">
            <div class="flex items-center justify-end gap-2">
              <button class="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
              <button class="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </button>
              <button class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
        
        <!-- More rows... -->
      </tbody>
    </table>
  </div>
  
  <!-- Pagination -->
  <div class="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
    <p class="text-sm text-gray-400">Showing <span class="text-white font-medium">1-10</span> of <span class="text-white font-medium">128</span> results</p>
    <div class="flex items-center gap-2">
      <button class="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg disabled:opacity-50" disabled>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <button class="px-3 py-2 text-sm text-white bg-amber-500 text-slate-900 font-medium rounded-lg">1</button>
      <button class="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg">2</button>
      <button class="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg">3</button>
      <button class="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
</div>
```

---

### Avatar

**Usage:** User profiles, initials

```html
<!-- Avatar Sizes -->
<div class="flex items-center gap-4">
  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-slate-900">
    JD
  </div>
  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-slate-900">
    MJ
  </div>
  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-base font-bold text-slate-900">
    TS
  </div>
  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-lg font-bold text-slate-900">
    AB
  </div>
</div>

<!-- Avatar with Image -->
<div class="relative">
  <img src="/avatar.jpg" alt="John Doe" class="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700">
  <span class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-800 rounded-full"></span>
</div>

<!-- Avatar Group -->
<div class="flex -space-x-3">
  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-slate-900 ring-2 ring-slate-900">
    JD
  </div>
  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-slate-900">
    MJ
  </div>
  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-slate-900">
    TS
  </div>
  <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white ring-2 ring-slate-900">
    +5
  </div>
</div>
```

---

## Overlays & Modals

### Modal

**Usage:** Dialogs, forms, important actions

```html
<!-- Modal Backdrop -->
<div class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[400] animate-fade-in"></div>

<!-- Modal -->
<div class="fixed inset-0 z-[500] flex items-center justify-center p-4">
  <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
    <!-- Modal Header -->
    <div class="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-white">New Appointment</h3>
      <button class="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    
    <!-- Modal Body -->
    <div class="px-6 py-5">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">Client Name</label>
          <input type="text" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">Service</label>
          <select class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
            <option>Haircut</option>
            <option>Beard Trim</option>
            <option>Shave</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Date</label>
            <input type="date" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Time</label>
            <input type="time" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Footer -->
    <div class="px-6 py-5 border-t border-slate-700 flex justify-end gap-3">
      <button class="px-4 py-2 text-gray-400 hover:text-white font-medium rounded-lg hover:bg-slate-700/50 transition-colors">
        Cancel
      </button>
      <button class="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors">
        Create Appointment
      </button>
    </div>
  </div>
</div>
```

---

### Drawer/Slide-over

**Usage:** Side panels, filters, details

```html
<!-- Drawer Backdrop -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[400]"></div>

<!-- Drawer -->
<div class="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-800 border-l border-slate-700 z-[500] shadow-2xl animate-slide-right">
  <div class="h-full flex flex-col">
    <!-- Drawer Header -->
    <div class="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-white">Filter Appointments</h3>
      <button class="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    
    <!-- Drawer Body -->
    <div class="flex-1 overflow-y-auto px-6 py-5">
      <div class="space-y-6">
        <div>
          <p class="text-sm font-medium text-gray-400 mb-3">Status</p>
          <div class="space-y-2">
            <label class="flex items-center gap-3">
              <input type="checkbox" checked class="rounded bg-slate-700 border-slate-600 text-amber-500">
              <span class="text-sm text-gray-300">Confirmed</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="checkbox" checked class="rounded bg-slate-700 border-slate-600 text-amber-500">
              <span class="text-sm text-gray-300">Pending</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="checkbox" class="rounded bg-slate-700 border-slate-600 text-amber-500">
              <span class="text-sm text-gray-300">Cancelled</span>
            </label>
          </div>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-400 mb-3">Barber</p>
          <select class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
            <option>All Barbers</option>
            <option>Michael Johnson</option>
            <option>Thomas Smith</option>
            <option>David Brown</option>
          </select>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-400 mb-3">Date Range</p>
          <div class="grid grid-cols-2 gap-3">
            <input type="date" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
            <input type="date" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white">
          </div>
        </div>
      </div>
    </div>
    
    <!-- Drawer Footer -->
    <div class="px-6 py-5 border-t border-slate-700">
      <div class="flex gap-3">
        <button class="flex-1 px-4 py-2 text-gray-400 hover:text-white font-medium rounded-lg hover:bg-slate-700/50">
          Clear Filters
        </button>
        <button class="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg">
          Apply Filters
        </button>
      </div>
    </div>
  </div>
</div>
```

---

### Dropdown Menu

**Usage:** Actions, options, contextual menus

```html
<!-- Dropdown -->
<div class="relative">
  <button class="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors">
    <span>Actions</span>
    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
    </svg>
  </button>
  
  <!-- Dropdown Menu -->
  <div class="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-100">
    <div class="py-1">
      <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        View Details
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
        </svg>
        Edit
      </a>
      <div class="border-t border-slate-700 my-1"></div>
      <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Delete
      </a>
    </div>
  </div>
</div>
```

---

### Tooltip

**Usage:** Helper text, explanations

```html
<!-- Tooltip -->
<div class="relative group">
  <button class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700/50">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  </button>
  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
    This is a tooltip
    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
  </div>
</div>
```

---

## Layout Components

### Container

**Usage:** Page layout, max-width constraints

```html
<!-- Page Container -->
<div class="min-h-screen bg-slate-900">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Page Content -->
  </div>
</div>

<!-- Narrow Container -->
<div class="max-w-2xl mx-auto">
  <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8">
    <!-- Narrow content -->
  </div>
</div>
```

---

### Grid Layout

**Usage:** Responsive grids, card layouts

```html
<!-- Responsive Grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <div class="bg-slate-800/50 rounded-xl p-6">Card 1</div>
  <div class="bg-slate-800/50 rounded-xl p-6">Card 2</div>
  <div class="bg-slate-800/50 rounded-xl p-6">Card 3</div>
  <div class="bg-slate-800/50 rounded-xl p-6">Card 4</div>
</div>

<!-- Masonry-like Grid (different column spans) -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="md:col-span-2">Wide Card</div>
  <div>Narrow Card</div>
  <div>Narrow Card</div>
  <div class="md:col-span-2">Wide Card</div>
</div>
```

---

### Divider

**Usage:** Visual separation

```html
<!-- Horizontal Divider -->
<hr class="border-slate-700/50">

<!-- Divider with Text -->
<div class="relative">
  <div class="absolute inset-0 flex items-center">
    <div class="w-full border-t border-slate-700/50"></div>
  </div>
  <div class="relative flex justify-center">
    <span class="px-4 bg-slate-900 text-sm text-gray-400">or continue with</span>
  </div>
</div>
```

---

### Empty State

**Usage:** No data, empty lists

```html
<!-- Empty State -->
<div class="bg-slate-800/30 border border-slate-700/30 rounded-xl p-12 text-center">
  <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700/50 flex items-center justify-center">
    <svg class="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  </div>
  <h3 class="text-lg font-semibold text-white mb-2">No appointments yet</h3>
  <p class="text-gray-400 mb-6 max-w-sm mx-auto">
    Start by creating your first appointment to manage your barbershop schedule.
  </p>
  <button class="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
    </svg>
    Create Appointment
  </button>
</div>
```

---

## Accessibility Guidelines

### General Principles

The BarberZap Admin Panel follows WCAG 2.1 Level AA standards for accessibility.

### Color Contrast

- **Normal text:** Minimum 4.5:1 contrast ratio
- **Large text (18px+):** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio for borders and backgrounds

All default colors meet these requirements:
- White text on slate-900 background: ~15:1 contrast
- Gray-400 on slate-900: ~6:1 contrast
- Gold-500 on slate-900: ~4.8:1 contrast ✅

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```html
<!-- Accessible Button -->
<button class="..." type="button">
  Button text or aria-label
</button>

<!-- Accessible Link -->
<a href="#" aria-label="View appointment details">
  <svg>...</svg>
</a>

<!-- Accessible Form Input -->
<label for="appointment-date" class="...">
  Appointment Date
</label>
<input id="appointment-date" type="date" aria-describedby="date-hint">
<p id="date-hint" class="text-xs text-gray-400">
  Select a date within the next 30 days
</p>
```

### Focus States

All focusable elements must have visible focus indicators:

```css
/* Focus ring styles */
.focus-visible-ring {
  outline: none;
  box-shadow: 0 0 0 2px hsl(222 47% 11%), 
              0 0 0 4px hsl(var(--color-gold-500));
}

/* Tailwind classes */
focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
```

### Screen Reader Support

Use proper ARIA labels for icon-only buttons and complex components:

```html
<!-- Icon Button with Label -->
<button aria-label="Close modal">
  <svg>...</svg>
</button>

<!-- Live Region for Dynamic Updates -->
<div aria-live="polite" aria-atomic="true" id="status-message">
  <!-- Status messages appear here -->
</div>

<!-- Landmark Regions -->
<header role="banner">
<nav role="navigation" aria-label="Main navigation">
<main role="main">
<footer role="contentinfo">
```

### Reduced Motion

Respect user's motion preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Semantic HTML

Use proper HTML elements for structure:

```html
<!-- Good ✅ -->
<nav>
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<!-- Bad ❌ -->
<div class="nav">
  <div class="link">Dashboard</div>
</div>
```

### Form Accessibility

Ensure all form inputs have associated labels:

```html
<!-- Good ✅ -->
<div>
  <label for="email">Email Address <span class="text-red-400">*</span></label>
  <input id="email" type="email" required aria-required="true" aria-invalid="false">
  <span class="error-message" role="alert"></span>
</div>

<!-- Required Field Indicator -->
<span class="inline-block ml-1 text-amber-500" aria-label="required">
  *
</span>
```

### Table Accessibility

Use proper table headers and captions:

```html
<table role="table" aria-label="Appointments list">
  <caption>List of all appointments for today</caption>
  <thead>
    <tr>
      <th scope="col">Client Name</th>
      <th scope="col">Service</th>
      <th scope="col">Time</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">John Doe</th>
      <td>Haircut</td>
      <td>2:00 PM</td>
    </tr>
  </tbody>
</table>
```

---

## Component Best Practices

### DO ✅

- Use consistent spacing from the 8-point grid
- Apply glass morphism effects subtly for depth
- Use gold/amber accent colors sparingly for CTAs
- Provide clear focus states for keyboard users
- Include loading states for async actions
- Use semantic HTML elements
- Group related elements visually

### DON'T ❌

- Overuse gold accents (1-2 per page/section max)
- Make text smaller than 12px
- Hide focus indicators
- Use color alone to convey status
- Create custom form controls without accessible implementations
- Ignore reduced motion preferences
- Mix too many animation types

---

## Animation Guidelines

### Micro-interactions

Keep interactions fast and subtle:

```css
/* Hover state */
.hover-effect {
  transition: all var(--duration-fast) var(--ease-out);
}

.hover-effect:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

### Page Transitions

Use smooth fade/s animations for routing:

```css
/* Page enter */
.page-enter {
  animation: slideUp 300ms var(--ease-out);
}

/* Modal enter */
.modal-enter {
  animation: scaleIn 200ms var(--ease-out);
}

/* Backdrop enter */
.backdrop-enter {
  animation: fadeIn 200ms var(--ease-out);
}
```

### Loading States

Use subtle animations for loading:

```css
/* Skeleton loader */
.skeleton {
  background: linear-gradient(
    90deg,
    hsl(217 33% 25%) 0%,
    hsl(217 33% 30%) 50%,
    hsl(217 33% 25%) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
```

---

**End of Component Guidelines**
-700 border-slate-600 text-amber-500">
              <span class="text-sm text-gray-300">Confirmed</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="checkbox" checked class="rounded bg-slate
        </svg