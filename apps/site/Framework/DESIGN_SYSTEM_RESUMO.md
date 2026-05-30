# BarberZap Admin Dashboard - Design System Resumido

---

## Visão Geral

O Design System do BarberZap Admin Dashboard consiste em tokens, diretrizes e componentes visuais unificados que garantem consistência e profissionalismo em toda a interface.

## Paleta de Cores

### Cores Primárias

| Uso | Color | Hex | Tailwind |
|-----|-------|-----|----------|
| Background primário | --bg-primary | `#0f172a` | slate-900 |
| Background secundário | --bg-secondary | `#1e293b` | slate-800 |
| Background terciário | --bg-tertiary | `#334155` | slate-700 |
| Elevated card | --bg-elevated | `rgba(30, 41, 59, 0.5)` | slate-800/50 |
| Primary (accent) | --primary | `#f59e0b` | amber-500 |
| Primary hover | --primary-hover | `#fbbf24` | amber-400 |
| Primary light | --primary-light | `#fcd34d` | amber-300 |

### Cores de Texto

| Uso | Color | Hex | Tailwind |
|-----|-------|-----|----------|
| Texto primário | --text-primary | `#ffffff` | text-white |
| Texto secundário | --text-secondary | `#94a3b8` | text-gray-400 |
| Texto terciário | --text-tertiary | `#64748b` | text-gray-500 |
| Texto desabilitado | --text-disabled | `#475569` | text-gray-600 |

### Cores de Status

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Success | emerald-500/15 | emerald-400 | emerald-500 |
| warning | amber-500/15 | amber-400 | amber-500 |
| Error | red-500/15 | red-400 | red-500 |
| Info | blue-500/15 | blue-400 | blue-500 |

## Tipografia

### Fontes

- **Fonte primária**: Inter, system-ui
- **Tamanhos**: xs (0.75rem) até 3xl (1.875rem)
- **Pesos**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Hierarchy

| Elemento | Tamanho | Peso | Uso |
|----------|---------|------|-----|
| H1 (Page Title) | text-3xl (30px) | bold | Títulos de página |
| H2 (Section) | text-2xl (24px) | semibold | Seções principais |
| H3 (Card) | text-xl (20px) | semibold | Títulos de cards |
| H4 (Label) | text-lg (18px) | medium | Rótulos |
| Body | text-base (16px) | normal | Texto corpo |
| Small | text-sm (14px) | normal | Texto secundário |
| XSmall | text-xs (12px) | normal | Captions |

## Espaçamento

### 8-Point Grid System

Base: 4px (0.25rem)

| Valor | Rem | PX | Uso |
|-------|-----|-----|-----|
| space-1 | 0.25rem | 4px | Elementos muito próximos |
| space-2 | 0.5rem | 8px | Padding pequeno |
| space-3 | 0.75rem | 12px | Margin/padding |
| space-4 | 1rem | 16px | Espaçamento padrão |
| space-5 | 1.25rem | 20px | Espaçamento largo |
| space-6 | 1.5rem | 24px | Seções |
| space-8 | 2rem | 32px | Componentes grandes |
| space-10 | 2.5rem | 40px | Layout grande |
| space-12 | 3rem | 48px | Seções principais |
| space-16 | 4rem | 64px | Layout total |

## Border Radius

| Tamanho | Valor | Uso |
|---------|-------|-----|
| sm | 0.375rem (rounded-lg) | Inputs, botões pequenos |
| md | 0.5rem (rounded-xl) | Cards, inputs |
| lg | 0.75rem (rounded-2xl) | Modals, drawers |
| full | 9999px (rounded-full) | Avatares, badges pill |

## Efeitos Visuais

### Glass Morphism

```css
.glass-card {
  background: rgba(30, 41, 59, 0.5);    /* slate-800/50 */
  backdrop-filter: blur(16px);          /* backdrop-blur-xl */
  border: 1px solid rgba(51, 65, 85, 0.5); /* slate-700/50 */
  border-radius: 0.75rem;              /* rounded-xl */
}
```

### Sombras

| Nome | Valor | Uso |
|------|-------|-----|
| sm | 0 1px 2px rgba(0,0,0,0.05) | Cards pequenos |
| md | 0 4px 6px -1px rgba(0,0,0,0.1) | Cards padrão |
| lg | 0 10px 15px -3px rgba(0,0,0,0.1) | Modals |
| xl | 0 20px 25px -5px rgba(0,0,0,0.1) | Drawers |
| glow-primary | 0 0 20px rgba(245, 158, 11, 0.3) | Elementos ativos |

## Breakpoints

| Nome | Tamanho | Dispositivo |
|------|---------|-------------|
| xs | 0px | Mobile |
| sm | 640px | Tablet portrait |
| md | 768px | Tablet landscape |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |
| 2xl | 1536px | Extra large |

## Componentes Principais

### Botões

```jsx
// Primary
<button className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold">
  Ação
</button>

// Secondary
<button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium">
  Ação
</button>

// Outline
<button className="px-6 py-3 border border-slate-600 hover:border-slate-500 text-gray-300 rounded-lg">
  Ação
</button>
```

### Cards

```jsx
<div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white">Título</h3>
  <p className="text-gray-400 mt-2">Conteúdo</p>
</div>
```

### Inputs

```jsx
<input
  className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
  placeholder="Digite..."
/>
```

### Badges

```jsx
<Badge variant="success">Confirmado</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Cancelado</Badge>
```

## Animações

### Durações

- Fast: 100-150ms (hover, active)
- Normal: 200-300ms (transições)
- Slow: 400-500ms (modals, drawers)

### Easing

- Ease-out: Transições suaves
- Spring: Animações físicas
- Linear: Animações contínuas

## Acessibilidade

- Contraste mínimo: 4.5:1
- Focus visível: ring-2
- Navegação por teclado: Tab/Enter
- ARIA labels: Em todos os elementos interativos
- Reduced motion: respectado

---

**Última atualização:** 2026-02-25  
**Versão:** 1.0.0
