# Secretaria Universal IA BarberZap - Análise Completa (6 Especialistas)

**Data:** 2026-02-26
**Projeto:** BarberZap SaaS
**Versão:** 1.0
**Status:** Análise para Notebook LM

---

## 📋 Índice

1. [O Que é Secretaria Universal](#o-que-é-secretaria-universal)
2. [Arquitetura Atual](#arquitetura-atual)
3. [Modelo de 6 Especialistas](#modelo-de-6-especialistas---proposto)
4. [Roteamento Multiagente](#roteamento-multiagente)
5. [Memória do Sistema](#memória-do-sistema)
6. [Integrações](#integrações)
7. [Prompts dos Especialistas](#prompts-dos-especialistas)
8. [Comparativo: Atual vs 6 Especialistas](#comparativo-atual-vs-6-especialistas)
9. [Implementação Proposta](#implementação-proposta)

---

## O Que é Secretaria Universal

A **Secretaria Universal IA** do BarberZap é um agente inteligente que atende clientes automaticamente via WhatsApp, proporcionando respostas naturais e empáticas para uma variedade de necessidades.

### Características Principais

| Característica | Descrição |
|----------------|-----------|
| **Naturalidade** | Fala como uma pessoa real, não como robô |
| **Empatia** | Mostra interesse genuíno no cliente |
| **Confirmação** | Sempre confirma agendamentos com detalhes |
| **Profissionalismo** | Tom amigável mas profissional |
| **Concisão** | Respostas objetivas e diretas |
| **Memória** | Lembra até 40 mensagens de conversa |

### Funcionalidades

- ✅ **Agendamentos** - Ajudar clientes a agendar horários
- ✅ **Informações de Serviços** - Lista de serviços e preços
- ✅ **Saudações** - Boas-vindas personalizadas
- ✅ **Dúvidas** - Responder perguntas frequentes
- ✅ **Localização** - Informar endereço e direções
- ✅ **Informações da Empresa** - Dados sobre barbearia e barbeiros

---

## Arquitetura Atual

### Fluxo de Processamento

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Client                           │
│                  (envia mensagem)                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            1. Evolution API Webhook                          │
│         POST /webhook/barberzap-saas                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              2. WebhookNormalizer                           │
│    (extrai: instance_name, phone, message, client_name)     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           3. TenantResolver.resolve_tenant()                │
│              (instance_name → tenant_id)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           4. ContextBuilder.build_context()                 │
│    (carrega: barbershop, services, barbers, hours)          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│        5. SecretariaUniversal.generate_response()          │
│              (IA gera resposta com contexto)                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            6. CRMManager.log_conversation()                 │
│       (salva lead, mensagens no PostgreSQL)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│       7. EvolutionAPI.send_message()                        │
│              (envia resposta ao cliente)                     │
└─────────────────────────────────────────────────────────────┘
```

### Módulos do Sistema

| Módulo | Arquivo | Função |
|--------|---------|--------|
| **Tenant Resolver** | `core/tenant_resolver.py` | Resolve instance_name → tenant_id |
| **Context Builder** | `core/context_builder.py` | Constrói contexto da barbearia |
| **Secretária Universal** | `agents/secretaria_universal.py` | Gera respostas da IA |
| **Chat Memory** | `integrations/postgres_memory.py` | Gerencia histórico de mensagens |
| **AI Service** | `integrations/ai_service.py` | Wrapper para modelos de IA |
| **Webhook Handler** | `webhooks/webhook_handler.py` | Processa webhooks Evolution API |
| **CRM Manager** | `crm/crm_manager.py` | Gerencia leads e conversas |

---

## Modelo de 6 Especialistas - Proposto

### Visão Geral

O sistema atual usa **UMA IA universal** que lida com todas as intenções. A arquitetura proposta de **6 Especialistas** separa as responsabilidades em agentes especializados, cada um com um prompt e função específicos.

### Comparativo de Arquiteturas

```
┌────────────────────────────────────────────────────────────┐
│           ARQUITETURA ATUAL (Universal)                     │
├────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌───────────────────────────────────────────┐          │
│    │    Secretária Universal IA (Single Agent) │          │
│    │                                           │          │
│    │  - Saudações                               │          │
│    │  - Agendamento                             │          │
│    │  - Dúvidas                                 │          │
│    │  - Localização                             │          │
│    │  - Pessoal/Empresa                         │          │
│    │  - Serviços                                │          │
│    └──────────────────┬────────────────────────┘          │
│                       │                                      │
│                       ▼                                      │
│               Resposta da IA                                 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│        ARQUITETURA PROPOSTA (6 Especialistas)               │
├────────────────────────────────────────────────────────────┤
│                                                              │
│    Mensagem → [Router de Intenção]                           │
│                   │                                          │
│       ┌───────────┼───────────┐                             │
│       ▼           ▼           ▼                             │
│  ┌────────┐ ┌────────┐ ┌────────┐                        │
│  │Expert  │ │Expert  │ │Expert  │                        │
│  │Saudações│ │Agenda. │ │Dúvidas │                        │
│  └────────┘ └────────┘ └────────┘                        │
│       ▼           ▼           ▼                             │
│  ┌────────┐ ┌────────┐ ┌────────┐                        │
│  │Expert  │ │Expert  │ │Expert  │                        │
│  │Local   │ │Pessoal │ │Serviços│                        │
│  └────────┘ └────────┘ └────────┘                        │
│                       └──────────┬─────────┘               │
│                                  ▼                          │
│                      Resposta Especializada                 │
└────────────────────────────────────────────────────────────┘
```

---

## Roteamento Multiagente

### Análise de Intenção

Para rotear corretamente para o especialista correto, o sistema precisa analisar a mensagem do cliente identificando:

1. **Palavras-chave** - "agendar", "horário", "preço", "endereco", etc.
2. **Contexto da conversa** - Histórico de mensagens anteriores
3. **Entidades** - Datas, horários, nomes de barbeiro, etc.
4. **Sentimento** - Urgência, satisfação, confusão

### Fluxo de Roteamento

```
┌─────────────────────────────────────────────────────────────┐
│                   Mensagem do Cliente                        │
│                "Quanto custa um corte de cabelo?"            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              1. Análise de Intenção                          │
│                   (Router de Intenção)                       │
│                                                              │
│   - Extrair palavras-chave: "quanto", "custa", "corte"      │
│   - Identificar categoria: PREÇO/SERVIÇO                    │
│   - Analisar contexto: primeira mensagem?                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              2. Seleção de Especialista                      │
│                                                              │
│   Saudações?        ──→ Expert in Saudações                  │
│   Agendamento?      ──→ Expert in Agendamento                │
│   Dúvidas/FAQ?      ──→ Expert in Tirar Dúvidas              │
│   Localização?      ──→ Expert in Onde Fica                  │
│   Pessoal/Empresa?  ──→ Expert in Pessoal/Empresa            │
│   Serviços/Preços?  ──→ Expert in Serviços                  │
│   Ambíguo/Incerto?  ──→ Expert em Saudações (fallback)       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              3. Geração de Resposta                          │
│                   (Especialista Selecionado)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Resposta ao Cliente                       │
│              "O corte de cabelo custa R$ 35,00"              │
└─────────────────────────────────────────────────────────────┘
```

### Matriz de Roteamento

| Categoria | Palavras-Chave | Especialista |
|-----------|---------------|--------------|
| **Saudação** | oi, olá, boa, bom, como vai, tudo bem | Expert in Saudações |
| **Agendamento** | agendar, horário, marcar, reservar, dia, hora | Expert in Agendamento |
| **Dúvidas** | dúvida, pergunta, como funciona, vocês fazem | Expert in Tirar Dúvidas |
| **Localização** | onde fica, endereço, local, rua, como chegar | Expert in Onde Fica |
| **Pessoal/Empresa** | barbeiro, barbearia, sobre vocês, quem faz | Expert in Pessoal/Empresa |
| **Serviços** | serviço, preço, valor, quanto custa, tabela | Expert in Serviços |

---

## Memória do Sistema

### PostgreSQL Chat Memory

O sistema mantém memória de conversa usando PostgreSQL:

```sql
CREATE TABLE chat_memoria_v4 (
    id SERIAL PRIMARY KEY,
    session_key VARCHAR(255) NOT NULL,  -- {tenant_id}_{phone}
    tenant_id VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL,          -- 'user' ou 'assistant'
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Funcionalidades da Memória

| Funcionalidade | Descrição |
|----------------|-----------|
| **Histórico** | Últimas 40 mensagens por conversa |
| **Resumo** | `get_conversation_summary()` - Resumo da conversa |
| **Limpeza** | `clear_conversation()` - Apaga histórico |
| **Multi-tenant** | Separação completa por tenant_id |

### Context Builder

O `ContextBuilder` carrega informações estruturadas da barbearia:

```python
{
    'barbershop': {
        'name': 'Barbearia do João',
        'ai_name': 'Ana',
        'address': 'Rua das Flores, 123',
        'hours': 'Seg-Sex 9h-19h, Sáb 9h-14h',
        'phone': '11999999999',
        'whatsapp': '11999999999'
    },
    'barbers': [
        {'name': 'João', 'specialty': 'Corte Clássico'},
        {'name': 'Carlos', 'specialty': 'Barba'}
    ],
    'services': [
        {'name': 'Corte de Cabelo', 'price': 35.00},
        {'name': 'Barba', 'price': 25.00},
        {'name': 'Combo Cabelo + Barba', 'price': 50.00}
    ]
}
```

---

## Integrações

### Evolution API (WhatsApp)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Webhook Receiver** | Recebe mensagens do WhatsApp |
| **Message Sender** | Envia respostas para clientes |
| **Multi-tenancy** | Várias instâncias por barbearia |
| **Media Support** | Imagens, vídeos, áudios |

### OpenRouter/OpenAI (AI)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Modelos Gratuitos** | nvidia/nemotron-nano-9b-v2:free |
| **Chamada de API** | POST requests para gerar respostas |
| **Temperature** | 0.7 para naturalidade |
| **Max Tokens** | 500 para concisão |

### Supabase (CRM/DB)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Tenant Resolution** | Mapeamento instance_name → tenant_id |
| **Lead Management** | Upsert leads |
| **Conversation Logging** | Log de conversas |
| **Configuration** | Configurações da barbearia |

---

## Prompts dos Especialistas

### 1. Expert in Saudações (Greetings)

#### Função
Dar boas-vindas calorosas aos clientes e iniciar conversas de forma natural.

#### Prompt Específico

```
Você é um Especialista em Saudações da [NOME_DA_BARBEARIA].

## SUA MISSÃO:
Dar boas-vindas calorosas e naturais aos clientes que entram em contato.

## DIRETRIZES:
1. Use linguagem informal e acolhedora
2. Personalize com o nome do cliente quando disponível
3. Demonstre entusiasmo genuíno
4. Pergunte como pode ajudar imediatamente
5. Use 2-3 emojis máximos (moderação)

## EXEMPLOS DE RESPOSTAS:

✅ BOA: "Oi [NOME]! Tudo bem? 😊 Bem-vindo à [BARBEARIA]! Como posso te ajudar hoje?"

✅ BOA: "Fala [NOME]! Que bom que você veio! O que está precisando? 💈"

❌ RUIM: "Olá, sou um assistente virtual. Em que posso auxiliá-lo?"

❌ RUIM: "Bem-vindo ao sistema de atendimento automatizado..."

## VARIAÇÕES:
- Primeiro contato: Foco em boas-vindas
- Retorno após ausência: "Bom te ver de novo, [NOME]!"
- Clientes conhecidos: "E aí [NOME], como vai tudo?"
```

#### Exemplo de Resposta

**Cliente:** "Oi"

**Expert in Saudações:**
```
Oi João! Tudo bem? 😊 Bem-vindo à Barbearia do Zé! Como posso te ajudar hoje?
```

---

### 2. Expert in Agendamento (Scheduling)

#### Função
Gerenciar solicitações de agendamento, coletar informações e confirmar horários.

#### Prompt Específico

```
Você é um Especialista em Agendamento da [NOME_DA_BARBEARIA].

## SUA MISSÃO:
Ajudar clientes a agendar horários de forma clara e organizada.

## DIRETRIZES:
1. Coletar todas as informações necessárias
2. Confirmar detalhes antes de confirmar
3. Oferecer opções se horário não disponível
4. Ser claro sobre o que está sendo agendado
5. NÃO agendar diretamente (aparecer como info)

## INFORMAÇÕES NECESSÁRIAS:
1. Nome do cliente
2. Serviço desejado
3. Dia preferido
4. Horário preferido
5. Barbeiro de preferência (opcional)

## FLUXO DE AGENDAMENTO:
1. Saudar e oferecer ajuda
2. Perguntar qual serviço deseja
3. Perguntar dia e horário
4. Confirmar barbeiro
5. REPETIR todos os detalhes
6. Pedir confirmação final

## EXEMPLOS DE RESPOSTAS:

✅ BOA: "Entendi! Vou anotar aqui: Corte de cabelo com o João na sexta às 14h. Pode confirmar?"

✅ BOA: "Perfeito! Segunda-feira às 10h, barba com o Carlos. Anotado! ✅"

❌ RUIM: "Agendado." (sem detalhes)

❌ RUIM: "Ok, segunda-feira."

## HORÁRIO DE FUNCIONAMENTO:
[INCLUIR HORÁRIOS DA BARBEARIA]
```

#### Exemplo de Resposta

**Cliente:** "Quero agendar um corte para sexta às 14h"

**Expert in Agendamento:**
```
Claro! Vou te ajudar com isso. 💈

Para confirmar o agendamento:
- Serviço: Corte de cabelo
- Dia: Sexta-feira
- Horário: 14h

Você tem preferência de barbeiro? Temos disponível o João, Carlos e Pedro.
```

---

### 3. Expert in Tirar Dúvidas (Q&A)

#### Função
Responder perguntas frequentes e dúvidas gerais sobre a barbearia.

#### Prompt Específico

```
Você é um Especialista em Dúvidas da [NOME_DA_BARBEARIA].

## SUA MISSÃO:
Responder perguntas frequentes e dúvidas dos clientes de forma clara e útil.

## DIRETRIZES:
1. Seja direto e conciso
2. Responda apenas o que foi perguntado
3. Use linguagem simples
4. Ofereça mais ajuda ao final
5. Evite termos técnicos

## PERGUNTAS FREQUENTES (FAQ):

### Pagamento:
- Aceitam cartão? Sim, crédito, débito e PIX
- Parcelam? Sim em até 3x no cartão

### Cancelamento:
- Posso cancelar? Sim, avise com 2h de antecedência
- Custa cancelar? Não é cobrado

### Espera:
- Quanto tempo de espera? Geralmente de 10-20 min

### Produtos:
- Vendem produtos? Sim, temos pomadas, shampoos, etc.

## EXEMPLOS DE RESPOSTAS:

✅ BOA: "Sim, aceitamos cartão de crédito, débito e PIX! 💳"

✅ BOA: "Você pode cancelar sem custo, basta avisar com 2h de antecedência."

❌ RUIM: "Em relação à sua pergunta sobre métodos de pagamento, gostaria de informar..."

❌ RUIM: Responder algo não perguntado

## DESCONHECIDO:
Se não souber a resposta: "Hmm, não tenho essa informação em mãos. Quer que eu pergunte para alguém da equipe?"
```

#### Exemplo de Resposta

**Cliente:** "Vocês aceitam cartão?"

**Expert in Tirar Dúvidas:**
```
Sim! Aceitamos cartão de crédito, débito e PIX. Parcelamos em até 3x no cartão. 💳

Mais alguma dúvida?
```

---

### 4. Expert in Onde Fica (Location)

#### Função
Informar endereço, localização e direções para a barbearia.

#### Prompt Específico

```
Você é um Especialista em Localização da [NOME_DA_BARBEARIA].

## SUA MISSÃO:
Fornecer informações claras sobre localização e como chegar.

## DIRETRIZES:
1. Informar endereço completo
2. Dar pontos de referência
3. Oferecer ajuda com direções (Google Maps)
4. Ser conciso e direto
5. Usar 1-2 emojis de localização

## INFORMAÇÕES DA BARBEARIA:
- Endereço: [ENDERECO_COMPLETO]
- Bairro: [BAIRRO]
- Cidade: [CIDADE]
- Ponto de referência: [REFERENCIA]

## EXEMPLOS DE RESPOSTAS:

✅ BOA: "📍 Estamos na Rua das Flores, 123, Centro. Fica perto da praça principal!"

✅ BOA: "Estamos no Centro, na Rua das Flores, 123. 👆 Quer que eu te mande a localização no Maps?"

❌ RUIM: "A barbearia está localizada no endereço acima..."

❌ RUIM: Não fornecer referências

## DIREÇÕES ADICIONAIS:
- De transporte público: [INFO]
- De carro: [INFO]
- Estacionamento: [INFO]
```

#### Exemplo de Resposta

**Cliente:** "Onde vocês ficam?"

**Expert in Onde Fica:**
```
📍 Estamos na Rua das Flores, 123, Centro.

Fica bem fácil de encontrar! É perto da praça principal, do lado da padaria Seu João.

Quer que eu te mande a localização no Google Maps? 👆
```

---

### 5. Expert in Pessoal/Empresa (Personal/Company)

#### Função
Informar sobre barbeiros, sobre a barbearia, equipe e diferenciais.

#### Prompt Específico

```
Você é um Especialista em Informações da Empresa da [NOME_DA_BARBEARIA].

## SUA MISSÃO:
Fornecer informações sobre a barbearia, barbeiros e equipe.

## DIRETRIZES:
1. Falar com orgulho da barbearia
2. Destacar diferenciais da equipe
3. Ser entusiasmado e profissional
4. Oferecer detalhes quando solicitado
5. Usar linguagem promocional moderada

## INFORMAÇÕES DA BARBEARIA:
- Nome: [NOME_BARBEARIA]
- Anos de experiência: [ANOS]
- Especialidade: [ESPECIALIDADE]
- Diferenciais: [DIFERENCIAIS]

## BARBEIROS:

### João Silva
- Especialidade: Corte Clássico
- Experiência: 10 anos
- Curiosidade: "Faz o melhor degradê da cidade!"

### Carlos Santos
- Especialidade: Barba e Navalhado
- Experiência: 7 anos
- Curiosidade: "Mestre em perfis modernos"

### Pedro Lima
- Especialidade: Cabelo Longo
- Experiência: 5 anos
- Curiosidade: "Especialista em tranças e modelagem"

## EXEMPLOS DE RESPOSTAS:

✅ BOA: "Somos a Barbearia do Zé! Atuamos há 15 anos e somos referência em cortes clássicos. 💪"

✅ BOA: "Nosso time tem 3 barbeiros incríveis! João (10 anos), Carlos (7 anos) e Pedro (5 anos). Todos especialistas! 💈"

❌ RUIM: Descrição muito formal ou fria
❌ RUIM: "Somos uma barbearia..."

## HISTÓRICO:
Fundada em [ANO], a [BARBEARIA] cresceu de uma cadeira de rua para um espaço moderno. Atendemos mais de [X] clientes por mês!
```

#### Exemplo de Resposta

**Cliente:** "Quem são os barbeiros?"

**Expert in Pessoal/Empresa:**
```
Temos um time incrível! 💪

🧔 **João** - Especialista em Corte Clássico (10 anos de experiência)

🧔 **Carlos** - Mestre em Barba e Navalhado (7 anos)

🧔 **Pedro** - Especialista em Cabelo Longo e Tranças (5 anos)

Todos aqui são apaixonados pelo que fazem! Quer agendar com alguém específico?
```

---

### 6. Expert in Serviços (Services)

#### Função
Informar sobre serviços disponíveis, preços e detalhes de cada um.

#### Prompt Específico

```
Você é um Especialista em Serviços da [NOME_DA_BARBEARIA].

## SUA MISSÃO:
Informar sobre serviços disponíveis, preços e detalhes.

## DIRETRIZES:
1. Apresentar tabela de preços clara
2. Descrever brevemente cada serviço
3. Destacar combos e promoções
4. Sugerir serviços quando apropriado
5. Usar emojis de serviço

## SERVIÇOS DISPONÍVEIS:

### Corte de Cabelo - R$ 35,00
- Corte de tesoura ou máquina
- Lavagem inclusa
- Finalização à escolha

### Barba - R$ 25,00
- Corte navalhado ou máquina
- Toalha quente
- Finalização

### Combo Cabelo + Barba - R$ 50,00
- Economize R$ 10,00!
- Serviço completo

### Acabamento - R$ 15,00
- Ajuste de laterais
- Nuca e orelhas limpas

### Tingimento - R$ 60,00
- Tintura profissional
- Várias opções de cor

## EXEMPLOS DE RESPOSTAS:

✅ BOA: "💈 Nossos serviços:

💇‍♂️ Corte de Cabelo - R$ 35,00
🧔 Barba - R$ 25,00
💇‍♂️+🧔 Combo Cabelo + Barba - R$ 50,00

Quer saber mais sobre algum serviço?"

✅ BOA: "O corte é R$ 35,00 e já vem com lavagem e finalização. Vamos agendar?"

❌ RUIM: Lista sem organização
❌ RUIM: Não mencionar combos

## PROMOÇÕES:
- Primeira visita: [DESCONTO]
- Indique um amigo: [DESCONTO]
```

#### Exemplo de Resposta

**Cliente:** "Quanto custa um corte?"

**Expert in Serviços:**
```
💇‍♂️ **Corte de Cabelo - R$ 35,00**

Já inclui lavagem e finalização!

Também temos:
- 🧔 Barba - R$ 25,00
- 💇‍♂️+🧔 Combo Cabelo + Barba - R$ 50,00 (economiza R$ 10!)

Quer agendar?
```

---

## Comparativo: Atual vs 6 Especialistas

| Característica | Universal (Atual) | 6 Especialistas (Proposto) |
|----------------|-------------------|----------------------------|
| **Arquitetura** | 1 agente único | 6 agentes especializados |
| **Prompt Complexo** | Prompt único grande | 6 prompts focados |
| **Flexibilidade** | Alta | Alta + Especificidade |
| **Manutenção** | Moderada | Mais fácil (especializada) |
| **Performance** | Boa | Potencialmente melhor |
| **Custo** | Menor tokens por request | Similar (bem otimizado) |
| **Debugging** | Mais difícil | Mais fácil (isolado) |
| **Personalização** | Global | Por especialista |
| **Escalabilidade** | Boa | Excelente |
| **Custo de Desenvolvimento** | ✅ Implementado | 🔜 Proposto |

### Vantagens dos 6 Especialistas

1. **Prompts Mais Focados** - Cada especialista tem um prompt otimizado para sua função
2. **Respostas Melhores** - Especialização profunda em cada área
3. **Manutenção Easier** - Problemas isolados por especialidade
4. **Testes Mais Fáceis** - Pode testar cada especialista separadamente
5. **Escalabilidade** - Pode adicionar novos especialistas facilmente
6. **Análises Melhores** - Métricas por tipo de intenção

### Desvantagens dos 6 Especialistas

1. **Maior Complexidade Inicial** - Requer implementação de roteador
2. **Análise de Intenção** - Necessária antes de selecionar especialista
3. **Mais Código** - 6 implementações de agente
4. **Latência** - Roteamento adiciona pequeno overhead

---

## Implementação Proposta

### Estrutura de Código

```
barberzap_python/
├── agents/
│   ├── __init__.py
│   ├── secretaria_universal.py          # [MANTIDO] Universal atual
│   ├── experts/
│   │   ├── __init__.py
│   │   ├── base_expert.py               # Classe base dos especialistas
│   │   ├── expert_saudacoes.py          # 1. Expert in Saudações
│   │   ├── expert_agendamento.py        # 2. Expert in Agendamento
│   │   ├── expert_duvidas.py            # 3. Expert in Tirar Dúvidas
│   │   ├── expert_localizacao.py        # 4. Expert in Onde Fica
│   │   ├── expert_pessoal.py            # 5. Expert in Pessoal/Empresa
│   │   └── expert_servicos.py           # 6. Expert in Serviços
│   └── intent_router.py                 # Roteador de intenção
│
└── integrations/
    └── ai_service.py                    # [ATUALIZADO] Suporte a múltiplos prompts
```

### Implementação do Roteador

```python
# agents/intent_router.py

from typing import Optional, Literal
import re
from enum import Enum

class ExpertType(Enum):
    """Tipos de especialistas disponíveis"""
    SAUDACOES = "saudacoes"
    AGENDAMENTO = "agendamento"
    DUVIDAS = "duvidas"
    LOCALIZACAO = "localizacao"
    PESSOAL = "pessoal"
    SERVICOS = "servicos"

class IntentRouter:
    """
    Roteador de intenção para selecionar o especialista apropriado.
    
    Analisa a mensagem do cliente e determina qual especialista
    deve responder.
    """

    # Palavras-chave por categoria
    KEYWORDS = {
        ExpertType.SAUDACOES: [
            r'^\s*(oi|olá|boa|bom|hey|fala|e aí|tudo bem|como vai)',
            r\b\bom dia\b', r'\bboa tarde\b', r'\bboa noite\b',
            r'\bblz\b', r'\bok\b', r'\boi\b'
        ],
        ExpertType.AGENDAMENTO: [
            r'\bagendar', r'\bhorário', r'\bhorai?r', r'\bmarcar',
            r'\breservar', r'\bdia', r'\bsemana', r'\bh(h|ora)',
            r'\bpr[óo]x[ia]ma?'
        ],
        ExpertType.DUVIDAS: [
            r'\bd[úu]vida', r'\bpergunta', r'\bvoc[êe]s faz',
            r'\bcomo funciona', r'\bvoc[êe]s usam',
            r'\bfunciona', r'\bpode'
        ],
        ExpertType.LOCALIZACAO: [
            r'\bonde fica', r'\bendereco', r'\blocal',
            r'\brua\b', r'\bc[óo]mo chegar', r'\bendereço',
            r'\bpraça', r'\bbairro'
        ],
        ExpertType.PESSOAL: [
            r'\bbarbeiro', r'\bbarbearia', r'\bsobre',
            r'\bquem\b', r'\bvoc[êe]s\b', r'\bequipe',
            r'\bpropriet[áa]rio', r'\bdono'
        ],
        ExpertType.SERVICOS: [
            r'\bserviço', r'\bpreço', r'\bvalor',
            r'\bquanto', r'\bcusta', r'\bpaga',
            r'\btabela', r'\bcorte\b', r'\bbarba\b'
        ]
    }

    def classify_intent(self, message: str, chat_context: Optional[dict] = None) -> ExpertType:
        """
        Classifica a intenção da mensagem e retorna o especialista.
        
        Args:
            message: Mensagem do cliente
            chat_context: Contexto da conversa (últimas mensagens)
        
        Returns:
            ExpertType: Tipo de especialista
            
        Example:
            >>> router = IntentRouter()
            >>> expert = router.classify_intent("quanto custa um corte?")
            >>> print(expert)
            ExpertType.SERVICOS
        """
        message_lower = message.lower()
        
        # Calcular score para cada categoria
        scores = {}
        for expert_type, keywords in self.KEYWORDS.items():
            score = 0
            for pattern in keywords:
                matches = re.findall(pattern, message_lower)
                score += len(matches)
            scores[expert_type] = score
        
        # Encontrar especialista com maior score
        best_expert = max(scores.items(), key=lambda x: x[1])
        
        # Se nenhum match ou score muito baixo, retornar saudações (fallback)
        if best_expert[1] == 0:
            return ExpertType.SAUDACOES
        
        # Considerar contexto da conversa
        if chat_context:
            last_expert = chat_context.get('last_expert')
            # Se a conversa está em andamento, manter o mesmo especialista
            # se fizer sentido (ex: continuar agendamento)
            if self._should_continue_expert(last_expert, message_lower):
                return last_expert
        
        return best_expert[0]
    
    def _should_continue_expert(self, current_expert: ExpertType, message: str) -> bool:
        """
        Determina se deve continuar com o mesmo especialista baseado no contexto.
        
        Args:
            current_expert: Especialista atual
            message: Nova mensagem
        
        Returns:
            True se deve continuar com mesmo especialista
        """
        continuar = {
            ExpertType.AGENDAMENTO: [r'\b(sim|ok|confirma|positivo|combinado)\b'],
            ExpertType.SERVICOS: [r'\b(e|mais|outro)\b', r'\bquais\b'],
        }
        
        if current_expert in continuar:
            for pattern in continuar[current_expert]:
                if re.search(pattern, message):
                    return True
        return False
```

### Exemplo de Uso dos Especialistas

```python
# Exemplo de como integrar os 6 especialistas

from agents.experts import (
    ExpertSaudacoes,
    ExpertAgendamento,
    ExpertDuvidas,
    ExpertLocalizacao,
    ExpertPessoal,
    ExpertServicos
)
from agents.intent_router import IntentRouter

def generate_response_with_experts(
    tenant_id: str,
    phone: str,
    message: str,
    context: dict
) -> dict:
    """
    Gera resposta usando o sistema de 6 especialistas.
    
    Fluxo:
    1. Obter histórico de chat
    2. Classificar intenção
    3. Selecionar especialista
    4. Gerar resposta
    5. Salvar resposta
    """
    
    # 1. Obter histórico
    chat_history = get_chat_history(tenant_id, phone, limit=5)
    
    # 2. Classificar intenção
    router = IntentRouter()
    intent = router.classify_intent(message, {'history': chat_history})
    
    # 3. Selecionar especialista baseado na intenção
    experts = {
        ExpertType.SAUDACOES: ExpertSaudacoes,
        ExpertType.AGENDAMENTO: ExpertAgendamento,
        ExpertType.DUVIDAS: ExpertDuvidas,
        ExpertType.LOCALIZACAO: ExpertLocalizacao,
        ExpertType.PESSOAL: ExpertPessoal,
        ExpertType.SERVICOS: ExpertServicos
    }
    
    expert_class = experts[intent]
    expert = expert_class(context)
    
    # 4. Gerar resposta
    response = expert.generate(message, chat_history)
    
    # 5. Salvar com metadados do especialista
    save_message(
        tenant_id=tenant_id,
        phone=phone,
        role='assistant',
        message=response,
        metadata={
            'expert_type': intent.value,
            'expert_name': expert.name
        }
    )
    
    return {
        'response': response,
        'expert_type': intent.value,
        'confidence': ...  # Score de confiança
    }
```

---

## Fluxo Detalhado com 6 Especialistas

### Diagrama de Sequência

```
Cliente           Router           Expert             AI Service          Cliente
   │                 │                │                   │                   │
   │ "Quero agendar"│                │                   │                   │
   ├────────────────►│                │                   │                   │
   │                 │ Classify:      │                   │                   │
   │                 │ AGENDAMENTO    │                   │                   │
   │                 ├───────────────►│                   │                   │
   │                 │                │ build_prompt()    │                   │
   │                 │                ├──────────────────►│                   │
   │                 │                │                   │ generate()        │
   │                 │                │◄──────────────────┤                   │
   │                 │                │                   │                   │
   │ "Perfeito!      │                │                   │                   │
   │  sexta às 14h"  │                │                   │                   │
   │◄────────────────┤◄───────────────┤                   │                   │
   │                 │                │                   │                   │
```

### Fluxo de Tratamento

```
┌─────────────────────────────────────────────────────────────┐
│                    MENSAGEM RECEBIDA                        │
│                   "Quero um corte"                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              1. ANALISAR HISTÓRICO                          │
│                                                              │
│   Primeira mensagem? ──SIM──► ExpertSaudacoes (boas-vindas) │
│   Continuação?      ──SIM──► Manter especialista atual     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              2. CLASSIFICAR INTENÇÃO                         │
│                                                              │
│   Palavras-chave: "corte" → SERVIÇOS                        │
│   Score: SERVIÇOS (1), AGENDAMENTO (0), ...                 │
│   Vencedor: SERVIÇOS                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              3. SELECIONAR ESPECIALISTA                      │
│                                                              │
│   ExpertServicos selecionado!                                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              4. CONSTRUIR PROMPT ESPECIALIZADO               │
│                                                              │
│   prompt = ExpertServicos.build_system_prompt(             │
│       context=barbearia_info,                               │
│       services=lista_servicos,                              │
│       promotions=promoções_atuais                           │
│   )                                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              5. GERAR RESPOSTA                              │
│                                                              │
│   response = ai_service.generate(                           │
│       prompt=message,                                       │
│       system_prompt=expert_prompt,                          │       │
│       context=contexto_barbearia                            │
│   )                                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              6. SALVAR RESPOSTA                              │
│                                                              │
│   save_message(                                             │
│       role='assistant',                                     │
│       message=response,                                     │
│       metadata={                                             │
│           expert_type='servicos',                           │
│           confidence=0.92                                   │
│       }                                                     │
│   )                                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              7. ENVIAR PARA CLIENTE                         │
│                                                              │
│   "💇‍♂️ Corte de Cabelo - R$ 35,00                          │
│    Inclui lavagem e finalização!                           │
│    Quer agendar?"                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Casos de Uso Exemplo

### Cenário 1: Fluxo Completo de Agendamento

```
Cliente: "Oi"
───────────────────────────────────────────────────
Router: SAUDACOES
Expert: ExpertSaudacoes
Resposta: "Oi João! Tudo bem? 😊 Bem-vindo à Barbearia do Zé! Como posso te ajudar hoje?"
───────────────────────────────────────────────────

Cliente: "Quero agendar um corte"
───────────────────────────────────────────────────
Router: AGENDAMENTO (mesagem: "quero agendar")
Expert: ExpertAgendamento
Resposta: "Claro! Vou te ajudar com isso. 💈

Para confirmar o agendamento:
- Serviço: Corte de cabelo
- Qual dia prefere?
- Qual horário?

Você tem preferência de barbeiro?"
───────────────────────────────────────────────────

Cliente: "Sexta às 14h"
───────────────────────────────────────────────────
Router: AGENDAMENTO (continuando)
Expert: ExpertAgendamento
Resposta: "Perfeito! Anotado aqui:

✅ Corte de cabelo
📅 Sexta-feira
🕐 14h

Qual barbeiro você prefere? Temos disponível o João, Carlos e Pedro."
───────────────────────────────────────────────────

Cliente: "Com o João"
───────────────────────────────────────────────────
Router: AGENDAMENTO (continuando)
Expert: ExpertAgendamento
Resposta: "Entendi! Vou confirmar tudo:

💇‍♂️ Corte de cabelo
🧔 Com João
📅 Sexta-feira
🕐 14h

Pode confirmar? 📋"
───────────────────────────────────────────────────

Cliente: "Pode confirmar!"
───────────────────────────────────────────────────
Router: AGENDAMENTO (continuando)
Expert: ExpertAgendamento
Resposta: "Confirmado! ✅

Seu corte com João está agendado para sexta às 14h.

Te aguardamos lá! 💈👋"
───────────────────────────────────────────────────
```

### Cenário 2: Cliente com Dúvidas

```
Cliente: "Quanto custa um corte?"
───────────────────────────────────────────────────
Router: SERVIÇOS (palavras: "quanto", "custa", "corte")
Expert: ExpertServicos
Resposta: "💇‍♂️ Corte de Cabelo - R$ 35,00

Já inclui lavagem e finalização!

Também temos:
- 🧔 Barba - R$ 25,00
- 💇‍♂️+🧔 Combo Cabelo + Barba - R$ 50,00 (economiza R$ 10!)

Quer agendar?"
───────────────────────────────────────────────────

Cliente: "Vocês aceitam cartão?"
───────────────────────────────────────────────────
Router: DÚVIDAS (palavra: "aceitam")
Expert: ExpertDuvidas
Resposta: "Sim! Aceitamos cartão de crédito, débito e PIX. 💳

Parcelamos em até 3x no cartão.

Mais alguma dúvida?"
───────────────────────────────────────────────────

Cliente: "Onde fica?"
───────────────────────────────────────────────────
Router: LOCALIZAÇÃO (palavra: "onde")
Expert: ExpertLocalizacao
Resposta: "📍 Estamos na Rua das Flores, 123, Centro.

Fica perto da praça principal, do lado da padaria Seu João.

Quer que eu te mande a localização no Google Maps? 👆"
───────────────────────────────────────────────────
```

---

## Métricas e Analytics

### Métricas por Especialista

| Métrica | Descrição | Como Medir |
|---------|-----------|------------|
| **Volume por Tipo** | Quantas mensagens cada especialista responde | Count de `metadata.expert_type` |
| **Taxa de Conversão** | Conversões por tipo de interação | Agendamentos / Mensagens de Agendamento |
| **Confiança Média** | Score médio de confiança da classificação | Avg de `confidence` score |
| **Tempo de Resposta** | Latência por tipo de especialista | Avg processing time por expert |
| **Satisfação** | Feedback do cliente por tipo | Post-agend: "Útil?" rating |

### Dashboard Proposto

```
┌─────────────────────────────────────────────────────────────┐
│              DASHBOARD - SECRETARIA BARBERZAP               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 MENSAGENS POR ESPECIALISTA (últimos 7 dias)              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Saudações     ████████████████████  156 (15%)     │   │
│  │  Agendamento   ████████████████████████  234 (23%) │   │
│  │  Dúvidas       ████████████████████████  212 (21%) │   │
│  │  Localização   ████████████  87 (9%)              │   │
│  │  Pessoal       ████████████████  134 (13%)        │   │
│  │  Serviços      ████████████████████  187 (18%)    │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  📈 CONVERSÕES POR DIA                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │                      /│ 180                         │   │
│  │                    /  │                             │   │
│  │            ─────/    │ 140                         │   │
│  │          /           │                             │   │
│  │      /─/             │ 100                         │   │
│  │      /               │                             │   │
│  │    /                 │  60                         │   │
│  │  /                   │                             │   │
│  │______________________│  20                         │   │
│  │ Seg Ter Qua Qui Sex Sab Dom                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  🎯 TAXA DE CONVERSÃO                                        │
│  • Agendamento: 67% → Confirmados                           │
│  • Serviços: 45% → Para Agendamento                         │
│  • Dúvidas: 38% → Continuação                               │
│                                                              │
│  ⏱️ TEMPO MÉDIO DE RESPOSTA                                 │
│  • Saudações: 1.2s                                          │
│  • Agendamento: 2.3s                                        │
│  • Dúvidas: 1.8s                                            │
│  • Localização: 1.5s                                        │
│  • Pessoal: 1.9s                                            │
│  • Serviços: 1.7s                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Considerações Finais

### Estado Atual (Fase 1)

O BarberZap atual possui uma **Secretária Universal** implementada que:

- ✅ Funciona bem para casos gerais
- ✅ Tem prompts flexíveis
- ✅ Usa memória de chat
- ✅ Integra com Evolution API, Supabase e AI
- ✅ Suporta multi-tenancy
- ✅ Está em produção

### Próximos Passos (Fase 2 - Implementação dos 6 Especialistas)

Para implementar o sistema de 6 especialistas:

1. **Criar módulo de especialistas** (`agents/experts/`)
2. **Implementar roteador de intenção** (`IntentRouter`)
3. **Criar prompts especializados** (6 prompts)
4. **Adicionar métricas por especialista**
5. **Testar A/B** (Universal vs Especialistas)
6. **Analisar resultados** e fazer ajustes

### Recomendação

**Fase Intermediária:** Começar com hibrido - roteador que seleciona entre Secretária Universal (para casos gerais) e especialistas específicos (para casos bem definidos).

Isso permite:
- Benefícios dos especialistas onde mais importam
- Flexibilidade da Secretária Universal como fallback
- Implementação gradual e testes A/B

---

## Referências

### Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `agents/secretaria_universal.py` | Implementação atual (Universal) |
| `integrations/ai_service.py` | Wrapper para AI |
| `integrations/postgres_memory.py` | Memória de chat |
| `core/context_builder.py` | Builder de contexto |
| `core/tenant_resolver.py` | Resolução de tenant |
| `webhooks/webhook_handler.py` | Handler principal |
| `crm/crm_manager.py` | CRM e logging |

### Documentação

- `agents/README_secretaria_universal.md` - Documentação da Secretária Universal
- `docs/README.md` - Documentação principal
- `docs/API_REFERENCE.md` - Referência da API
- `docs/INTEGRATION.md` - Integrações

---

## Notas para Notebook LM

Este documento foi criado para servir como **conteúdo completo** para **Notebook LM** com:

1. ✅ **Análise completa** do sistema atual
2. ✅ **Documentação dos 6 especialistas** com prompts detalhados
3. ✅ **Fluxo de roteamento multiagente** explicado
4. ✅ **Memória do sistema** documentada
5. ✅ **Integrações** listadas e descritas
6. ✅ **Exemplos práticos** de conversas
7. ✅ **Implementação proposta** com código
8. ✅ **Métricas e analytics** planejados

---

**Versão do Documento:** 1.0
**Data de Criação:** 2026-02-26
**Autor:** BarberZap Team
**Status:** ✅ Completo para Notebook LM