# 🚨 RUNBOOK: Erros Comuns

## 📋 Visão Geral

Este runbook cobre erros comuns que podem ocorrer no BarberZap Pro, como identificá-los, debugá-los e resolvê-los.

---

## 🎯 Erros por Categoria

### 🔐 Autenticação

### Erro 1: Login não funciona

**Sintoma**: Usuário clica em "Entrar" mas não acontece nada

**Debugar**:
```typescript
// Verificar handler
console.log('[Login] Handle called');
console.log('[Login] isAuthenticated:', isAuthenticated);

// Verificar se há erros no console
// Verificar Network tab para requests (quando implementado)
```

**Possíveis causas**:
- Handler não chamado
- Event.preventDefault() faltando
- Estado não atualizando

**Solução**:
```typescript
// src/components/auth/Login.tsx
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault(); // Importante!
  console.log('[Login] Logging in...');
  setIsAuthenticated(true);
  setView('dashboard');
}
```

---

### Erro 2: Session não persiste

**Sintoma**: Usuário faz login, mas ao recarregar a página volta para login

**Debugar**:
```typescript
// Verificar se localStorage está sendo usado
console.log('[Auth] Session from storage:', localStorage.getItem('session'));

// Verificar se useEffect está rodando ao montar
useEffect(() => {
  console.log('[Auth] Checking session...');
}, []);
```

**Possíveis causas**:
- Sem localStorage/sessionStorage
- Estado não persistido
- useEffect não inicializando session

**Solução**:
```typescript
// Persistir session
useEffect(() => {
  const saved = localStorage.getItem('isAuthenticated');
  if (saved === 'true') {
    setIsAuthenticated(true);
  }
}, []);

const handleLogin = () => {
  setIsAuthenticated(true);
  localStorage.setItem('isAuthenticated', 'true');
}
```

---

### 📊 Dados

### Erro 3: Componentes sem dados (undefined)

**Sintoma**: Componente mostra "undefined" ou erro ao acessar propriedades de dados

**Debugar**:
```typescript
// Verificar se dados estão chegando
console.log('[Component] Appointments:', appointments);
console.log('[Component] Services:', services);

// Verificar se há erro no console
// TypeError: Cannot read property 'map' of undefined
```

**Possíveis causas**:
- Mock data não importado
- Prop não passada
- Data ainda carregando

**Solução**:
```typescript
// Adicionar verificação
{appointments?.map(apt => (
  // ...
))}

// Ou adicionar loading state
if (loading) return <LoadingSpinner />;
if (!appointments) return <ErrorMessage />;
```

---

### Erro 4: Dados não atualizam após edição

**Sintoma**: Usuário edita um agendamento, mas mudanças não aparecem

**Debugar**:
```typescript
// Verificar se função de update está sendo chamada
console.log('[Update] Called with:', updatedData);

// Verificar se estado está sendo atualizado
console.log('[Update] New state:', newState);

// Verificar se há re-render
console.log('[Render] Component re-rendered');
```

**Possíveis causas**:
- Estado não atualizado
- Função de update não chamada
- Imutabilidade violada

**Solução**:
```typescript
// Atualizar estado de forma imutável
const handleUpdate = (id: string, updated: Appointment) => {
  setAppointments(prev =>
    prev.map(apt => apt.id === id ? updated : apt)
  );
}

// OU criar novo array
const handleUpdate = (id: string, updated: Appointment) => {
  setAppointments([...appointments.map(apt =>
    apt.id === id ? updated : apt
  )]);
}
```

---

### 🤖 IA/Gemini

### Erro 5: "GEMINI_API_KEY not found"

**Sintoma**: Chat da IA não funciona, erro no console

**Debugar**:
```typescript
// Verificar se API key está definida
console.log('[AI] API Key:', import.meta.env.GEMINI_API_KEY);
console.log('[AI] Process env:', process.env.API_KEY);

// Verificar no vite.config.ts
console.log('[Vite] Env loaded:', loadEnv(mode, '', ''));
```

**Possíveis causas**:
- .env.local não existe
- API key não definida
- Vite não carregando env vars

**Solução**:
```bash
# 1. Criar .env.local
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 2. Verificar se existe
cat .env.local

# 3. Reiniciar servidor
npm run dev
```

---

### Erro 6: IA não responde / timeout

**Sintoma**: Mensagem enviada mas IA não responde

**Debugar**:
```typescript
// Verificar logs do service
console.log('[Gemini] Sending prompt:', prompt);
console.log('[Gemini] Response:', response);

// Verificar Network tab para request
// Verificar se há erro no console
```

**Possíveis causas**:
- API key inválida
- Network timeout
- API limit
- Prompt muito longo

**Solução**:
```typescript
// Adicionar timeout e retry
const generateWithRetry = async (prompt: string, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await aiService.generateResponse(prompt);
    } catch (error) {
      console.error(`[Gemini] Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await delay(1000 * (i + 1));
    }
  }
}
```

---

### 🎨 UI/Rendering

### Erro 7: Componente não renderiza

**Sintoma**: Componente existe na DOM mas não aparece nada

**Debugar**:
```typescript
// Verificar se componente está sendo renderizado
console.log('[Component] Rendered');

