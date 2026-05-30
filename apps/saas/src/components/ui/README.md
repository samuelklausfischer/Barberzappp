# UI Components

Reusable UI component library for BarberZap Admin Panel.

## Available Components

### Button
Primary interactive element with multiple variants.

```tsx
import { Button } from '@/components/ui';

< variant="primary">Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="danger">Excluir</Button>
<Button variant="ghost" iconOnly tooltip="Edit">
  <span className="material-symbols-outlined">edit</span>
</Button>
<Button loading>Processando...</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'success'
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'
- `shape`: 'square' | 'rounded' | 'circle' | 'pill'
- `leftIcon`: string | React.ReactNode
- `rightIcon`: string | React.ReactNode
- `iconOnly`: boolean
- `loading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean
- `tooltip`: string

### Badge
Status indicator with semantic colors.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Confirmado</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="danger">Cancelado</Badge>
<Badge variant="gold">Popular</Badge>
```

**Props:**
- `variant`: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'
- `size`: 'sm' | 'md' | 'lg'
- `shape`: 'square' | 'rounded' | 'pill'
- `lowercase`: boolean

## Design Tokens

### Colors
- **Primary (Gold)**: `#f4c025`
- **Secondary (White)**: `white` with opacity
- **Danger (Red)**: `red-600`
- **Success (Green)**: `green-600`
- **Warning (Yellow)**: `yellow-500`
- **Info (Blue)**: `blue-500`
- **Backgrounds**: Zinc scale (900, 950)

### Sizes
- **Extra Small**: `8px` spacing, `2rem` height
- **Small**: `10px` spacing, `2.5rem` height
- **Medium** (default): `12px` spacing, `3rem` height
- **Large**: `14px` spacing, `3.5rem` height
- **Extra Large**: `16px` spacing, `4rem` height

### Corner Radius
- **Square**: `8px` (`rounded-lg`)
- **Rounded** (default): `12px` (`rounded-xl`)
- **Circle/Pill**: `9999px` (`rounded-full`)

## Contributing

When adding new components:

1. Create component file in this directory
2. Export from `index.ts`
3. Add props TypeScript interface
4. Include JSDoc comment with examples
5. Ensure accessibility (ARIA, keyboard)
6. Follow existing Tailwind patterns

## Component Checklist

- [ ] TypeScript types defined
- [ ] Default props documented
- [ ] Multiple variants supported
- [ ] Loading state (if applicable)
- [ ] Disabled state
- [ ] Accessibility (ARIA labels, keyboard)
- [ ] Focus indicators
- [ ] Hover/active states
- [ ] Responsive (if needed)
- [ ] Examples in JSDoc
