# Advanced Themes System for BarberZap

Complete theming solution with dark mode support, 6+ professional presets, custom shop themes, and WCAG 2.1 accessibility compliance.

## 📁 Project Structure

```
barber/
├── database/
│   └── 20_shop_themes.sql          # Database migration
├── src/
│   ├── themes/
│   │   ├── ThemeProvider.tsx       # Main theme provider with context
│   │   ├── themeTypes.ts           # TypeScript type definitions
│   │   ├── themed-component-passthrough.ts  # Themed component utilities
│   │   └── presets/
│   │       ├── index.ts            # Preset registry
│   │       ├── defaultLight.ts     # Light theme
│   │       ├── defaultDark.ts      # Dark theme
│   │       ├── amberBlue.ts        # Amber & Blue
│   │       ├── midnightTeal.ts     # Midnight Teal
│   │       ├── roseGold.ts         # Rose Gold
│   │       ├── oceanBlue.ts        # Ocean Blue
│   │       └── highContrast.ts     # High Contrast (accessibility)
│   ├── hooks/
│   │   ├── useThemeSelector.ts     # Theme selection hook
│   │   └── useContrastChecker.ts   # WCAG contrast checker
│   └── components/
│       ├── ThemeSelector.tsx       # Theme selection UI
│       └── Customizer.tsx          # Live theme customizer
└── backend/
    └── themes/
        └── themes_api.py           # Python API endpoints
```

## 🚀 Quick Start

### 1. Database Setup

```bash
# Run the migration
psql -U barber_user -d barber_db -f database/20_shop_themes.sql
```

### 2. Install Theme Provider

Wrap your app with `ThemeProvider`:

```tsx
// App.tsx
import { ThemeProvider } from './themes/ThemeProvider';

export default function App({ shopId }) {
  return (
    <ThemeProvider shopId={shopId} defaultTheme="theme-default-light">
      <YourApp />
    </ThemeProvider>
  );
}
```

### 3. Use Theme in Components

```tsx
import { useTheme } from './themes/ThemeProvider';

function MyComponent() {
  const { theme, toggleDarkMode } = useTheme();
  
  return (
    <div style={{ backgroundColor: theme.colors.background }}>
      <h1 style={{ color: theme.colors.text }}>Hello!</h1>
      <button onClick={toggleDarkMode}>Toggle Theme</button>
    </div>
  );
}
```

## 📦 Available Presets

| Preset | Category | Description | Emoji |
|--------|----------|-------------|-------|
| Default Light | Light | Clean minimalist | 🌟 |
| Default Dark | Dark | Elegant night mode | 🌙 |
| Amber & Blue | Light | Professional | ✂️ |
| Midnight Teal | Dark | Classic barbershop | 🎩 |
| Rose Gold | Light | Modern luxury | 🌸 |
| Ocean Blue | Light | Fresh coastal | 🌊 |
| High Contrast | Accessibility | Maximum readability | ♿ |

## 🎨 Using Themed Components

### Styled Components

```tsx
import { themed } from './themes/themed-component-passthrough';

function Example() {
  return (
    <div>
      <themed.Button variant="primary" onClick={handleClick}>
        Save
      </themed.Button>
      
      <themed.Card variant="elevated">
        <themed.Text variant="h2">Card Title</themed.Text>
        <themed.Text>Card content here</themed.Text>
      </themed.Card>
      
      <themed.Input label="Email" />
      
      <themed.Link href="/about">Learn more</themed.Link>
    </div>
  );
}
```

### Style Helpers

```tsx
import { getThemedStyles, useThemedColor } from './themes/themed-component-passthrough';

function CustomComponent() {
  const { theme } = useTheme();
  const primaryColor = useThemedColor('primary');
  const styles = getThemedStyles(theme, 'button', 'primary');
  
  return <button style={styles}>Click me</button>;
}
```

## 🎛️ ThemeSelector Component

Add a theme selector to your settings:

