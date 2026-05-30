# 🛠️ Implementation Guide

Step-by-step guide for implementing and using the Component Agents system.

---

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Setting Up the Environment](#setting-up-the-environment)
3. [Creating Your First Component](#creating-your-first-component)
4. [Migrating Existing Code](#migrating-existing-code)
5. [Testing Components](#testing-components)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Common Workflows](#common-workflows)

---

## 🚀 QUICK START

### What You Need

- Node.js 18+ installed
- BarberZap repository cloned
- Access to AI agent system (for agent usage)
- Basic React/TypeScript knowledge

### 5-Minute Setup

```bash
# 1. Navigate to project
cd /root/barber

# 2. Verify structure
ls -la src/components/ui/
# Should see: Button.tsx, Badge.tsx, index.ts, README.md

# 3. Check docs
ls -la docs/
# Should see: README.md, SPECIALIST_EM_COMPONENT_AGENTS.md, etc.

# 4. Done! You're ready to use components
```

---

## 🏗️ SETTING UP THE ENVIRONMENT

---

### Step 1: Verify Dependencies

Check if required packages are installed:

```bash
# Check package.json for Tailwind CSS
grep -i "tailwind" package.json

# Should see:
# - tailwindcss
# - (optional) tailwind-merge, clsx
```

If missing, install:

```bash
npm install tailwindcss
npm install -D tailwind-merge clsx
```

---

### Step 2: Configure Tailwind

Verify `tailwind.config.ts` exists and includes paths:

```typescript
// tailwind.config.ts
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Custom colors, shadows, etc.
    },
  },
  plugins: [], // Add plugins if needed
}
```

---

### Step 3: Create Utility for Class Merging

Create `src/lib/cn.ts`:

```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### Step 4: Verify Components Export

Check `src/components/ui/index.ts`:

```typescript
// src/components/ui/index.ts
export { default as Button, ButtonProps } from './Button';
export { default as Badge, BadgeProps } from './Badge';
```

---

## 💡 CREATING YOUR FIRST COMPONENT

---

### Method 1: Using Agent System (Recommended)

#### Step 1: Define Requirements

```
I need an Input component for forms with:
- Label support
- Left and right icons
- Error state
- Required field indicator
- Focus states matching existing design
```

#### Step 2: Use Component Architect Agent

```
You are the Component Architect Agent for BarberZap Admin Panel.

Create specification for Input component:
- Used in forms throughout the app
- Needs: label, placeholder, leftIcon, rightIcon, error, required
- Size variants: default (h-12), small (h-10)
- States: default, focused, error, disabled
- Accessibility: label association, ARIA attributes
- Reference Login.tsx for existing patterns
```

#### Step 3: Use Component Generator Agent

```
Implement Input component following the specification.
Use styles from Login.tsx as reference.
Include proper TypeScript types.
Follow existing Button.tsx patterns for consistency.
```

#### Step 4: Use Component QA Agent

```
QA check on Input component:
- Accessibility (label-for, ARIA)
- Focus states visible
- Error states clear
- Keyboard navigation works
- Matches design system
```

#### Step 5: Add to Exports

```typescript
// src/components/ui/index.ts
export { default as Input, InputProps } from './Input';
```

---

### Method 2: Manual Implementation

#### Step 1: Create Component File

```bash
touch src/components/ui/Input.tsx
```

#### Step 2: Copy Template

Use Button.tsx as template:

```typescript
import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: string;
  rightIcon?: string;
  error?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  leftIcon,
  rightIcon,
  error,
  required,
  className,
  ...inputProps
}) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {leftIcon}
          </span>
        )}
        <input
          {...inputProps}
          className={`w-full bg-black/40 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-[#f4c025]/50 focus:ring-1 focus:ring-[#f4c025]/50 transition-all ${leftIcon ? 'pl-12' : 'px-4'} ${rightIcon ? 'pr-12' : 'px-4'} ${className}`}
        />
        {rightIcon && (
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
            <span className="material-symbols-outlined">{rightIcon}</span>
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
```

#### Step 3: Add JSDoc Documentation

```typescript
/**
 * Input Component
 * 
 * Text input with label, icons, and error states for forms.
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="seu@email.com"
 *   leftIcon="mail"
 *   required
 * />
 * ```
 */
```

#### Step 4: Export

```typescript
// src/components/ui/index.ts
export { default as Input, InputProps } from './Input';
```

---

## 🔄 MIGRATING EXISTING CODE

---

### Step 1: Identify Patterns

Look for repeated patterns in your codebase:

```bash
# Search for inline button patterns
grep -r "bg-\[#f4c025\]" src/components/

# Search for inline badge patterns
grep -r "rounded-full text-\[10px\] font-bold uppercase" src/components/

# Search for inline stat cards
grep -r "bg-zinc-900 border border-white/10" src/components/
```

---

### Step 2: Review Migration Examples

Check `docs/COMPONENT_MIGRATION_EXAMPLES.md` for:
- Button migration (pages: Dashboard, ServicesList, Agenda)
- Badge migration (pages: Dashboard, ServicesList)
- PageHeader extraction (pages: Dashboard, ServicesList, Agenda, Finance)

---

### Step 3: Replace Inline Patterns

**Before:**
```tsx
<button className="px-6 py-4 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg active:scale-95">
  Save
</button>
```

**After:**
```tsx
import { Button } from '@/components/ui';

<Button size="md">Save</Button>
```

---

### Step 4: Verify Functionality

1. **Visual consistency:** Component looks the same
2. **Functionality intact:** All features work
3. **Accessibility:** Keyboard, screen reader still work
4. **Performance:** No performance regression

---

## 🧪 TESTING COMPONENTS

---

### Manual Testing Checklist

```typescript
// For testing component variants

// Button
- [ ] All variants render (primary, secondary, danger, ghost, link, success)
- [ ] All sizes render (xs, sm, md, lg, xl, icon)
- [ ] All shapes render (square, rounded, circle, pill)
- [ ] Icons render correctly (left, right, icon-only)
- [ ] Loading state shows spinner
- [ ] Disabled state prevents clicks
- [ ] Hover states trigger correctly
- [ ] Focus indicators visible
- [ ] Keyboard navigation works (Tab, Enter, Space)

// Badge
- [ ] All variants render (default, success, warning, danger, info, gold)
- [ ] All sizes render (sm, md, lg)
- [ ] All shapes render (square, rounded, pill)
- [ ] Uppercase toggle works

// Input
- [ ] Label renders above input
- [ ] Placeholder shows correctly
- [ ] Icons render in correct positions
- [ ] Error state shows red border and message
- [ ] Focus state shows gold ring
- [ ] Required indicator shows asterisk
```

---

### Testing with Storybook (Optional)

```bash
# Install Storybook
npx storybook@latest init

# Create story for Button
# .storybook/stories/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Save',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    leftIcon: 'add',
    children: 'Add Item',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Processing...',
  },
};
```

---

### Browser Testing

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
# Test each component manually
# Check in DevTools for:
# - Correct HTML structure
# - Accessibility attributes (ARIA)
# - Focus states
# - Console errors
```

