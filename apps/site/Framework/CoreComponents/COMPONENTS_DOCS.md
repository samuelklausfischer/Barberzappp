# BarberZap Core Components - Documentation

> **Version:** 1.0.0  
> **Total Components:** 25  
> **Last Updated:** 2026-02-25

---

## Table of Contents

- [Data Display (5 components)](#data-display)
- [Form Elements (7 components)](#form-elements)
- [Navigation & Actions (7 components)](#navigation--actions)
- [Feedback & Overlays (6 components)](#feedback--overlays)

---

## Data Display

### StatCard

Displays a metric with icon, value, label, and trend indicator.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | - | Icon component |
| `value` | `string\|number` | - | Main metric value |
| `label` | `string` | - | Label/description |
| `trend` | `'up'\|'down'\|'neutral'\|null` | `null` | Trend direction |
| `trendValue` | `number` | `0` | Trend percentage |
| `loading` | `boolean` | `false` | Show skeleton |
| `variant` | `'default'\|'compact'\|'large'` | `'default'` | Display variant |

**Variants:**
- `StatCard` - Standard stat card with elevation
- `StatCardInline` - Compact inline version

**Accessibility:** Uses `role="article"` and `aria-label`.

---

### DataTable

Sortable table with pagination for structured data.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Array` | `[]` | Column definitions |
| `data` | `Array` | `[]` | Data rows |
| `loading` | `boolean` | `false` | Loading state |
| `pagination` | `Object` | `null` | Pagination config |
| `onPageChange` | `Function` | - | Page change handler |
| `onSort` | `Function` | - | Sort handler |
| `onRowClick` | `Function` | - | Row click handler |
| `showSelection` | `boolean` | `false` | Row checkboxes |
| `onSelectionChange` | `Function` | - | Selection handler |
| `actions` | `ReactNode` | - | Actions column |

**Column Definition:**
```javascript
{
  key: string,          // Unique key
  label: string,        // Header label
  sortable: boolean,    // Enable sorting
  render: Function,     // Custom cell renderer
  width: string         // Skeleton width
}
```

**Variants:**
- `DataTable` - Full-featured table
- `DataTableCompact` - Compact variant

**Accessibility:** Full keyboard navigation, ARIA attributes, focus management.

---

### CardList

List of cards (horizontal/vertical orientation).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array` | `[]` | Card items |
| `orientation` | `'horizontal'\|'vertical'` | `'vertical'` | Layout direction |
| `divided` | `boolean` | `true` | Show dividers |
| `renderItem` | `Function` | - | Custom renderer |
| `hoverable` | `boolean` | `false` | Hover effect |
| `onItemClick` | `Function` | - | Click handler |

**Item Structure:**
```javascript
{
  id: string,
  avatar: ReactNode,
  title: string,
  subtitle: string,
  description: string,
  badge: ReactNode,
  rightAction: ReactNode
}
```

**Variants:**
- `CardList` - Base component
- `CardListHorizontal` - Horizontal scroll
- `CardListVertical` - Vertical list
- `CardListGrid` - Grid layout
- `CardItem` - Individual card wrapper

---

### Badge

Status/role badges with predefined styles.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Badge content |
| `variant` | `'success'\|'warning'\|'error'\|'info'\|'gold'\|'default'` | `'default'` | Badge variant |
| `style` | `'filled'\|'outline'\|'ghost'` | `'filled'` | Badge style |
| `size` | `'xs'\|'sm'\|'base'\|'lg'` | `'sm'` | Badge size |
| `pulsing` | `boolean` | `false` | Pulse animation |
| `roundedFull` | `boolean` | `true` | Pill shape |
| `showDot` | `boolean` | `false` | colored dot |

**Variants:**
- `Badge` - Base badge
- `StatusBadge` - Pre-configured status (active, pending, etc.)
- `RoleBadge` - User roles (admin, staff, etc.)
- `CounterBadge` - Number badge
- `BadgeOutline` - Outline style
- `BadgeGhost` - Ghost style

---

### Avatar

User avatar with initials fallback.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Image URL |
| `alt` | `string` | - | Alt text |
| `name` | `string` | - | User name for initials |
| `initials` | `string` | - | Custom initials |
| `size` | `'xs'\|'sm'\|'base'\|'lg'\|'xl'\|'2xl'` | `'base'` | Avatar size |
| `showStatus` | `boolean` | `false` | Status indicator |
| `status` | `'online'\|'offline'\|'busy'\|'away'` | `'online'` | Status type |
| `rounded` | `boolean` | `false` | Square corners |
| `clickable` | `boolean` | `false` | Click interaction |

**Variants:**
- `Avatar` - Base avatar
- `AvatarGroup` - Stacked avatars
- `AvatarWithInfo` - Avatar + name/subtitle
- `AvatarSkeleton` - Loading state

**Accessibility:** Alt text for images, fallback initials, keyboard navigation.

---

## Form Elements

### Input

Text inputs with states (default, error, success).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `type` | `'text'\|'email'\|'tel'\|'password'\|'number'\|'url'` | `'text'` | Input type |
| `state` | `'default'\|'error'\|'success'` | `'default'` | Input state |
| `errorMessage` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text |
| `required` | `boolean` | `false` | Required indicator |
| `disabled` | `boolean` | `false` | Disabled state |
| `loading` | `boolean` | `false` | Loading spinner |
| `leftIcon` | `ReactNode` | - | Left icon |
| `rightIcon` | `ReactNode` | - | Right icon |

**Related:**
- `Textarea` - Multi-line input
- `InputGroup` - Group related inputs
- `SearchInput` - Pre-styled search

**Accessibility:** ARIA labels, error states, keyboard navigation.

---

### Select

Dropdown select with search functionality.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `options` | `Array` | `[]` | Select options |
| `value` | `any` | - | Selected value |
| `onChange` | `Function` | - | Change handler |
| `searchable` | `boolean` | `false` | Enable search |
| `multiple` | `boolean` | `false` | Multi-select |
| `disabled` | `boolean` | `false` | Disabled state |
| `state` | `'default'\|'error'\|'success'` | `'default'` | Input state |

**Option Structure:**
```javascript
{
  value: any,
  label: string,
  disabled: boolean,
  icon: ReactNode
}
```

**Variants:**
- `Select` - Custom dropdown
- `NativeSelect` - Native HTML select

---

### DatePicker

Date picker with month navigation and day selection.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `value` | `Date\|string` | - | Selected date |
| `onChange` | `Function` | - | Change handler |
| `minDate` | `Date` | - | Minimum date |
| `maxDate` | `Date` | - | Maximum date |
| `showWeekNumbers` | `boolean` | `false` | Show week numbers |
| `disabled` | `boolean` | `false` | Disabled state |

**Variants:**
- `DatePicker` - Custom calendar picker
- `DateRangePicker` - Date range selection
- `NativeDatePicker` - Native date input

---

### PhoneInput

Brazilian phone format input with auto-formatting.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `value` | `string` | - | Phone value |
| `onChange` | `Function` | - | Change handler |
| `includeCountryCode` | `boolean` | `false` | Include +55 |
| `type` | `'mobile'\|'landline'\|'both'` | `'both'` | Phone type |

**Variants:**
- `PhoneInput` - Brazilian format
- `PhoneInputMask` - General mask format

---

### Toggle

On/off switch component.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Toggle state |
| `onChange` | `Function` | - | Change handler |
| `label` | `string` | - | Toggle label |
| `description` | `string` | - | Additional text |
| `variant` | `'default'\|'success'\|'danger'\|'warning'` | `'default'` | Toggle variant |
| `size` | `'sm'\|'base'\|'lg'` | `'base'` | Toggle size |
| `disabled` | `boolean` | `false` | Disabled state |

**Related:**
- `ToggleGroup` - Group related toggles
- `ToggleSwitch` - Alias
- `Switch` - Alias

---

### Checkbox / Radio

Custom styled checkbox and radio inputs.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Checked state |
| `onChange` | `Function` | - | Change handler |
| `label` | `string` | - | Label text |
| `description` | `string` | - | Description text |
| `state` | `'default'\|'error'` | `'default'` | Input state |
| `indeterminate` | `boolean` | `false` | Indeterminate state |
| `disabled` | `boolean` | `false` | Disabled state |

**Variants:**
- `Checkbox` - Base checkbox
- `CheckboxGroup` - Group of checkboxes
- `CheckboxCard` - Card-style checkbox
- `Radio` - Radio button
- `RadioGroup` - Group of radios

---

### SearchBox

Global search input with history and filters.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `'Search...'` | Placeholder text |
| `value` | `string` | `''` | Search value |
| `onChange` | `Function` | - | Change handler |
| `onSearch` | `Function` | - | Submit handler |
| `showHistory` | `boolean` | `true` | Show history |
| `history` | `Array` | `[]` | History items |
| `showFilters` | `boolean` | `false` | Show filters |
| `loading` | `boolean` | `false` | Loading state |

**Variants:**
- `SearchBox` - Full-featured search
- `CompactSearch` - Minimal search
- `SearchWithButton` - Search + button

---

## Navigation & Actions

### Button

Button with multiple variants and states.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary'\|'secondary'\|'outline'\|'ghost'\|'danger'\|'dangerFilled'` | `'primary'` | Button variant |
| `size` | `'sm'\|'base'\|'lg'` | `'base'` | Button size |
| `loading` | `boolean` | `false` | Loading state |
| `disabled` | `boolean` | `false` | Disabled state |
| `leftIcon` | `ReactNode` | - | Left icon |
| `rightIcon` | `ReactNode` | - | Right icon |
| `fullWidth` | `boolean` | `false` | Full width |

**Variants:**
- `PrimaryButton`
- `SecondaryButton`
- `OutlineButton`
- `GhostButton`
- `DangerButton`
- `DangerButtonFilled`

**Related:**
- `IconButton` - Icon-only button
- `ButtonGroup` - Grouped buttons

---

### Tabs

Tab navigation component.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `Array` | `[]` | Tab items |
| `activeTab` | `string` | - | Active tab ID |
| `onChange` | `Function` | - | Change handler |
| `variant` | `'default'\|'pills'\|'underline'` | `'default'` | Tab variant |
| `fullWidth` | `boolean` | `false` | Full width tabs |

**Tab Item:**
```javascript
{
  id: string,
  label: string,
  icon: ReactNode,
  disabled: boolean,
  badge: ReactNode
}
```

**Variants:**
- `Tabs` - Base tabs
- `TabPanel` - Content panel
- `VerticalTabs` - Side navigation

---

### Breadcrumbs

Navigation breadcrumbs showing page hierarchy.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array` | `[]` | Breadcrumb items |
| `onItemClick` | `Function` | - | Click handler |
| `size` | `'sm'\|'base'\|'lg'` | `'base'` | Breadcrumb size |
| `showHome` | `boolean` | `true` | Show home icon |

**Item Structure:**
```javascript
{
  label: string,
  href: string,
  icon: ReactNode
}
```

**Related:**
- `BreadcrumbItem` - Individual item
- `BreadcrumbSeparator` - Custom separator
- `CompactBreadcrumbs` - Compact variant

---

### Dropdown

Menu dropdown with customizable items.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `trigger` | `ReactNode` | - | Trigger element |
| `items` | `Array` | `[]` | Dropdown items |
| `position` | `'bottom-left'\|'bottom-right'\|'top-left'\|'top-right'` | `'bottom-left'` | Position |
| `closeOnClick` | `boolean` | `true` | Close on click |

**Item Structure:**
```javascript
{
  label: string,
  icon: LucideIcon,
  onClick: Function,
  disabled: boolean,
  danger: boolean,
  divider: boolean,
  header: boolean
}
```

**Related:**
- `DropdownMenu` - Alternative interface
- `DropdownItem` - Individual item
- `SelectDropdown` - Select-style dropdown
- `SplitButton` - Button + dropdown

---

### Pagination

Table pagination with page navigation.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | `1` | Current page |
| `totalPages` | `number` | `1` | Total pages |
| `totalItems` | `number` | - | Total items |
| `pageSize` | `number` | - | Items per page |
| `showFirstLast` | `boolean` | `false` | Show first/last |
| `showInfo` | `boolean` | `true` | Show item info |
| `variant` | `'default'\|'compact'\|'simple'` | `'default'` | Pagination variant |

**Variants:**
- `Pagination` - Full pagination
- `CompactPagination` - Smaller version
- `SimplePagination` - Just prev/next

---

## Feedback & Overlays

### Alert

Success/error/info alerts with dismiss functionality.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'success'\|'warning'\|'error'\|'info'` | `'info'` | Alert variant |
| `title` | `ReactNode` | - | Alert title |
| `dismissible` | `boolean` | `false` | Show dismiss |
| `size` | `'sm'\|'base'\|'lg'` | `'base'` | Alert size |
| `outline` | `boolean` | `false` | Outline style |

**Variants:**
- `SuccessAlert`
- `WarningAlert`
- `ErrorAlert`
- `InfoAlert`
- `AlertGroup` - Multiple alerts

**Accessibility:** `role="alert"`, ARIA live regions.

---

### Toast

Toast notification with auto-dismiss.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'success'\|'warning'\|'error'\|'info'\|'loading'` | `'info'` | Toast variant |
| `show` | `boolean` | `false` | Show toast |
| `duration` | `number` | `4000` | Auto-dismiss (ms) |
| `position` | `'bottom-right'\|'bottom-left'\|'top-right'...` | `'bottom-right'` | Position |

**Related:**
- `ToastContainer` - Multiple toasts
- `ToastProvider` - Context provider
- `useToast` - Hook for showing toasts

---

### LoadingSpinner

Loading indicator with various styles.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm'\|'base'\|'lg'\|'xl'` | `'base'` | Spinner size |
| `variant` | `'default'\|'dots'\|'pulse'\|'bar'` | `'default'` | Spinner variant |
| `fullScreen` | `boolean` | `false` | Full screen overlay |
| `text` | `string` | - | Loading text |

**Variants:**
- `DotsSpinner` - Bouncing dots
- `PulseSpinner` - Pulsing circle
- `BarSpinner` - Progress bar
- `InlineSpinner` - Button spinner
- `SkeletonLoader` - Content skeleton
- `PageLoader` - Full page loader

---

### EmptyState

No data placeholder with optional actions.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'no-data'\|'no-results'\|'no-connection'\|'error'\|'custom'` | `'no-data'` | Predefined type |
| `title` | `string` | - | Custom title |
| `description` | `string` | - | Custom description |
| `actionText` | `string` | - | Action button text |
| `onAction` | `Function` | - | Action handler |
| `compact` | `boolean` | `false` | Compact variant |

**Variants:**
- `NoDataEmpty`
- `NoResultsEmpty`
- `NoConnectionEmpty`
- `ErrorEmpty`
- `EmptyList`
- `EmptyPage`
- `IllustratedEmpty`

---

### Modal

Dialog modal with backdrop and accessibility.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Modal open |
| `onClose` | `Function` | - | Close handler |
| `title` | `ReactNode` | - | Modal title |
| `size` | `'sm'\|'md'\|'lg'\|'xl'\|'2xl'\|'full'` | `'md'` | Modal size |
| `closeOnBackdrop` | `boolean` | `true` | Click backdrop to close |
| `closeOnEscape` | `boolean` | `true` | ESC to close |

**Parts:**
- `ModalHeader` - Header section
- `ModalBody` - Content area
- `ModalFooter` - Actions area

**Related:**
- `ConfirmDialog` - Confirmation modal
- `DeleteConfirm` - Delete confirmation
- `AlertDialog` - Alert dialog

**Accessibility:** Focus trap, focus management, ARIA attributes, keyboard navigation.

---

## Design System Compliance

All components follow the BarberZap Design System:

- **Colors:** Use gold-500 for primary actions, success/warning/error semantic colors
- **Spacing:** 8-point grid system
- **Border Radius:** 4px-24px scale
- **Typography:** Inter font family, modular type scale
- **Shadows:** Consistent elevation levels
- **Animations:** 150ms-300ms durations

---

## Accessibility

Components built with accessibility in mind:

- **Keyboard Navigation:** Full tab support, arrow keys where applicable
- **ARIA Labels:** Proper labeling for screen readers
- **Focus States:** Visible focus indicators
- **Color Contrast:** WCAG AA compliant (4.5:1 minimum)
- **Screen Readers:** Semantic HTML and live regions
- **Reduced Motion:** Respects `prefers-reduced-motion`

---

## Theme Support

All components support dark theme by default:

- **Background:** slate-800/50 to slate-900
- **Text:** white/gray-400/gray-500 hierarchy
- **Borders:** slate-600/700 scale
- **States:** gold-500 primary, semantic colors for status

---

## Installation & Usage

```jsx
import { 
  Button, 
  Input, 
  StatCard, 
  DataTable 
} from './CoreComponents';

// Use components
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
      
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
      />
      
      <Button variant="primary">
        Submit
      </Button>
    </div>
  );
}
```

---

**End of Documentation**
