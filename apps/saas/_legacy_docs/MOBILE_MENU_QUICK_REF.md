# 🚀 Quick Reference - Mobile Menu Responsivo

## Arquivos Principais

```
┌─────────────────────────────────────────────────────────────┐
│ 📁 src/stores/mobileMenuStore.ts      │ Estado global (Zustand) │
├─────────────────────────────────────────────────────────────┤
│ 📁 src/components/layout/                     │
│   ├── MobileMenu.tsx                    │ Menu mobile completo   │
│   ├── Drawer.tsx                        │ Drawer genérico         │
│   ├── Backdrop.tsx                      │ Backdrop com blur       │
│   └── Header.tsx                        │ Header responsivo       │
├─────────────────────────────────────────────────────────────┤
│ 📁 src/assets/animations.css            │ Animações CSS globais   │
├─────────────────────────────────────────────────────────────┤
│ 📁 src/app/App.tsx                      │ Integração              │
└─────────────────────────────────────────────────────────────┘
```

## Instalação Rápida

```bash
npm install zustand
```

## Uso Básico

### 1. Store (Controle do Menu)
```tsx
import { useMobileMenuStore } from '@/stores/mobileMenuStore';

const { isOpen, open, close, toggle } = useMobileMenuStore();
```

### 2. No App.tsx
```tsx
import MobileMenu from '@/components/layout/MobileMenu';
import Header from '@/components/layout/Header';

<MobileMenu currentView={view} onViewChange={setView} onLogout={logout} />
<Header shopName="Minha Barbearia" userName="João" userRole="Gerente" />
```

### 3. Header Props
```tsx
<Header
  shopName="Barbearia do Zé"
  userName="Zé da Silva"
  userRole="Proprietário"
  avatarUrl="https://..."
  hasNotifications
  theme="dark"
  onThemeToggle={() => {}}
/>
```

### 4. MobileMenu Props
```tsx
<MobileMenu
  currentView="dashboard"
  onViewChange={(v) => setView(v)}
  onLogout={() => logout()}
/>
```

## Snippets Rápidos

### Abrir Menu
```tsx
import { useMobileMenuStore } from '@/stores/mobileMenuStore';
const { open } = useMobileMenuStore();
<button onClick={open}>📱 Menu</button>
```

### Fechar Menu
```tsx
const { close } = useMobileMenuStore();
<button onClick={close}>✕ Fechar</button>
```

### Toggle Menu
```tsx
const { toggle } = useMobileMenuStore();
<button onClick={toggle}>🔄 Alternar</button>
```

### Custom Drawer
```tsx
import Drawer from '@/components/layout/Drawer';
import Backdrop from '@/components/layout/Backdrop';

<Drawer isOpen={isOpen} onClose={close} position="right" width="20rem">
  {/* Conteúdo */}
</Drawer>
<Backdrop isOpen={isOpen} onClose={close} />
```

## Breakpoints Tailwind

```css
sm: 640px   {/* Mobile landscape, Avatar info aparece */}
md: 768px   {/* Tablet/Desktop, Sidebar aparece, hamburger desaparece */}
lg: 1024px  {/* Laptop */}
xl: 1280px  {/* Desktop */}
2xl: 1536px {/* Widescreen */}
```

## Classes Chave

### Mobile Only
```typescript
md:hidden      {/* Só mostra em mobile (< 768px) */}
```

### Desktop Only
```typescript
hidden md:flex {/* Só mostra em desktop (>= 768px) */}
```

### Avatar Info
```typescript
hidden sm:block {/* Só mostra em >= 640px */}
```

## Animações

### Fade In
```css
fade-in { animation: fadeIn 0.3s ease-out; }
```

### Slide In
```css
slide-in-left  { animation: slideInLeft 0.3s; }
slide-in-right { animation: slideInRight 0.3s; }
```

### Uso
```tsx
<div className="fade-in">...</div>
<div className="slide-in-left">...</div>
```

## Cores Personalizadas

### Drawer Background
```tsx
className="bg-zinc-950"  {/* Padrão escuro */}
```

### Backdrop
```tsx
className="bg-black/50 backdrop-blur-sm"  {/* Semi-transparente + blur */}
```

### Menu Item Ativo
```tsx
className="bg-[#f4c025]/10 text-[#f4c025]"  {/* Amarelo BarberZap */}
```

## Z-Index

```
Z-50: Drawer      (Mais alto)
Z-40: Backdrop
Z-20: Header
DEFAULT: Main content
```

## Teste Rápido

### 1. Simular Mobile
```javascript
// No DevTools (F12)
// Clique no ícone de dispositivo
// Selecione "iPhone SE" ou "iPhone 12"
```

### 2. Testar Menu
```javascript
[-] Abrir: Clicar no hamburger ☰
[-] Fechar:
  • Clicar no X ✕
  • Clicar no backdrop
  • Pressionar ESC
[-] Navegar: Clicar em um item → menu fecha
```

### 3. Verificar Desktop
```javascript
[-] Hamburger oculto (md:hidden)
[-] Sidebar visível (hidden md:flex)
[-] Menu mobile oculto
```

## Problemas Comuns

### ❌ Menu não abre
```bash
# Verifique Zustand
npm list zustand

# Reinstalar
npm install zustand
```

### ❌ Animações não funcionam
```tsx
// Verifique se animations.css está importado em main.tsx
import '@/assets/animations.css';
```

### ❌ Scroll não bloqueia
```tsx
// Verifique o useEffect no Backdrop.tsx
useEffect(() => {
  if (isOpen) document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = 'unset'; };
}, [isOpen]);
```

### ❌ ESC não funciona
```tsx
// Verifique o event listener no Backdrop
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') onClose();
});
```

## Performance

### ✅ Otimizado
- Zustand (Zero boilerplate)
- CSS Transitions (Hardware acceleration)
- Event listeners limpos
- Lazy rendering

### ⚡ 60fps
- Transitions, não JS animations
- transform: translateX (GPU)
- opacity transitions

## Acessibilidade

### ARIA Labels
```tsx
<button aria-label="Abrir menu">...</button>
<button aria-label="Fechar menu">...</button>
<button aria-label="Notificações">...</button>
```

### Teclado
- ESC fecha menu
- TAB navega itens

## Links

**Documentação:**
- 📖 [README Completo](./MOBILE_MENU_README.md)
- 📊 [Implementação Detalhada](./MOBILE_MENU_IMPLEMENTATION.md)
- 💡 [Exemplos de Código](./MOBILE_MENU_EXAMPLE.tsx)

**Dependências:**
- 📦 [Zustand](https://github.com/pmndrs/zustand)
- 🎨 [Tailwind CSS](https://tailwindcss.com/)
- 🔤 [Material Symbols](https://fonts.google.com/icons)

---

**Versão:** 1.0.0
**Status:** ✅ Production Ready
**Última Atualização:** 2026-03-05
