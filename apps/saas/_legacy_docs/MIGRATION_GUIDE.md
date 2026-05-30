# Migration Guide - UI Enhancements

Guia rápido para integrar as melhorias de UI no projeto BarberZap.

## 🚀 Passos para Instalação

### 1. Integração do ThemeProvider

No arquivo `/root/barber/src/app/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/error';
// ⬇️ Adicionar import
import { ThemeProvider } from '@/themes/ThemeProviderSimple';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* ⬇️ Envolver App com ThemeProvider */}
      <ThemeProvider defaultMode="dark">
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

### 2. Adicionar Theme Toggle no Header

Para adicionar um botão de alternância de tema no header:

```tsx
import { ThemeToggle } from '@/themes/ThemeProviderSimple';

// No componente Header
<Header
  shopName="Barbearia do Zé"
  userName="Zé da Silva"
  userRole="Proprietário"
  hasNotifications={true}
>
  {/* Adicionar ThemeToggle no botão de perfil */}
  <ThemeToggle size="md" className="ml-2" />
</Header>
```

### 3. Usar DashboardEnhanced (opcional)

No arquivo `/root/barber/src/app/App.tsx`:

```tsx
// Importar
import DashboardEnhanced from '@/components/dashboard/DashboardEnhanced';

// Substituir o Dashboard existente
// {view === 'dashboard' && <Dashboard appointments={appointments} onNavigate={setView} />}

// Por:
{view === 'dashboard' && <DashboardEnhanced appointments={appointments} onNavigate={setView} />}
```

### 4. Atualizar Tailwind Config (se necessário)

Se você quiser usar as variáveis de tema personalizadas no Tailwind, adicione ao `tailwind.config.js` ou `tailwind.config.ts`:

```javascript
import { tailwindConfig } from './src/themes/themeConfig';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: tailwindConfig.theme.extend,
    darkMode: 'class', // Importante!
  },
  plugins: [],
};
```

## 📝 Exemplos Práticos de Migração

### Exemplo 1: Migração de Card Simples

**Antes:**
```tsx
<div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

**Depois:**
```tsx
import { AnimatedCard } from '@/components/ui/AnimatedCard';

<AnimatedCard variant="default" hoverable>
  <h3>Card Title</h3>
  <p>Card content</p>
</AnimatedCard>
```

### Exemplo 2: Migração de Botão

**Antes:**
```tsx
<button className="px-6 py-3 bg-[#f4c025] text-black font-bold rounded-xl hover:bg-[#d9a419]">
  Click me
</button>
```

**Depois:**
```tsx
import { ButtonAnimated } from '@/components/ui/ButtonAnimated';

<ButtonAnimated variant="primary" size="md">
  Click me
</ButtonAnimated>
```

**Com loading:**
```tsx
<ButtonAnimated loading={isLoading} disabled={isLoading}>
  {isLoading ? 'Processando...' : 'Salvar'}
</ButtonAnimated>
```

### Exemplo 3: Adicionar Tooltip

**Antes:**
```tsx
<button title="This is a tooltip">Hover me</button>
```

**Depois:**
```tsx
import { Tooltip } from '@/components/ui/Tooltip';

<Tooltip content="This is a tooltip">
  <button>Hover me</button>
</Tooltip>
```

### Exemplo 4: Animação de Página

**Antes:**
```tsx
<div>
  <h1>Page Title</h1>
  <div>Content here</div>
</div>
```

**Depois:**
```tsx
import { PageTransition } from '@/components/ui/PageTransition';

<PageTransition stagger>
  <h1>Page Title</h1>
  <div>Content here</div>
</PageTransition>
```

### Exemplo 5: Loading Skeleton

**Antes:**
```tsx
<div className="animate-pulse bg-zinc-800 h-20 rounded-xl"></div>
```

**Depois:**
```tsx
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

<LoadingSkeleton variant="rounded" height="80px" />
```

## 🎨 Usar o Hook useTheme

Em qualquer componente, você pode acessar o tema:

