# BarberZap Core Components Library

> **Version:** 1.0.0  
> **Total Components:** 25  
> **Last Updated:** 2026-02-25

A comprehensive library of 25 reusable UI components for the BarberZap Admin Panel. Built with React, Tailwind CSS, and full Dark Theme support.

---

## Quick Start

```jsx
import { Button, Input, StatCard, DataTable } from './CoreComponents';

function MyPage() {
  return (
    <div>
      <StatCard
        icon={DollarSign}
        value="$4,521"
        label="Total Revenue"
        trend="up"
        trendValue={12.5}
      />
      
      <Button variant="primary">
        Create Appointment
      </Button>
    </div>
  );
}
```

---

## Components Overview

### Data Display (5 components)

| Component | Description |
|-----------|-------------|
| **StatCard** | Metric card with icon, value, label, and trend |
| **DataTable** | Sortable table with pagination |
| **CardList** | List of cards (horizontal/vertical/grid) |
| **Badge** | Status/role badges (success, warning, error, info) |
| **Avatar** | User avatar with initials fallback |

### Form Elements (7 components)

| Component | Description |
|-----------|-------------|
| **Input** | Text inputs with states (default, error, success) |
| **Select** | Dropdown with search |
| **DatePicker** | Date picker component |
| **PhoneInput** | Brazilian phone format input |
| **Toggle** | On/off switch |
| **Checkbox / Radio** | Custom styled checkboxes and radios |
| **SearchBox** | Global search input with history |

### Navigation & Actions (7 components)

| Component | Description |
|-----------|-------------|
| **Button** | Variants (primary, secondary, outline, danger) |
| **IconButton** | Icon-only button |
| **ButtonGroup** | Grouped buttons |
| **Tabs** | Tab navigation |
| **Breadcrumbs** | Navigation breadcrumbs |
| **Dropdown** | Menu dropdown |
| **Pagination** | Table pagination |

### Feedback & Overlays (6 components)

| Component | Description |
|-----------|-------------|
| **Alert** | Success/error/info alerts |
| **Toast** | Toast notifications |
| **LoadingSpinner** | Loading indicator |
| **EmptyState** | No data placeholder |
| **Modal** | Dialog modal |
| **ConfirmDialog** | Confirmation modal |

---

## Features

✅ **Design System Compliance** - Uses colors, shadows, border-radius from tokens  
✅ **Responsive** - Mobile-first, breakpoints  
✅ **Accessible** - ARIA labels, keyboard nav, WCAG AA compliant  
✅ **Dark Theme** - Slate-900 background, gray text hierarchy  
✅ **Glass Morphism** - Backdrop-blur where appropriate  
✅ **States** - Hover, active, disabled, loading, error  
✅ **TypeScript Ready** - Props interfaces documented  
✅ **Examples Included** - Documentation with code snippets  

---

## Installation

```bash
# Components are located at:
/root/Barberzap SITE/Framework/CoreComponents/
```

### Import Components

```jsx
// Import all components
import {
  Button,
  Input,
  Select,
  Modal,
  // ... and more
} from './CoreComponents';

// Or import specific components
import { Button, Input } from './CoreComponents';
```

---

## Documentation

- **[COMPONENTS_DOCS.md](./COMPONENTS_DOCS.md)** - Complete props documentation
- **[STORYBOOK_EXAMPLES.md](./STORYBOOK_EXAMPLES.md)** - Visual examples with copy-paste code

---

## Component Examples

### Quick Examples

```jsx
// StatCard
<StatCard 
  icon={DollarSign} 
  value="$4,521" 
  label="Revenue" 
  trend="up" 
  trendValue={12.5} 
/>

// Button
<Button variant="primary" leftIcon={<Plus />}>
  Create New
</Button>

// Input with Error
<Input
  label="Email"
  state="error"
  errorMessage="Invalid email address"
/>

// Status Badge
<StatusBadge status="active" />
<RoleBadge role="admin" />

// Modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="New Appointment"
>
  <ModalBody>
    <Input label="Client Name" />
  </ModalBody>
  <ModalFooter>
    <Button variant="primary">Save</Button>
  </ModalFooter>
</Modal>

// Toast Notification
<Toast
  variant="success"
  title="Success!"
  message="Changes saved successfully."
/>

// Empty State
<EmptyState
  title="No data yet"
  actionText="Create First"
  onAction={handleCreate}
/>
```

---

## Design System Colors

### Primary
- `amber-500` - Primary actions, accents

### Status
- `emerald-500` - Success, confirmed
- `amber-500` - Warning, pending
- `red-500` - Error, cancelled
- `blue-500` - Info, in-progress

### Backgrounds
- `slate-900` - Page background
- `slate-800/50` - Card background
- `slate-800/30` - Light backgrounds

### Text
- `white` - Primary text
- `gray-400` - Secondary text
- `gray-500` - Tertiary text
- `gray-600` - Disabled/decorative

---

## Accessibility

All components follow WCAG 2.1 Level AA standards:

- ✅ Color contrast (4.5:1 minimum)
- ✅ Keyboard navigation
- ✅ ARIA labels and roles
- ✅ Focus indicators
- ✅ Screen reader support
- ✅ Reduced motion support

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Contributing

When adding new components:

1. Follow the existing component structure
2. Include proper TypeScript/Props documentation
3. Add accessibility features
4. Support all states (hover, active, disabled, loading, error)
5. Include variants where applicable
6. Add examples to STORYBOOK_EXAMPLES.md
7. Document props in COMPONENTS_DOCS.md
8. Export from index.js

---

## License

BarberZap Admin Panel - Internal Use

---

**Built for Barbers** 💈  
Components that "just work" - intuitive, responsive, visually consistent.