// Verificar se há display: none ou visibility: hidden
// Verificar se z-index está correto
// Verificar se há overflow: hidden

// Adicionar estilo temporário
style={{ background: 'red' }} // Deve aparecer quadrado vermelho
```

**Possíveis causas**:
- Display none
- Overflow hidden
- Z-index incorreto
- Opacity 0
- Múltiplas views renderizando

**Solução**:
```typescript
// Verificar condicional de renderização
{view === 'dashboard' && <Dashboard />}

// Verificar className CSS
className="hidden" // Pode estar ocultando

// Verificar z-index
className="z-0" // Pode estar atrás de outros elementos
```

---

### Erro 8: Estilos não aplicam

**Sintoma**: Componente não tem os estilos esperados

**Debugar**:
```typescript
// Verificar se classes Tailwind estão corretas
console.log('[Styles] Classes:', className);

// Verificar no DevTools se classes estão aplicadas
// Verificar se Tailwind está carregando

// Testar classe simples
className="bg-red-500" // Deve aparecer vermelho
```

**Possíveis causas**:
- Tailwind não carregou
- Nome de classe incorreto
- Classe sobrescrita por outra
- CDN não carregou

**Solução**:
```html
<!-- Verificar se Tailwind CDN está no index.html -->
<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>

<!-- Verificar se há erros no console relacionados ao Tailwind -->
<!-- Limpar cache e recarregar -->
```

---

### 🔄 State Management

### Erro 9: Estado não atualiza (stale state)

**Sintoma**: Estado atualizado mas UI mostra valor antigo

**Debugar**:
```typescript
// Verificar se setter está sendo usado corretamente
console.log('[State] Setting to:', newValue);
console.log('[State] Current state:', currentState);

// Verificar se há múltiplas chamadas ao setter
// Verificar se há closure capturando valor antigo
```

**Possíveis causas**:
- Closure capturando valor antigo
- Múltiplas chamadas ao setter
- Estado atualizado assincronamente

**Solução**:
```typescript
// Usar callback setter para valor baseado no estado atual
setCount(prev => prev + 1);

// OU usar useEffect
useEffect(() => {
  console.log('[State] Updated:', count);
}, [count]);
```

---

### Erro 10: Loop infinito de re-renders

**Sintoma**: Componente renderiza infinitamente, browser trava

**Debugar**:
```typescript
// Verificar se há console.log infinitos
console.log('[Render] Component rendered');

// Verificar useEffect com dependências
useEffect(() => {
  // Se atualiza estado, entra em loop
  setSomething(...);
}, [something]); // ← Dependência circular
```

**Possíveis causas**:
- useEffect atualiza estado
- Dependência circular
- Memoization não funcionando

**Solução**:
```typescript
// Remover dependência circular
useEffect(() => {
  setSomething(newValue);
}, []); // Sem dependências, roda uma vez

// OU usar useCallback
const updateSomething = useCallback(() => {
  setSomething(prev => prev + 1);
}, []);

useEffect(() => {
  updateSomething();
}, [updateSomething]);
```

---

## 🛠️ Ferramentas de Debug

### React DevTools

```typescript
// Instalar extensão
// Componentes → Ver props e estado
// Profiler → Ver performance
```

### Console Logging

```typescript
console.log('[Tag] Mensagem'); // Log simples
console.error('[Tag] Erro:', error); // Log erro
console.warn('[Tag] Aviso:', warning); // Log aviso
console.table(arrayData); // Tabela de dados
console.dir(objectData); // Objeto expandido
```

### Breakpoints (VS Code)

```typescript
// Adicionar debugger no código
debugger; // Para execução aqui

// OU usar VS Code debugger
// Clique na linha para adicionar breakpoint
// F5 para iniciar debug
```

---

## 🚨 Como Reportar Erros

### Template de Bug Report

```
**Descrição**: [O que está acontecendo]

**Passos para reproduzir**:
1. [Primeiro passo]
2. [Segundo passo]
3. [Terceiro passo]

**Comportamento esperado**: [O que deveria acontecer]

**Comportamento real**: [O que está acontecendo]

**Screenshots/logs**: [Anexar se aplicável]

**Ambiente**:
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari]
- Node version: [node --version]
- Browser console errors: [Copiar console errors]
```

---

## ✅ Checklist de Troubleshooting

Quando encontrar um erro:

1. [ ] Verificar console do browser
2. [ ] Verificar Network tab
3. [ ] Verificar React DevTools
4. [ ] Adicionar logs relevantes
5. [ ] Reproduzir o erro consistentemente
6. [ ] Isolar o problema
7. [ ] Tentar solução simples
8. [ ] Documentar descobertas
9. [ ] Reportar se necessário
10. [ ] Testar solução implementada

---

## 📚 Recursos

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [TypeScript Debugging](https://www.typescriptlang.org/docs/handbook/debugging.html)

---

**Última atualização**: 2026-03-03
**Responsável**: Dev Sênior
