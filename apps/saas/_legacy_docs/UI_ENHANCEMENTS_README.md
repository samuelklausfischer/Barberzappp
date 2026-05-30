# BarberZap UI Enhancements

Este documento apresenta os componentes e melhorias de UI implementados para o BarberZap.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Componentes](#componentes)
  - [AnimatedCard](#animatedcard)
  - [PageTransition](#pagetransition)
  - [LoadingSkeleton](#loadingskeleton)
  - [ThemeProvider](#themeprovider)
  - [ButtonAnimated](#buttonanimated)
  - [Tooltip](#tooltip)
  - [DashboardEnhanced](#dashboardenhanced)
- [Tema e Configuração](#tema-e-configuração)
- [Exemplos de Uso](#exemplos-de-uso)
- [Melhorias Implementadas](#melhorias-implementadas)

---

## 🎨 Visão Geral

As melhorias de UI foram projetadas para criar uma interface moderna, atraente e com animações suaves, melhorando a experiência do usuário na aplicação BarberZap.

### Características Principais

- ✨ Gradientes sutis em backgrounds e cards
- 🎭 Animações suaves com CSS transitions
- 🌓 Tema Dark/Light com persistência
- 🔄 Loading states com skeleton screens
- 🃏 Cards com hover effects (lift, glow)
- 🔘 Botões com micro-interações
- 💡 Tooltips informativos
- 📱 Accessibility (reduced motion support)

---

## 🧩 Componentes

### AnimatedCard

Componente de card com animações de hover, fade-in no mount e suporte a múltiplas variantes visuais.

#### Variantes

- `default` - Card padrão com borda sutil
- `gold` - Card com gradiente dourado
- `gradient` - Card com gradiente de fundo

#### Props

```typescript
interface AnimatedCardProps {
  variant?: 'default' | 'gold' | 'gradient';
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glow?: boolean;
  onClick?: () => void;
  delay?: number;
  reducedMotion?: boolean;
}
```

#### Exemplo

```tsx
import { AnimatedCard } from '@/components/ui/AnimatedCard';

<AnimatedCard variant="gold" glow>
  <h3>Título</h3>
  <p>Conteúdo do card</p>
</AnimatedCard>

<AnimatedCard 
  variant="default" 
  hoverable
  onClick={handleClick}
  delay={200}
>
  <div>Card interativo</div>
</AnimatedCard>
```

---

### PageTransition

Wrapper component que fornece animações de fade-in com slide-up para o conteúdo da página. Suporta staggered animations para múltiplos children.

#### Props

```typescript
interface PageTransitionProps {
  children: React.ReactNode;
  duration?: number;        // default: 0.4
  staggerDelay?: number;    // default: 100 (ms)
  slideDistance?: number;   // default: 20 (px)
  stagger?: boolean;        // default: true
  reducedMotion?: boolean;
  className?: string;
}
```

#### Exemplo

```tsx
import { PageTransition } from '@/components/ui/PageTransition';

// Animação em cascata
<PageTransition stagger>
  <div>Priemiro elemento</div>
  <div>Segundo (100ms depois)</div>
  <div>Terceiro (200ms depois)</div>
</PageTransition>

// Animação única
<PageTransition stagger={false}>
  <div>Tudo junto</div>
</PageTransition>
```

#### Hook usePageTransition

```tsx
import { usePageTransition } from '@/components/ui/PageTransition';

function MyComponent() {
  const { isTransitioning, isVisible, startTransition } = usePageTransition({
    duration: 0.6,
  });

  const handleNavigate = () => {
    startTransition(() => {
      // Navegação ou troca de conteúdo
    });
  };
}
```

---

### LoadingSkeleton

Componente de skeleton loading com shimmer effect para representar conteúdo carregando.

#### Variantes

- `text` - Linhas de texto
- `circular` - Avatares redondos
- `rectangular` - Imagens retangulares
- `rounded` - Cards arredondados

#### Props

```typescript
interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string;
  height?: string;
  lines?: number;
  animationDuration?: number;
  reducedMotion?: boolean;
  className?: string;
  darkMode?: boolean;
}
```

#### Exemplo

```tsx
import { LoadingSkeleton, SkeletonCard, SkeletonAvatar } from '@/components/ui/LoadingSkeleton';

// Skeleton básico
<LoadingSkeleton variant="text" width="80%" />
<LoadingSkeleton variant="circular" width="40px" height="40px" />

// Múltiplas linhas
<LoadingSkeleton variant="text" lines={3} />

// Presets
<SkeletonCard />
<SkeletonAvatar size={48} />
```

---

### ThemeProvider

Provider de tema com suporte a dark/light mode, toggle button e persistência no localStorage.

#### Props

```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: 'dark' | 'light';  // default: 'dark'
  storageKey?: string;
  transitionDuration?: number;     // default: 300ms
}
```

#### Hook useTheme

```typescript
interface ThemeContextType {
  mode: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (mode: 'dark' | 'light') => void;
  isDark: boolean;
}
```

#### Exemplo de Uso

```tsx
import { ThemeProvider, useTheme, ThemeToggle } from '@/themes/ThemeProviderSimple';

// No main.tsx ou App.tsx
<ThemeProvider defaultMode="dark">
  <App />
</ThemeProvider>

// Em qualquer componente
function MyComponent() {
  const { mode, toggleTheme, isDark } = useTheme();

  return (
    <div>
      <p>Modo atual: {mode}</p>
      <button onClick={toggleTheme}>Alternar Tema</button>
      <ThemeToggle size="md" />
    </div>
  );
}
```

#### Componente ThemeToggle

```tsx
<ThemeToggle size="sm" />   {/* 32x32 */}
<ThemeToggle size="md" />   {/* 40x40 - default */}
<ThemeToggle size="lg" />   {/* 48x48 */}

<ThemeToggle 
  size="md"
  className="border-2"
  ariaLabel="Mudar tema"
/>
```

---

### ButtonAnimated

Botão com animações de click, ripple effect, loading spinner e estados de sucesso/erro.

#### Variantes

- `primary` - Botão principal (dourado)
- `secondary` - Botão secundário (border)
- `danger` - Botão de perigo (vermelho)
- `success` - Botão de sucesso (verde)
- `ghost` - Botão fantasma (transparente)

#### Tamanhos

- `xs`, `sm`, `md`, `lg`, `xl`

#### Props

```typescript
interface ButtonAnimatedProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  ripple?: boolean;
  transitionDuration?: number;
  icon?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
```

#### Exemplo

```tsx
import { ButtonAnimated } from '@/components/ui/ButtonAnimated';

// Botão básico
<ButtonAnimated onClick={handleClick}>
  Clique Aqui
</ButtonAnimated>

// Com loading
<ButtonAnimated loading>
  Processando...
</ButtonAnimated>

// Estados de sucesso/erro
<ButtonAnimated success={wasSuccessful} error={hasError}>
  {wasSuccessful ? 'Sucesso!' : 'Tentar novamente'}
</ButtonAnimated>

// Com ícone
<ButtonAnimated variant="secondary" icon="add">
  Novo Item
</ButtonAnimated>

// Variantes
<ButtonAnimated variant="danger" icon="delete">
  Excluir
</ButtonAnimated>

<ButtonAnimated variant="success" icon="check">
  Confirmar
</ButtonAnimated>
```

---

### Tooltip

Tooltip com hover trigger, animações fade in/out e dark mode support.

#### Props

```typescript
interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;           // default: 200ms
  hideDelay?: number;       // default: 100ms
  maxWidth?: string;        // default: '200px'
  className?: string;
  showArrow?: boolean;
  darkMode?: boolean;
  children: React.ReactElement;
}
```

#### Exemplo

```tsx
import { Tooltip, InfoTooltip, HelpTooltip } from '@/components/ui/Tooltip';

// Tooltip básico
<Tooltip content="Este é um tooltip">
  <button>Hover me</button>
</Tooltip>

// Posicionamento
<Tooltip content="Posicionado à direita" position="right">
  <span>Hover me</span>
</Tooltip>

// Tooltip longo
<Tooltip 
  content="Texto longo com descrição detalhada" 
  maxWidth="300px"
  delay={500}
>
  <span>Mais informações</span>
</Tooltip>

// Presets
<InfoTooltip content="Informação adicional" />
<HelpTooltip content="Precisa de ajuda?" />
```

---

### DashboardEnhanced

Dashboard aprimorado com animações, loading skeletons e hover effects.

#### Props

```typescript
interface DashboardEnhancedProps {
  appointments: Appointment[];
  onNavigate: (view: AppView) => void;
}
```

#### Exemplo

```tsx
import { DashboardEnhanced } from '@/components/dashboard/DashboardEnhanced';

<DashboardEnhanced 
  appointments={appointments}
  onNavigate={(view) => setView(view)}
/>
```

#### Características

- ✅ Loading skeleton antes de carregar dados
- ✅ Fade-in em stats cards
- ✅ Stagger animation para "Ações Rápidas"
- ✅ Scroll reveal animation para lista
- ✅ Hover effects em todos cards
- ✅ Transições suaves entre elementos

---

## 🎨 Tema e Configuração

### themeConfig.ts

Configuração centralizada de temas, incluindo:

- **Color Palettes**: Primária (dourado), secundária, sucesso, warning, erro
- **Backgrounds**: Dark mode, light mode, card, overlay
- **Gradients**: Background, card, button, overlay
- **Spacing Scale**: xs, sm, md, lg, xl, 2xl, etc.
- **Border Radius**: sm, md, lg, xl, 2xl, 3xl, full
- **Custom Shadows**: sm, md, lg, xl, 2xl, inner, glow, colored
- **Typography**: Font family, sizes, weights
- **Animations**: Durações e easings

#### Uso

```typescript
import { 
  colorPalettes, 
  backgroundColors, 
  gradients,
  spacingScale,
  borderRadius,
  shadows,
  typography,
  animations,
  tailwindConfig,
  defaultTheme 
} from '@/themes/themeConfig';

// Acessar cores
const primaryColor = colorPalettes.primary.DEFAULT;
const darkBg = backgroundColors.dark.primary;

// Acessar gradientes
const goldGradient = gradients.card.gold;

// Acessar espaçamentos
const lgSpacing = spacingScale.lg;
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Card Animado com Conteúdo

```tsx
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { ButtonAnimated } from '@/components/ui/ButtonAnimated';
import { Tooltip } from '@/components/ui/Tooltip';

<AnimatedCard variant="gold" glow hoverable>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-bold">Título do Card</h3>
    <Tooltip content="Mais informações">
      <span className="material-symbols-outlined text-zinc-400">
        info
      </span>
    </Tooltip>
  </div>
  <p className="text-zinc-400 mb-4">
    Descrição do conteúdo do card com informações relevantes
  </p>
  <ButtonAnimated size="sm" fullWidth>
    Ação
  </ButtonAnimated>
</AnimatedCard>
```

### Exemplo 2: Lista com Page Transition

```tsx
import { PageTransition } from '@/components/ui/PageTransition';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

function MyList({ items, loading }) {
  if (loading) {
    return <LoadingSkeleton variant="rounded" height="300px" />;
  }

  return (
    <PageTransition stagger staggerDelay={150}>
      {items.map((item, index) => (
        <div key={item.id} className="p-4 mb-2 bg-zinc-900 rounded-xl">
          {item.name}
        </div>
      ))}
    </PageTransition>
  );
}
```

### Exemplo 3: Dashboard Completo

```tsx
import { PageTransition } from '@/components/ui/PageTransition';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { ButtonAnimated } from '@/components/ui/ButtonAnimated';
import { useTheme } from '@/themes/ThemeProviderSimple';

function Dashboard() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <PageTransition>
      {/* Header com toggle de tema */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={toggleTheme}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <AnimatedCard variant="gold">
          <div className="text-3xl font-bold">42</div>
          <div className="text-zinc-400">Agendamentos</div>
        </AnimatedCard>
        <AnimatedCard variant="default">
          <div className="text-3xl font-bold">R$ 1.500</div>
          <div className="text-zinc-400">Faturamento</div>
        </AnimatedCard>
        <AnimatedCard variant="default">
          <div className="text-3xl font-bold">156</div>
          <div className="text-zinc-400">Clientes</div>
        </AnimatedCard>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-4 gap-4">
        <ButtonAnimated icon="add">Novo</ButtonAnimated>
        <ButtonAnimated variant="secondary">Cancelar</ButtonAnimated>
        <ButtonAnimated variant="success">Salvar</ButtonAnimated>
        <ButtonAnimated variant="danger">Excluir</ButtonAnimated>
      </div>
    </PageTransition>
  );
}
```

---

## ✨ Melhorias Implementadas

### App.tsx

✅ **Background com gradiente**
- Gradiente: zinc-950 → zinc-900 → black
- Pattern overlay (grid) com opacidade 0.02

✅ **Transições suaves**
- Hover no avatar com border color change
- Hover no botão de notificações
- Backdrop blur no header

### AnimatedCard.tsx

✅ **Hover lift animation**
- `hover:-translate-y-1` com transition

✅ **Glow effects**
- `hover:shadow-xl` para default
- `hover:shadow-2xl` com glow dourado para gold variant
- Shadow effects customizados

✅ **Fade-in on mount**
- Animação de entrada com delay configurável
- `opacity-0` → `opacity-100` com slide-up

✅ **Variant support**
- `default`, `gold`, `gradient`

✅ **Shine effect no hover**
- Gradient que se move lateralmente

### PageTransition.tsx

✅ **Fade-in com slide-up**
- `opacity` e `translateY` animations
- Cubic-bezier easing suave

✅ **Stagger animation**
- Children animam em sequência
- Delay configurável

✅ **Configurable duration**
- Default 0.4s, customizável

✅ **Reduced motion support**
- Respeita `(prefers-reduced-motion: reduce)`

### LoadingSkeleton.tsx

✅ **Shimmer effect**
- Animação de shimmer com gradient

✅ **Multiple variants**
- text, circular, rectangular, rounded

✅ **Dark/Light mode support**
- Detecta automaticamente ou override

✅ **Pulse animation**
- Fade in/out effect

✅ **Preset components**
- `SkeletonCard`, `SkeletonAvatar`, `SkeletonText`, `SkeletonButton`

### ThemeProvider.tsx

✅ **Dark/Light mode**
- Toggle com `toggleTheme()`
- Set manual com `setTheme(mode)`

✅ **localStorage persistence**
- Chave customizável
- Persiste entre sessões

✅ **Tailwind dark mode**
- Baseado em classes (`dark`, `light`)
- `data-theme` attribute

✅ **Transition suave**
- 300ms default
- Configurável via props

✅ **ThemeToggle component**
- Botão pronto para uso
- Ícones de sol/lua
- 3 tamanhos (sm, md, lg)

### themeConfig.ts

✅ **Colors**
- Primary (dourado), secondary, success, warning, error
- Toda paleta de 50-950

✅ **Spacing scale**
- Escala consistente de espaçamentos

✅ **Border radius**
- sm, md, lg, xl, 2xl, 3xl, full

✅ **Custom shadows**
- sm, md, lg, xl, 2xl, inner
- Glow effects (primary, gold, error, success)
- Colored shadows

✅ **Typography**
- Font family (Manrope)
- Scale de font sizes
- Font weights

✅ **Animations**
- Durações: fast, base, slow, slower
- Easings: default, in, out, bounce

### DashboardEnhanced.tsx

✅ **Fade-in em stats cards**
- PageTransition wrapper

✅ **Stagger animation**
- "Ações Rápidas" anima em sequência

✅ **Scroll reveal**
- Lista de agendamentos com delay

✅ **Loading skeletons**
- Antes de dados carregarem

✅ **Hover effects**
- Todos cards com lift e glow
- Avatar com border hover
- Text com color hover

### ButtonAnimated.tsx

✅ **Tap/scale on click**
- `active:scale-95`

✅ **Ripple effect**
- Ping animation no click
- Configurável

✅ **Loading spinner**
- Ícone de refresh animado
- Desabilita botão

✅ **Success/Error states**
- Checkmark/X com animação
- Ícones configuráveis

✅ **Smooth transitions**
- 200ms default, configurável
- Cubic-bezier easing

✅ **Multiple variants**
- primary, secondary, danger, success, ghost
- 5 tamanhos (xs, sm, md, lg, xl)

### Tooltip.tsx

✅ **Hover trigger**
- `onMouseEnter/Leave`

✅ **Fade in/out animation**
- 200ms transition
- Opacity control

✅ **Dark mode support**
- Detecta automaticamente
- Override disponível

✅ **Configurable position**
- top, bottom, left, right

✅ **Delay config**
- Delay show: 200ms (default)
- Hide delay: 100ms (default)

✅ **Arrow indicator**
- Configurável
- Posiciona automaticamente

---

## 🔧 Integração existente

### Usando DashboardEnhanced no lugar de Dashboard

No arquivo `/root/barber/src/app/App.tsx`:

```tsx
import DashboardEnhanced from '@/components/dashboard/DashboardEnhanced';

// Substituir:
// {view === 'dashboard' && <Dashboard appointments={appointments} onNavigate={setView} />}

// Por:
{view === 'dashboard' && <DashboardEnhanced appointments={appointments} onNavigate={setView} />}
```

### Adicionando ThemeProvider

No arquivo `/root/barber/src/app/main.tsx`:

```tsx
import { ThemeProvider } from '@/themes/ThemeProviderSimple';
import App from './App';

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultMode="dark">
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

---

## 📦 Exportações

Cada componente tem exports nomeados e default:

```typescript
// Named exports (preferidos)
import { 
  AnimatedCard, 
  PageTransition, 
  LoadingSkeleton,
  Tooltip,
  InfoTooltip,
  HelpTooltip 
} from '@/components/ui/AnimatedCard';  // etc.

// Default exports (disponíveis)
import AnimatedCard from '@/components/ui/AnimatedCard';
import PageTransition from '@/components/ui/PageTransition';
// etc.
```

---

## 🎯 Próximos Passos

1. ✅ Todos os componentes criados
2. ✅ App.tsx atualizado com gradientes
3. ✅ Theme provider implementado
4. ⏳ Integrar ThemeProvider no main.tsx
5. ⏳ Substituir Dashboard por DashboardEnhanced
6. ⏳ Adicionar ThemeToggle no Header
7. ⏳ Atualizar outros components com AnimatedCard

---

## 🐛 Troubleshooting

### Theme toggle não funciona

Verifique se:
- `ThemeProvider` está envolvendo a aplicação
- Tailwind está configurado com `darkMode: 'class'`

### Animações não aparecem

Verifique se:
- Browser não está em reduced motion
- `reducedMotion` prop está `false`
- CSS transitions não estão sendo sobrescritos

### Skeletons não combinam com tema

Verifique se:
- `darkMode` prop está correta
- Tailwind colors estão disponíveis

---

## 📞 Suporte

Para questões ou melhorias, consulte o repositório ou abra uma issue.

---

**Versão**: 1.0.0  
**Data**: 2026-03-05  
**Status**: ✅ Implementado e pronto para uso
