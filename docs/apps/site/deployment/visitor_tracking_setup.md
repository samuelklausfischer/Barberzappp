# Sistema de Tracking de Visitantes

## Visão Geral

Sistema completo de análise de visitantes que coleta dados de acesso, informações técnicas e comportamentais de forma não-intrusiva e segura.

## Componentes

### 1. Frontend (JavaScript)
- **Arquivo**: `visitor-tracker.js`
- **Função**: Coleta dados dos visitantes e envia para o webhook
- **Características**:
  - Script não-intrusivo (async loading)
  - Detecção automática de navegador, dispositivo e localização
  - Gestão de sessões com timeout de 30 minutos
  - Buffer de eventos com retry automático
  - Suporte a HTTPS e autenticação via token

### 2. Backend (Python/FastAPI)
- **Arquivo**: `visitor_webhook.py`
- **Função**: Recebe, valida e armazena dados dos visitantes
- **Endpoints**:
  - `POST /api/visitor-webhook` - Recebe dados de visitantes
  - `GET /api/visitor-stats` - Retorna estatísticas
  - `GET /api/visitor-recent` - Lista visitantes recentes
  - `GET /api/health` - Health check do serviço

### 3. Banco de Dados (Supabase/PostgreSQL)
- **Arquivo**: `supabase_visitors_schema.sql`
- **Tabelas principais**:
  - `visitors` - Registros principais de visitantes
  - `visitor_stats` - Estatísticas agregadas
  - `active_sessions` - Sessões ativas
  - `page_events` - Eventos detalhados de página

## Instalação e Configuração

### 1. Configurar o Banco de Dados

```bash
# Execute o schema SQL no seu Supabase
psql -h seu-host.supabase.co -U postgres -d postgres -f supabase_visitors_schema.sql
```

### 2. Configurar o Backend

```bash
# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Executar o servidor

```bash
# Desenvolvimento
python visitor_webhook.py

# Produção com Gunicorn
gunicorn visitor_webhook:app -w 4 -k uvicorn.workers.UvicornWorker
```

### 4. Integrar no Frontend

```html
<!-- Adicione ao seu site -->
<script src="visitor-tracker.js" async></script>
```

Ou configure manualmente:

```javascript
// Configure o endpoint e token antes de carregar o script
window.VISITOR_TRACKER_CONFIG = {
    WEBHOOK_URL: 'https://seu-dominio.com/api/visitor-webhook',
    WEBHOOK_AUTH_TOKEN: 'seu-token-secreto'
};
```

## Dados Coletados

### Informações de Acesso
- Horário exato de entrada (timestamp)
- Data completa do acesso
- Duração da sessão
- Número de visualizações de página
- URL atual e referrer

### Informações Técnicas
- Endereço IP do visitante
- Localização geográfica aproximada (país, cidade, região)
- Navegador e versão
- Dispositivo (Desktop, Mobile, Tablet)
- Sistema operacional
- Resolução de tela
- Idioma do navegador
- Fuso horário

### Dados Adicionais
- Status de JavaScript habilitado
- Cookies habilitados
- Status online/offline
- ID único do visitante (persistente via localStorage)
- ID da sessão (gerado automaticamente)

## Segurança

### Autenticação
- Token Bearer obrigatório para todas as requisições
- Validação de IP e User Agent
- Sanitização de dados de entrada

### Privacidade
- IPs são armazenados para geolocalização apenas
- Nenhum dado pessoal identificável é coletado
- Conforme com LGPD/GDPR (coleta mínima de dados)

### Performance
- Script leve (~15KB minificado)
- Envio assíncrono não bloqueante
- Buffer de eventos para evitar perda de dados
- Retry automático com backoff exponencial

## Monitoramento

### Health Check
```bash
curl https://seu-dominio.com/api/health
```

### Estatísticas
```bash
# Obter estatísticas básicas
curl -H "Authorization: Bearer seu-token" \
     https://seu-dominio.com/api/visitor-stats

# Obter visitantes recentes
curl -H "Authorization: Bearer seu-token" \
     https://seu-dominio.com/api/visitor-recent?limit=20
```

## Views de Análise

O sistema cria automaticamente views úteis para análise:

- `daily_visitors` - Visitantes únicos por dia
- `country_stats` - Estatísticas por país
- `device_stats` - Estatísticas por dispositivo
- `browser_stats` - Estatísticas por navegador
- `recent_sessions` - Sessões recentes

## Personalização

### Ajustar Timeout de Sessão
```javascript
// No visitor-tracker.js
SESSION_TIMEOUT: 60 * 60 * 1000 // 60 minutos
```

### Adicionar Eventos Customizados
```javascript
// Após o script carregar
VisitorTracker.trackEvent('custom_event', {
    category: 'video',
    action: 'play',
    label: 'homepage_video'
});
```

### Modificar Frequência de Envio
```javascript
// No visitor-tracker.js
SEND_INTERVAL: 5000 // 5 segundos
```

## Solução de Problemas

### Script não carrega
- Verifique se o arquivo está acessível
- Confirme HTTPS no webhook
- Verifique CORS se necessário

### Dados não chegam
- Verifique logs do backend
- Confirme token de autenticação
- Teste conectividade com health check

### Performance lenta
- Ajuste intervalo de envio
- Implemente rate limiting
- Considere CDN para o script

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do backend
2. Teste o health check
3. Confirme configurações de ambiente
4. Verifique conectividade com Supabase