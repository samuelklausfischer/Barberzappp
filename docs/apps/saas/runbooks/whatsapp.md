# 📱 RUNBOOK: WhatsApp

## 📋 Visão Geral

Este runbook cobre a integração WhatsApp do BarberZap Pro, incluindo configuração, troubleshooting e monitoramento.

**Status Atual**: Em desenvolvimento (componente UI existe, integração real futura)

---

## 🎯 O que este runbook cobre

- Configuração do WhatsApp
- Fluxo de autenticação via QR Code
- Envio de mensagens automáticas
- Troubleshooting de problemas
- Monitoramento de status

---

## 🔧 Configuração

### Pré-requisitos

1. **Número de WhatsApp Business**
   - Ativar WhatsApp Business no celular
   - Verificar o número

2. **WhatsApp Business API** (Futuro)
   - Criar conta no [WhatsApp Business Platform](https://business.facebook.com/)
   - Obter API Key e credentials
   - Configurar webhook

3. **Variáveis de Ambiente** (Futuro)
   ```bash
   # .env.local
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_ACCESS_TOKEN=your_access_token
   WHATSAPP_WEBHOOK_URL=your_webhook_url
   WHATSAPP_VERIFY_TOKEN=your_verify_token
   ```

---

## 🔄 Fluxo de Autenticação

### 1. Conexão via QR Code (Atual - Mock)

```
Dashboard
  ↓
"WhatsApp Desconectado" alert
  ↓
Navegar para página WhatsApp
  ↓
Gerar QR Code (mock)
  ↓
Escaneiar com celular
  ↓
"Conectado" (mock)
```

### 2. Conexão via WhatsApp Business API (Futuro)

```
Dashboard
  ↓
Configurar WhatsApp credentials
  ↓
Inicializar SDK/API client
  ↓
Verificar número
  ↓
Webhook configurado
  ↓
Pronto para envio de mensagens
```

---

## 📨 Envio de Mensagens Automáticas

### Fluxo Atual (Mock)

Apenas UI implementada, sem envio real.

### Fluxo Futuro

```
Agendamento criado/confirmado
  ↓
Trigger: appointment.created
  ↓
Service: WhatsAppService.sendMessage()
  ↓
API Call: POST /messages
  ↓
WhatsApp Business API
  ↓
Mensagem enviada ao cliente
  ↓
Status atualizado no sistema
```

### Tipos de Mensagens

1. **Confirmação de Agendamento**
   ```
   Olá [Nome]! Seu agendamento para [Serviço] às [Horário] foi confirmado. 📅✂️
   ```

2. **Lembrete (24h antes)**
   ```
   Lembrete: Você tem um corte marcado amanhã às [Horário]. Até lá! 👋
   ```

3. **Cancelamento**
   ```
   Seu agendamento foi cancelado. Para reagendar, entre em contato. 🙏
   ```

---

## 🚨 Troubleshooting

### Problema 1: QR Code não aparece

**Sintoma**: Página de WhatsApp mostra loading mas QR não aparece

**Debugar**:
```typescript
// Verificar logs no console
console.log('[WhatsApp] Generating QR Code...');

// Verificar se há erro no componente
// src/components/whatsapp/WhatsAppConnect.tsx
```

**Possíveis causas**:
- Estado não atualizado
- API error (se implementado)
- Network issue

**Solução**:
1. Verificar console para erros
2. Reiniciar componente
3. Verificar network tab

---

### Problema 2: QR Code não scaneia

**Sintoma**: QR Code aparece mas celular não consegue escanear

**Debugar**:
- Verificar se imagem está carregada
- Verificar tamanho da imagem
- Verificar contraste

**Possíveis causas**:
- Imagem muito pequena
- Imagem borrada
- Contraste baixo

**Solução**:
1. Aumentar tamanho do QR (mínimo 300x300px)
2. Verificar qualidade da imagem
3. Regenerar QR

---

### Problema 3: Mensagens não são enviadas

**Sintoma**: Agendamento criado mas cliente não recebe mensagem

**Debugar**:
```typescript
// Verificar logs de envio
console.log('[WhatsApp] Sending message to:', phoneNumber);
console.log('[WhatsApp] Message:', message);
console.log('[WhatsApp] Response:', response);

// Verificar Network tab
// Filtre por requests de WhatsApp API
```

**Possíveis causas**:
- API Key inválida
- Número não verificado
- Limite de mensagens excedido
- Webhook não configurado
- Network issue

**Solução**:
1. Verificar credentials em .env
2. Verificar número no WhatsApp Business dashboard
3. Verificar se há rate limiting
4. Verificar webhook
5. Verificar network connectivity

---

### Problema 4: Status não atualiza

**Sintoma**: WhatsApp aparece "desconectado" mas deveria estar "conectado"

**Debugar**:
```typescript
// Verificar se estado está sendo atualizado
console.log('[WhatsApp] Connection status:', isConnected);

// Verificar se há polling/check de status
console.log('[WhatsApp] Last check:', lastCheck);
```

**Possíveis causas**:
- Estado não atualizado
- Polling parado
- API retornando erro

**Solução**:
1. Verificar se useEffect está rodando
2. Verificar polling interval
3. Verificar API response

---

### Problema 5: Mensagens duplicadas

**Sintoma**: Cliente recebe mesma mensagem múltiplas vezes

**Debugar**:
```typescript
// Verificar se há múltiplos triggers
console.log('[WhatsApp] Trigger count:', triggerCount);

// Verificar se há debounce/throttle
console.log('[WhatsApp] Last sent:', lastSentTime);
```

**Possíveis causas**:
- Múltiplos triggers
- Sem debouncing
- Race condition

**Solução**:
1. Adicionar debouncing
2. Verificar se há múltiplos listeners
3. Adicionar lock/mutex

---

## 📊 Monitoramento

### Métricas Importantes

| Métrica | Descrição | Como Monitorar |
|---------|-----------|----------------|
| **Status da conexão** | Conectado/Desconectado | Dashboard |
| **Mensagens enviadas** | Total por dia | Logs |
| **Taxa de entrega** | % de mensagens entregues | API logs |
| **Taxa de erro** | % de mensagens com erro | Logs |
| **Latência** | Tempo de envio | Logs |

### Logs Importantes

```typescript
// Logs de conexão
[WhatsApp] Connecting...
[WhatsApp] Connected successfully
[WhatsApp] Disconnected

// Logs de mensagens
[WhatsApp] Sending message to +5511999999999
[WhatsApp] Message sent: ID123456
[WhatsApp] Delivery confirmed: ID123456

// Logs de erro
[WhatsApp] Error: Invalid API key
[WhatsApp] Error: Rate limit exceeded
[WhatsApp] Error: Network timeout
```

### Dashboard de Status

Monitorar:
- ✅ Conexão está ativa
- ✅ Última mensagem enviada
- ✅ Taxa de sucesso nas últimas 24h
- ✅ Erros nas últimas 24h

---

## 🧪 Testar Local

### 1. Simular Conexão

No componente `WhatsAppConnect.tsx`:
```typescript
// Botão "Simular Leitura (Debug)"
onClick={() => setStep(3)} // Pula direto para "Conectado"
```

### 2. Simular Envio de Mensagem

```typescript
// Mock send
const mockSendMessage = async (phone: string, message: string) => {
  console.log('[WhatsApp Mock] Sending to:', phone);
  console.log('[WhatsApp Mock] Message:', message);
  await delay(1000);
  console.log('[WhatsApp Mock] Sent successfully');
}
```

### 3. Testar Webhook (Futuro)

```bash
# Usar ngrok para expor localhost
ngrok http 3000

# Testar webhook
curl -X POST https://your-ngrok-url/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 🚨 Simular Erro

### 1. Simular Falha de Conexão

```typescript
// Mock connection failure
const mockConnect = async () => {
  console.log('[WhatsApp] Connecting...');
  await delay(2000);
  throw new Error('Connection timeout');
}
```

### 2. Simular Falha de Envio

```typescript
// Mock send failure
const mockSend = async () => {
  console.log('[WhatsApp] Sending...');
  await delay(1000);
  throw new Error('API rate limit exceeded');
}
```

### 3. Simular Timeout

```typescript
// Mock timeout
const mockSend = async () => {
  await new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 30000)
  );
}
```

---

## 📚 Recursos

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business Platform](https://business.facebook.com/whatsapp/)

---

## ✅ Checklist de Troubleshooting

Quando WhatsApp não funcionar:

- [ ] Verificar status da conexão no Dashboard
- [ ] Verificar console para erros
- [ ] Verificar Network tab para requests
- [ ] Verificar API credentials
- [ ] Verificar se número está verificado
- [ ] Verificar se há rate limiting
- [ ] Verificar webhook configurado
- [ ] Verificar logs do servidor
- [ ] Verificar variáveis de ambiente
- [ ] Testar com número diferente

---

**Última atualização**: 2026-03-03
**Status**: Em desenvolvimento
**Responsável**: Dev Sênior