---

## ✅ BEST PRACTICES

---

### 1. Component Design

✅ **Do:**
- Keep components focused on one responsibility
- Use composition for flexibility
- Provide default values for optional props
- Use TypeScript strictly (no `any`)
- Document with JSDoc comments

❌ **Don't:**
- Make components too complex
- Use hardcoded values (use design tokens)
- Skip accessibility attributes
- Mix concerns (logic + presentation)

---

### 2. Performance

✅ **Do:**
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to children
- Use `memo()` for components that re-render often with same props
- Code-split large components if needed

❌ **Don't:**
- Over-optimize prematurely
- Use `useMemo` for trivial calculations
- Create many small useCallbacks unnecessarily
- Inline functions in render without memoization

---

### 3. Accessibility

✅ **Do:**
- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation works
- Include focus indicators
- Check color contrast (4.5:1 for text)
- Test with screen reader

❌ **Don't:**
- Use `div` for buttons (use `button`)
- Hide interactive elements from screen readers
- Remove focus indicators
- Use color alone for meaning

---

### 4. TypeScript

✅ **Do:**
- Use proper interfaces for props
- Extend `React.HTMLAttributes` when appropriate
- Use type unions for variants
- Type event handlers correctly
- Avoid `any` type

❌ **Don't:**
- Use `any` for props
- Skip type definitions
- Use `any` for event handlers
- Ignore TypeScript errors

---

## 🐛 TROUBLESHOOTING

---

### Issue: Component Styles Not Applying

**Symptom:** Tailwind classes don't work