```tsx
import { useTheme } from '@/themes/ThemeProviderSimple';

function MyComponent() {
  const { mode, isDark, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Modo atual: {mode}</p>
      <button onClick={toggleTheme}>
        Alternar para {isDark ? 'Light' : 'Dark'}
      </button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
    </div>
  );
}
```

## 🔄 Padrões de Animação

### Fade-in + Slide-up (Padrão)

```tsx
<PageTransition>
  <div>Content animates in</div>
</PageTransition>
```

### Staggered (Cascata)

```tsx
<div className="grid grid-cols-3 gap-4">
  {items.map((item, i) => (
    <AnimatedCard key={i} delay={i * 100}>
      {item.content}
    </AnimatedCard>
  ))}
</div>
```

### Or use PageTransition stagger:

```tsx
<PageTransition stagger staggerDelay={150}>
  <div>First (0ms)</div>
  <div>Second (150ms)</div>
  <div>Third (300ms)</div>
</PageTransition>
```

## 🎯 Variantes Disponíveis

### AnimatedCard Variants

- `default` - Borda sutil
- `gold` - Gradiente dourado
- `gradient` - Gradiente de background

### ButtonAnimated Variants

- `primary` - Dourado (ação principal)
- `secondary` - Border branco
- `danger` - Vermelho (excluir, cancelar)
- `success` - Verde (confirmar, salvar)
- `ghost` - Transparente (ações secundárias)

### LoadingSkeleton Variants

- `text` - Linhas de texto
- `circular` - Avatar redondo
- `rectangular` - Imagem retangular
- `rounded` - Card arredondado

## 💡 Tips e Best Practices

### 1. Loading States

Sempre use skeletons enquanto carrega dados:

```tsx
function MyComponent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <LoadingSkeleton variant="rounded" height="400px" />;
  }

  return <PageTransition>{/* content */}</PageTransition>;
}
```

### 2. Hover Effects

Use AnimatedCard com glow para elementos importantes:

```tsx
<AnimatedCard variant="gold" glow hoverable>
  {/* Call-to-action */}
</AnimatedCard>
```

### 3. Feedback Visual

Use ButtonAnimated states para feedback:

```tsx
<ButtonAnimated 
  success={operationSuccess} 
  error={operationError}
  loading={isSubmitting}
>
  {operationSuccess ? 'Salvo!' : 'Salvar'}
</ButtonAnimated>
```

### 4. Accessibility

Sempre use reducedMotion quando apropriado:

```tsx
<AnimatedCard reducedMotion={prefersReducedMotion}>
  {/* content */}
</AnimatedCard>
```

### 5. Tooltips

Use Tooltips para ícones e ações:

```tsx
<Tooltip content="Editar configurações">
  <span className="material-symbols-outlined">settings</span>
</Tooltip>
```

## 🐛 Troubleshooting

### Problema: Tema não alterna

**Solução:**
- Verifique se `ThemeProvider` envolve o App
- Certifique-se que `darkMode: 'class'` está configurado no Tailwind

### Problema: Animações não funcionam

**Solução:**
- Verifique se não está em `prefers-reduced-motion`
- Confirme que `reducedMotion` prop está `false`
- Check se há CSS conflicts

### Problema: Skeletons ficam transparentes

**Solução:**
- Verifique `darkMode` prop
- Confirme que as cores do Tailwind estão disponíveis

### Problema: Imports falham

**Solução:**
- Use import centralizado: `@/components/ui`
- Verifique se `tsconfig.json` tem o alias `@` configurado

## 📦 Checklist de Migração

- [ ] Instalar/verificar Tailwind with dark mode
- [ ] Adicionar ThemeProvider no main.tsx
- [ ] Adicionar ThemeToggle no Header (opcional)
- [ ] Substituir cards estáticos por AnimatedCard
- [ ] Adicionar PageTransition em páginas principais
- [ ] Usar LoadingSkeleton para loading states
- [ ] Substituir botões por ButtonAnimated (opcional)
- [ ] Adicionar Tooltips em ícones (opcional)
- [ ] Testar em dark e light mode
- [ ] Testar com reduced motion

---

Happy Coding! 🎉
