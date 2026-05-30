# README - Testes de Integração BarberZap

## Visão Geral

Esta pasta contém os testes de integração do sistema BarberZap. O arquivo principal é `test_integration.py`, que valida o fluxo completo do webhook até a resposta.

## Arquivos

- **`test_integration.py`**: Suíte principal de testes de integração
- **`TEST_INTEGRATION_SUMMARY.md`**: Resumo do fluxo validado
- **`README_INTEGRATION.md`**: Este arquivo

## Estrutura dos Testes

### Testes Individuais (1-6)

Testes que validam cada componente individualmente:

1. **Normalizer**: Valida extração de dados do webhook
2. **Tenant Resolution**: Valida resolução de tenant
3. **Context Builder**: Valida construção de contexto
4. **AI Response Generation**: Valida geração de resposta IA
5. **CRM Logging**: Valida operações de CRM
6. **Evolution API**: Valida wrapper Evolution API

### Teste Completo (7)

**`test_complete_flow_new_lead`**: Valida o fluxo end-to-end:

```
Webhook → Normalizer → Tenant Resolution → Context Builder
→ IA Response → CRM Logger → Evolution API
```

## Dependências Mockadas

Os testes usam mocks para simular dependências externas:

- **Supabase**: Tenant resolution, Context builder, CRM
- **PostgreSQL**: Histórico de chat
- **AI Service**: Geração de resposta
- **Evolution API**: Envio de mensagens

## Fixtures Principais

### webhook_payload
Payload Evolution API simulado:

```json
{
  "event": "messages.upsert",
  "instance": {
    "instanceName": "barbearia_001"
  },
  "data": [{
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net"
    },
    "message": {
      "conversation": "Olá, quero agendar um corte..."
    },
    "pushName": "João Silva"
  }]
}
```

### expected_tenant_data
Dados do tenant do Supabase:

```json
{
  "id": 1,
  "instance_name": "barbearia_001",
  "user_id": "tenant_user_123",
  "status": "active"
}
```

### expected_agente_config
Configuração da barbearia:

```json
{
  "user_id": "tenant_user_123",
  "name": "Barbearia Central",
  "ai_name": "Ana",
  "hours": "Seg-Sex: 09:00-19:00"
}
```

### expected_ai_response
Resposta da IA simulada:

```json
{
  "success": true,
  "response": "Claro, João! Vou anotar...",
  "tokens_used": 87,
  "tenant_id": "tenant_user_123"
}
```

## Execução

### Todos os Testes
```bash
python3 -m pytest tests/test_integration.py -v -m integration
```

### Apenas Fluxo Completo
```bash
python3 -m pytest tests/test_integration.py::TestBarberZapIntegrationFlow::test_complete_flow_new_lead -v -s
```

### Com Detalhes
```bash
python3 -m pytest tests/test_integration.py -v -s --tb=short
```

### Apenas Teste Específico
```bash
# Teste 1: Normalizer
python3 -m pytest tests/test_integration.py::TestBarberZapIntegrationFlow::test_normalizer_step -v

# Teste 2: Tenant Resolution
python3 -m pytest tests/test_integration.py::TestBarberZapIntegrationFlow::test_normalizer_and_tenant_resolution -v

# Teste 3: Context Builder
python3 -m pytest tests/test_integration.py::TestBarberZapIntegrationFlow::test_context_builder -v

# Teste 4: AI Response
python3 -m pytest tests/test_integration.py::TestBarberZapIntegrationFlow::test_ai_response_generation -v

# Teste 5: CRM Logging
python3 -m pytest tests/test_integration.py::TestBarberZapIntegrationFlow::test_crm_logging -v

# Teste 6: Evolution API
python3 -m pytest tests/test_integration.py::TestBarberZapIntegrationFlow::test_evolution_api_send_message -v

# Teste 7: Fluxo Completo
python3 -m pytest tests/test_integration.py::TestBarberZapIntegrationFlow::test_complete_flow_new_lead -v
```

## Saída Esperada

### Sucesso Completo
```
================================================================================
FINAL VALIDATION ✅
================================================================================
✅ All layers connected correctly!
✅ Tenant resolution works!
✅ Context builder returns correct data!
✅ IA response generated successfully!
✅ CRM logs saved correctly!
✅ Evolution API send_message called successfully!

🎉 COMPLETE FLOW VALIDATED SUCCESSFULLY! 🎉
PASSED
```

### Sumário Final
```
======================== 7 passed, 10 warnings ========================
```

## Solução de Problemas

### Erro: Tenant ID None
**Problema**: Mock do Supabase não aplicado corretamente
**Solução**: Verifique se o patch está no local correto:
```python
with patch('core.tenant_resolver.get_client', mock_supabase):
```

### Erro: 'bool' object has no attribute 'get'
**Problema**: Mock do save_message retorna True em vez de dict
**Solução**: Retornar dict sempre:
```python
mock_save.return_value = {'success': True}
```

### Erro: log_message() got an unexpected keyword argument 'content'
**Problema**: Usando parâmetro errado
**Solução**: Usar `message=""`, não `content=""`
```python
log_message(
    lead_id=1,
    user_id='user_123',
    phone='5511999999999',
    direction='inbound',
    message='Texto da mensagem'  # ← Use 'message', não 'content'
)
```

## Marcos (Milestones)

- ✅ **FASE 7b**: Teste de integração completo implementado
- ✅ Todos os 7 testes passando
- ✅ Fluxo end-to-end validado
- ✅ Documentação completa criada

## Próximos Passos

1. Executar testes regularmente (CI/CD)
2. Adicionar testes de cenários adicionais:
   - Lead existente (update)
   - Mensagens com barbeiro específico
   - Tratamento de erros
   - Timeout de API
3. Integração com ambiente de staging real
4. Testes de performance/carga

## Suporte

Para dúvidas sobre os testes, consulte:
- Documentação do projeto
- Equipe de desenvolvimento
- Logs detalhados com `-s`

---

**Status**: ✅ Todos os testes passando
**Última Atualização**: 2026-02-23
**Versão**: FASE 7b