**Solutions:**
```bash
# 1. Check Tailwind config paths
cat tailwind.config.ts | grep content

# 2. Restart dev server
npm run dev

# 3. Check class names are correct (no typos)
# 4. Ensure no conflicting CSS
```

---

### Issue: TypeScript Errors

**Symptom:** `Property does not exist on type`

**Solutions:**
```typescript
// 1. Check prop types match interface
// 2. Ensure correct import path
// 3. Check for type conflicts
// 4. Verify TypeScript configuration

// Example fix:
// Before:
interface Props {
  variant: 'primary' | 'secondary'
}

// After (if passing string):
interface Props {
  variant?: 'primary' | 'secondary'  // Optional
}
```

---

### Issue: Accessibility Fails

**Symptom:** Axe DevTools shows errors

**Solutions:**
```tsx
// 1. Add aria-label for icon-only buttons
<variant="ghost" iconOnly aria-label="Edit">...</Button>

// 2. Use semantic elements
// Wrong: <div onClick={...}>Click</div>
// Right: <button onClick={...}>Click</button>

// 3. Associate labels with inputs
<label htmlFor="email">Email</label>
<input id="email" />
```

---

### Issue: Performance Degradation

**Symptom:** Slow renders, laggy UI

**Solutions:**
```tsx
// 1. Add React.memo for expensive components
export const Expensive = memo(({ data }) => { ... });

// 2. Use useMemo for expensive calculations
const filtered = useMemo(() => data.filter(...), [data]);

// 3. Use useCallback for handlers
const handleClick = useCallback(() => { ... }, [deps]);
```

---

## 🔄 COMMON WORKFLOWS

---

### Workflow 1: Adding a New Variant to Existing Component

**Example:** Add `outline` variant to Button

```typescript
// 1. Update type
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'ghost' 
  | 'link' 
  | 'success'
  | 'outline';  // NEW

// 2. Add variant classes
const variantClasses: Record<ButtonVariant, string> = {
  // ... existing variants
  outline: 'border border-[#f4c025] bg-transparent text-[#f4c025] hover:bg-[#f4c025] hover:text-black',
};

// 3. Test
<Button variant="outline">Outline Button</Button>
```

---

### Workflow 2: Extracting a Pattern from Page

**Example:** Extract PageHeader from multiple pages

```tsx
// 1. Identify pattern (repeated across Dashboard, ServicesList, etc.)
// 2. Create component
// components/patterns/PageHeader.tsx

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-2">{title}</h1>
        {description && <p className="text-zinc-500">{description}</p>}
      </div>
      {actions && <>{actions}</>}
    </header>
  );
};

// 3. Replace in pages
// Before:
<header>...</header>

// After:
import { PageHeader } from '@/components/patterns';
<PageHeader title="Dashboard" description="Visão geral" />
```

---

### Workflow 3: Validating Component with QA

```bash
# 1. Use QA Agent prompt
QA check on src/components/ui/Button.tsx

# 2. Review YAML report
accessibility_score: 95
performance_score: 92
code_quality_score: 90
design_consistency_score: 98
overall_score: 94

critical_issues: []  # Good!
warnings: [ minor items ]

approved: true

# 3. If not approved, fix issues and retry
```

---

## 📚 RESOURCES

---

### Documentation
- [Component Agents Architecture](./SPECIALIST_EM_COMPONENT_AGENTS.md)
- [Quick Reference](./COMPONENT_AGENTS_QUICK_REFERENCE.md)
- [Migration Examples](./COMPONENT_MIGRATION_EXAMPLES.md)

### External Links
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Material Symbols](https://fonts.google.com/icons)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)

### Tools
- [Axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debugging
- [Lighthouse](https://developer.chrome.com/docs/lighthouse) - Performance
- [Storybook](https://storybook.js.org) - Component documentation

---

## 🎯 NEXT STEPS

---

1. ✅ **Review** implemented components (Button, Badge)
2. 🔄 **Create** next component (Input, PageHeader)
3. 🔄 **Migrate** existing pages to use components
4. 🔄 **Test** all components thoroughly
5. 🔄 **Document** any custom patterns found
6. 🔄 **Contribute** new components to the library
7. 🔄 **Maintain** design system tokens consistency

---

**Version:** 1.0  
**Last Updated:** 2026-03-03  
**Maintainer:** Component Agents Architecture Team