```tsx
import { ThemeSelector } from './components/ThemeSelector';

function SettingsPage({ shopId }) {
  const handleThemeChange = (theme) => {
    console.log('Theme changed:', theme.name);
  };
  
  return (
    <ThemeSelector
      shopId={shopId}
      onThemeChange={handleThemeChange}
      enableCustomization={true}
      showPreview={true}
      onClose={() => setShowSelector(false)}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `shopId` | `string` | - | Shop ID for custom themes |
| `onClose` | `function` | - | Called when closing |
| `showPreview` | `boolean` | `true` | Show preview tab |
| `enableCustomization` | `boolean` | `true` | Enable custom tab |
| `onThemeChange` | `function` | - | Called on theme change |

## 🖌️ Customizer Component

For advanced theme editing:

```tsx
import { Customizer } from './components/Customizer';

function ThemeEditor({ shopId }) {
  const handleSave = async (theme) => {
    await fetch(`/api/themes/shop/${shopId}`, {
      method: 'PUT',
      body: JSON.stringify(theme),
    });
  };
  
  return (
    <Customizer
      shopId={shopId}
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}
```

## 🔌 Backend API

### Endpoints

#### Get All Presets
```http
GET /api/themes
```

Response:
```json
{
  "presets": [
    {
      "id": "preset-default-light",
      "presetKey": "defaultLight",
      "name": "Default Light",
      "description": "Clean and minimalist light theme",
      "colors": { ... },
      "fonts": { ... },
      "category": "light"
    }
  ]
}
```

#### Get Shop Theme
```http
GET /api/themes/shop/{shop_id}
```

#### Save Shop Theme
```http
PUT /api/themes/shop/{shop_id}
Content-Type: application/json

{
  "themeName": "My Theme",
  "colors": {
    "primary": "#ff0000",
    "background": "#ffffff",
    ...
  },
  "fonts": {
    "heading": "Arial, sans-serif",
    "body": "Arial, sans-serif",
    "mono": "Courier New, monospace"
  },
  "borderRadius": "0.5rem",
  "spacing": "1rem",
  "accentEmoji": "✨"
}
```

#### Upload Logo
```http
POST /api/themes/shop/{shop_id}/logo
Content-Type: multipart/form-data

file: [binary]
```

#### Upload Favicon
```http
POST /api/themes/shop/{shop_id}/favicon
Content-Type: multipart/form-data

file: [binary]
```

#### Delete Theme (Reset)
```http
DELETE /api/themes/shop/{shop_id}
```

#### Preview Theme
```http
POST /api/themes/preview
Content-Type: application/json

{
  "colors": {
    "primary": "#ff0000",
    "text": "#ffffff",
    "background": "#000000"
  }
}
```

Response:
```json
{
  "isValid": true,
  "errors": [],
  "warnings": []
}
```

## ♿ Accessibility

The system includes WCAG 2.1 compliance checking:

```tsx
import { useContrastChecker } from './hooks/useContrastChecker';

function ContrastChecker() {
  const { checkContrastRatio, suggestColor } = useContrastChecker();
  
  const result = checkContrastRatio('#ffffff', '#ff0000');
  console.log(result);
  // { ratio: 3.99, passesAA: false, passesAAA: false, level: 'fail' }
  
  const betterColor = suggestColor('#ffffff', '#ff0000');
  console.log(betterColor); // Suggested color for better contrast
}
```

### Using in Customizer

The `Customizer` component automatically checks contrast as you edit colors and shows warnings.

## 🎯 Theme Types

### ColorScale (24 colors)

Each theme includes 24 colors:

- **Primary shades**: primary, primaryLight, primaryDark
- **Secondary shades**: secondary, secondaryLight, secondaryDark
- **Backgrounds**: background, backgroundAlt
- **Surfaces**: surface, surfaceAlt
- **Text**: text, textSecondary, textMuted
- **Borders**: border, borderLight
- **Success**: success, successLight
- **Warning**: warning, warningLight
- **Error**: error, errorLight
- **Info**: info, infoLight

### Fonts

```typescript
{
  heading: string;  // H1-H6
  body: string;     // Paragraphs, spans
  mono: string;     // Code, data
}
```

### UI Tokens

```typescript
{
  borderRadius: string;  // e.g., "0.5rem"
  spacing: string;       // e.g., "1rem"
}
```

## 💾 Persistence

### LocalStorage
- Theme selection: `barberzap_theme`
- Dark mode: `barberzap_theme_mode`
- Shop custom themes: `barberzap_custom_theme_{shopId}`

### Database
```sql
-- Custom themes per shop
SELECT * FROM shop_themes WHERE shop_id = 'xxx';

-- Available presets
SELECT * FROM theme_presets ORDER BY sort_order;
```

## 🔧 Configuration

### Environment Variables

```env
# Optional: Custom asset URLs
THEME_ASSETS_URL=https://cdn.example.com/themes/
THEME_UPLOAD_DIR=/uploads/themes
```

### Custom Fonts

Add custom fonts in your CSS or head:

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap" rel="stylesheet">
```

Then use in theme:

```typescript
fonts: {
  heading: '"Playfair Display", serif',
  body: 'Inter, sans-serif',
  mono: 'Fira Code, monospace',
}
```

## 🐛 Troubleshooting

### Theme not applying
```tsx
// Ensure ThemeProvider wraps your app
<ThemeProvider shopId={shopId}>
  <App />
</ThemeProvider>
```

### Styling conflicts
```css
/* Ensure theme variables are loaded */
:root {
  --color-primary: #3b82f6;
  --font-body: Inter, sans-serif;
  --border-radius: 0.5rem;
}
```

### Persistence issues
```typescript
// Check localStorage keys
const themeId = localStorage.getItem('barberzap_theme');
const mode = localStorage.getItem('barberzap_theme_mode');
```

## 📊 Statistics & Analytics

Track theme usage:

```sql
-- Most popular themes
SELECT 
  preset_key as theme,
  COUNT(*) as usage
FROM shop_themes
GROUP BY preset_key
ORDER BY usage DESC;

-- Custom vs preset themes
SELECT 
  CASE 
    WHEN theme_name LIKE 'Custom%' THEN 'custom'
    ELSE 'preset'
  END as type,
  COUNT(*)
FROM shop_themes
GROUP BY type;
```

## 🧪 Testing

```typescript
import { renderHook } from '@testing-library/react';
import { useTheme } from '../ThemeProvider';

test('theme updates on toggle', () => {
  const { result, rerender } = renderHook(() => useTheme());
  
  expect(result.current.isDark).toBe(false);
  
  act(() => {
    result.current.toggleDarkMode();
  });
  
  expect(result.current.isDark).toBe(true);
});
```

## 🚀 Deployment

### Production Checklist

- [ ] Run database migration
- [ ] Configure upload directory permissions
- [ ] Set CDN URL for themes
- [ ] Enable caching for theme endpoints
- [ ] Test WCAG compliance
- [ ] Verify logo/favicon uploads

## 📝 Example Use Cases

### 1. Shop-specific branding
```tsx
<ThemeProvider shopId={currentUser.shopId}>
  <ShopDashboard />
</ThemeProvider>
```

### 2. User preference
```tsx
const { setDarkMode } = useTheme();
useEffect(() => {
  setDarkMode(user.preferences.darkMode);
}, [user.preferences]);
```

### 3. Dynamic theming
```tsx
// Seasonal themes
const seasonalThemes = {
  summer: 'ocean-blue',
  autumn: 'amber-blue',
  winter: 'midnight-teal',
  spring: 'rose-gold',
};

<ThemeProvider defaultTheme={seasonalThemes[season]}>
  <App />
</ThemeProvider>
```

## 🤝 Contributing

When adding new themes:

1. Create preset file in `src/themes/presets/`
2. Export from `index.ts`
3. Add to database migration
4. Update documentation
5. Test WCAG compliance

## 📄 License

MIT License - see project LICENSE file

---

**Built with ❤️ for BarberZap**
