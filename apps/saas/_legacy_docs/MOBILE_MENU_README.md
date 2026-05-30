# 📱 Mobile Menu Responsivo - BarberZap

Implementação completa de menu mobile responsivo com drawer deslizante para o projeto BarberZap.

## 📁 Estrutura de Arquivos

```
src/
├── stores/
│   └── mobileMenuStore.ts        # Store Zustand para estado do menu
├── components/layout/
│   ├── MobileMenu.tsx            # Componente de menu mobile
│   ├── Drawer.tsx                # Drawer genérico reutilizável
│   ├── Backdrop.tsx              # Backdrop/backdrop-blur
│   └── Header.tsx                # Header refatorado com hamburger
└── app/
    └── App.tsx                   # App atualizado com integração
```

## ✨ Funcionalidades Implementadas

### 1. **Store Zustand** (`mobileMenuStore.ts`)
- Estado global do menu mobile
- Métodos: `open()`, `close()`, `toggle()`
- Estado reativo com TypeScript

### 2. **Backdrop** (`Backdrop.tsx`)
- Background escuro com blur (`bg-black/50 backdrop-blur-sm`)
- Fecha o menu ao clicar
- Fecha com tecla ESC
- Animação de fade-in/out
- Previa scroll do body quando aberto

### 3. **Drawer Genérico** (`Drawer.tsx`)
- Posicion configurable: `left` ou `right`
- Width dinâmico (padrão: 16rem)
- Animação suave de slide (0.3s)
- z-index: 50 (acima de backdrop)
- Overflow com scroll automático

### 4. **Header Refatorado** (`Header.tsx`)
- Botão hamburger (Ícone Material Symbols)
- Apenas visível em mobile (`md:hidden` no hamburger)
- Logo BarberZap
- Sino de notificações com badge
- Avatar do usuário
- Layout responsivo
- Preparado para tema toggle

### 5. **MobileMenu** (`MobileMenu.tsx`)
- Menu items iguais ao Sidebar
- Botão X para fechar
- Fecha ao navegar
- Fecha ao fazer logout
- Apenas visível em mobile

## 🔧 Instalação de Dependências

```bash
npm install zustand
```

## 📱 Uso

### No Header:
```tsx
import { useMobileMenuStore } from '@/stores/mobileMenuStore';

const { open } = useMobileMenuStore();

<button onClick={open} className="md:hidden">
  <span className="material-symbols-outlined">menu</span>
</button>
```

### No App.tsx:
```tsx
import MobileMenu from '@/components/layout/MobileMenu';
import Header from '@/components/layout/Header';

<MobileMenu
  currentView={view}
  onViewChange={setView}
  onLogout={logout}
/>

<Header
  shopName="Barbearia do Zé"
  userName="Zé da Silva"
  userRole="Proprietário"
  hasNotifications={true}
/>
```

### Controle Programático:
```ts
import { useMobileMenuStore } from '@/stores/mobileMenuStore';

const { isOpen, open, close, toggle } = useMobileMenuStore();

// Abrir menu
open();

// Fechar menu
close();

// Alternar estado
toggle();

// Verificar estado
console.log(isOpen); // boolean
```

## 🎨 Personalização

### Mudar cor do Drawer:
```tsx
// Drawer.tsx
className="fixed top-0 bottom-0 left-0 bg-zinc-950 z-50..."
//                     ^^^^^^^^^^^
```

### Mudar cor do Backdrop:
```tsx
// Backdrop.tsx
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40..."
//                   ^^^^^^^^^^
```

### Ajustar velocidade de animação:
```tsx
// Drawer.tsx & Backdrop.tsx
duration-300  // 300ms
//           ^^^^
// Pode usar: duration-200 | duration-300 | duration-500
```

### Mudar tamanho do Drawer:
```tsx
// No componente pai
<Drawer isOpen={isOpen} onClose={close} width="20rem">
//                                      ^^^^^^^^
// Pode usar: 14rem | 16rem | 20rem | 24rem
```

## 🧪 Testes

### Viewport Mobile:
1. Abra o DevTools (F12)
2. Clique no ícone de dispositivo (Toggle device toolbar)
3. Selecione um dispositivo (ex: iPhone SE, iPhone 12, etc.)
4. O menu hamburger aparecerá no header
5. Clique no hamburger para abrir o menu

### Testes Funcionais:
- ✅ Botão hamburger abre o menu
- ✅ Botão X fecha o menu
- ✅ Clicar no backdrop fecha o menu
- ✅ Tecla ESC fecha o menu
- ✅ Navegar pelo menu fecha automaticamente
- ✅ Botão Sair fecha o menu
- ✅ Scroll do body bloqueado quando menu aberto
- ✅ Animações suaves de entrada/saída

### Viewport Desktop:
- ✅ Hamburger oculto (`md:hidden`)
- ✅ Sidebar desktop visível (`hidden md:flex`)
- ✅ Menu mobile não aparece (`md:hidden`)

## 🎯 Breakpoints Tailwind CSS

```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices (tablet/desktop) */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* Extra extra large */
```

**Menu mobile**: `< 768px`
**Sidebar desktop**: `>= 768px`
**Avatar info**: `>= 640px`

## 🚀 Performance

- Estado otimizado com Zustand (Zero boilerplate)
- Animações via CSS transitions (60fps)
- Lazy rendering (só renderiza quando necessário)
- Event listeners limpos no unmount

## ♿ Acessibilidade

- Aria labels nos botões
- Fechamento com tecla ESC
- Suporte a navegação por teclado
- Semântica HTML correta

## 📝 Notas Importantes

1. **Material Icons**: O projeto usa `material-symbols-outlined` do Google Fonts
2. **Tailwind CDN**: Configurado via CDN no `index.html`
3. **TypeScript**: Totalmente tipado
4. **React 19**: Compatível com React 19

## 🔍 Solução de Problemas

### Menu não abre:
1. Verifique se Zustand está instalado: `npm list zustand`
2. Verifique se o store está sendo importado corretamente

### Animações não funcionam:
1. Verifique se o Tailwind CSS está configurado
2. Verifique se as classes de duração estão corretas

### Scroll não bloqueia:
1. Verifique o useEffect no Backdrop
2. Verifique se o z-index está correto

### Tecla ESC não funciona:
1. Verifique se o evento keyboard está sendo adicionado
2. Verifique se o cleanup está sendo executado

## 📚 Referências

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)
- [Material Symbols](https://fonts.google.com/icons)

## 🎓 Próximas Melhorias

- [ ] Adicionar swipe para fechar menu
- [ ] Adicionar tema toggle funcional
- [ ] Animação de entrada do header content
- [ ] Suporte a menu itens com submenus
- [ ] Persistir estado do menu no localStorage

---

**Desenvolvido por BarberZap Team** 🚀
**Data**: 2026-03-05
