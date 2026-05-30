# CONTEXTO DE GROWTH & CONVERSÃO - BARBERZAP

## 📌 Visão Geral do Projeto
- **Nome:** Barberzap
- **Modelo:** Micro SaaS de Chatbot/Agendamento Multi-tenant para Barbearias.
- **Stack:** React (Frontend), Supabase (DB/Auth), n8n (Orquestração), Evolution API (WhatsApp).
- **Status Atual:** Campanha de tráfego iniciada (Meta Ads), alto interesse, zero conversões.

## 📊 Diagnóstico do Funil (Dados Reais - 18/01/2026)
| Etapa | Quantidade | Taxa de Conv. | Status |
| :--- | :--- | :--- | :--- |
| **Visitantes** | 340 | 100% | OK (CPA R$ 0,33) |
| **Scroll 50%** | 189 | 55.6% | ✅ Bom engajamento |
| **Viram Preço** | 116 | 34.1% | ✅ Oferta atraente |
| **Clique Checkout** | 73 | 21.5% | 🔥 Intenção ALTÍSSIMA |
| **Vendas** | 0 | 0% | ❌ CRÍTICO |

**Investimento:** R$ 112,00 | **Vendas:** 0 | **ROI:** -100%

## 🚨 O PROBLEMA "MATADOR" (Identificado)
O link de checkout atual (`https://pay.cakto.com.br/psc74bb_701168`) está configurado com o preço de **R$ 0,99**, enquanto a Landing Page anuncia **R$ 49,90**.
- **Impacto:** O usuário sente que há um erro, uma "pegadinha" ou falta de profissionalismo e abandona a compra por desconfiança.

## 🛠️ Plano de Ação Imediato

### 1. Correção Técnica (Prioridade 0)
- Ajustar o preço no Cakto para R$ 49,90 ou trocar o link no `App.jsx` (linha 881).
- Validar se o checkout abre corretamente e processa o pagamento.

### 2. Otimização de Oferta (Prioridade 1)
- **Trocar "7 Dias de Garantia" por "Teste Grátis de 7 Dias":** Reduzir a barreira de entrada (o barbeiro testa antes de pagar).
- **Checkout Interno/Simplificado:** Evitar a saída para o Cakto se possível, ou usar um checkout que peça apenas Nome, WhatsApp e E-mail antes do pagamento.

### 3. Prova Social e Autoridade
- Substituir depoimentos genéricos por prints reais de conversas no WhatsApp.
- Adicionar vídeo curto (VSL) mostrando a IA agendando um cliente em tempo real.

## 📝 Instruções para o Gemini
Ao ler este arquivo, o Gemini deve focar em:
1. Auxiliar na alteração do código React para implementar o modelo de "Teste Grátis".
2. Melhorar a copy da Landing Page focando em conversão imediata.
3. Sugerir melhorias no fluxo de integração com o n8n para que, assim que o cliente inicie o teste, a instância seja criada automaticamente.

---
*Arquivo gerado em 18 de janeiro de 2026 para consolidação de estratégia de Growth.*
