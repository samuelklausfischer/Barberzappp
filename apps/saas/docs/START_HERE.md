# 🚀 START HERE - Guia de Onboarding

Bem-vindo ao BarberZap Pro! Este guia vai te colocar em produção em 3 minutos.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- [x] **Node.js** (v18 ou superior) - [Download](https://nodejs.org/)
- [x] **Editor de código** (VS Code recomendado) - [Download](https://code.visualstudio.com/)
- [x] **Git** instalado - [Download](https://git-scm.com/)

## ⚡ Setup Rápido (3 min)

### 1. Clonar e Instalar

```bash
# Clone o repositório (se aplicável)
git clone <url-repositorio>
cd barber

# Instale as dependências
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite o arquivo .env.local e adicione sua API key do Google Gemini:
GEMINI_API_KEY=sua_chave_aqui
```

**Como obter a API key:**
1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Faça login com sua conta Google
3. Vá em "API Keys"
4. Crie uma nova chave
5. Copie e cole no `.env.local`

### 3. Rodar o Projeto

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

O projeto estará rodando em: **http://localhost:3000**

## 🎯 Primeiros Passos

### Acessar a Aplicação

1. Abra o navegador em `http://localhost:3000`
2. Faça login com qualquer email/senha (é mock atualmente)
3. Explore o dashboard e as funcionalidades

### Estrutura Básica de Navegação

```
📂 src/
├── app/          # Entry point da aplicação
├── components/   # Componentes de UI (Dashboard, Agenda, etc.)
├── features/     # Lógica de negócio por contexto
├── domain/       # Tipos e entidades centrais
├── config/       # Configurações (tema, rotas)
└── lib/          # Funções utilitárias
```

### Documentação Importante

- 📖 **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura e padrões
- 🗺️ **[MAP.md](./MAP.md)** - Índice completo do projeto
- 📊 **[DATA_MAP.md](./DATA_MAP.md)** - Onde encontrar dados
- 📚 **[RUNBOOKS/](./RUNBOOKS/)** - Guia operacional

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor dev (localhost:3000)

# Build
npm run build            # Build para produção
npm run preview          # Preview do build local

# Código
npm run lint             # Verificar código (se configurado)
npm run typecheck        # Verificar tipos (se configurado)

# Testes
npm test                 # Rodar testes (quando implementados)
npm run test:watch       # Modo watch
```

## 🐛 Debug

### Problemas Comuns

#### 1. Erro de API Key

**Erro**: `GEMINI_API_KEY not found`

**Solução**:
```bash
# Verifique se .env.local existe
ls -la .env.local

# Verifique o conteúdo
cat .env.local

# Reinicie o servidor
npm run dev
```

#### 2. Erro de Dependências

**Erro**: `Module not found`

**Solução**:
```bash
# Reinstale as dependências
rm -rf node_modules package-lock.json
npm install
```

#### 3. Porta 3000 em uso

**Erro**: `Port 3000 is already in use`

**Solução**:
```bash
# Windows (cmd)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Ou use outra porta em vite.config.ts
```

### Ferramentas de Debug

- **React DevTools**: Extensão do Chrome para debug React
- **Console do navegador**: Para logs e erros
- **Network tab**: Para monitorar chamadas de API
- **Breakpoints no VS Code**: Para debug step-by-step

## 🎓 Sua Primeira Tarefa

Vamos colocar você para trabalhar! Escolha uma tarefa:

### 🟢 Nível 1 - Fácil (Primeira tarefa recomendada)

**Tarefa**: Adicionar um novo serviço ao catálogo

1. Abra `src/features/services/mocks/mockServices.ts`
2. Adicione um novo objeto ao array
3. Rode o projeto e veja na página "Serviços"
4. ✅ Sucesso!

### 🟡 Nível 2 - Médio

**Tarefa**: Criar um novo componente de card

1. Crie `src/components/shared/Card/Card.tsx`
2. Implemente um card reutilizável com props
3. Use no Dashboard
4. ✅ Sucesso!

### 🔴 Nível 3 - Avançado

**Tarefa**: Implementar hook customizado

1. Crie `src/hooks/useLocalStorage.ts`
2. Implemente um hook que salva/le do localStorage
3. Use no componente de AI Config para persistir settings
4. ✅ Sucesso!

## 📚 Recursos de Aprendizado

- **React Docs**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite**: https://vitejs.dev/guide/

## 🆘 Precisa de Ajuda?

### Canais de Suporte

1. **Documentação**: Verifique os arquivos em `docs/`
2. **Runbooks**: `docs/RUNBOOKS/` para problemas operacionais
3. **Issues**: Abra uma issue no GitHub (se aplicável)
4. **Equipe**: Contate um dev sênior

### Como Fazer Boas Perguntas

❌ **Ruim**: "Está dando erro"

✅ **Bom**: "Estou recebendo erro 'GEMINI_API_KEY not found' ao tentar usar o chat da IA. Já verifiquei o .env.local e a chave está lá. O que pode ser?"

## ✅ Checklist de Onboarding

- [ ] Instalei Node.js e VS Code
- [ ] Clonei o repositório
- [ ] Rodei `npm install`
- [ ] Configurei o .env.local
- [ ] Rodei `npm run dev`
- [ ] Acessei http://localhost:3000
- [ ] Li o ARCHITECTURE.md
- [ ] Li o MAP.md
- [ ] Li o DATA_MAP.md
- [ ] Completei minha primeira tarefa
- [ ] Entendi a estrutura de pastas
- [ ] Entendi as fronteiras de importação

## 🎉 Parabéns!

Você agora está pronto para contribuir com o BarberZap Pro!

**Próximos passos**:
1. Escolha uma issue para trabalhar
2. Crie uma branch: `git checkout -b feature/sua-feature`
3. Faça suas alterações
4. Commit e push
5. Abra um Pull Request

Boa sorte e código feliz! 🚀

---

**Última atualização**: 2026-03-03
