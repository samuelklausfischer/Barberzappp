# BarberZap - Integrações

Este diretório contém os wrappers e clientes para serviços externos.

## Supabase REST API Wrapper (`supabase_rest.py`)

Wrapper robusto para interação com Supabase via REST API.

### Instalação

As dependências já estão incluídas no `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Configuração

O wrapper obtém as credenciais de três fontes (em ordem de prioridade):

1. **Parâmetros passados ao inicializar o cliente**
2. **Variáveis de ambiente** (`.env`):
   ```env
   SUPABASE_URL=https://htssqiupscyhhueqwpgu.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
   ```

3. **Valores padrão** (já configurados para BarberZap)

### Tabelas Disponíveis

| Tabela | Descrição |
|--------|-----------|
| `whatsapp_instances` | Instâncias WhatsApp (instance_name → user_id) |
| `agente_config` | Configurações da barbearia |
| `barbers` | Barbeiros ativos |
| `services` | Serviços e preços |
| `crm_leads` | Leads do CRM |
| `crm_messages` | Mensagens do CRM |

### Uso Básico

#### 1. Importar e criar cliente

```python
from integrations.supabase_rest import SupabaseRestClient

# Usar valores padrão (.env)
client = SupabaseRestClient()

# Ou passar credenciais manualmente
client = SupabaseRestClient(
    url='https://htssqiupscyhhueqwpgu.supabase.co',
    service_role_key='seu_service_role_key'
)
```

#### 2. GET - Buscar registros

```python
# Buscar todos os barbeiros
barbers = client.get('barbers')

# Buscar com filtros
active_barbers = client.get('barbers', {'active': 'true'})

# Buscar único registro
config = client.get('agente_config', {'user_id': 'eq.1'}, single=True)

# Buscar com ordenação e limite
recent_leads = client.get('crm_leads', {
    'order': 'created_at.desc',
    'limit': '10'
})

# Buscar colunas específicas
services = client.get('services', {
    'select': 'id,name,price'
})
```

#### 3. POST - Inserir registros

```python
# Inserir único registro
new_lead = client.post('crm_leads', {
    'name': 'João Silva',
    'phone': '5511999999999',
    'status': 'new'
})
print(f"Lead criado com ID: {new_lead['id']}")

# Inserir múltiplos registros
messages = client.post('crm_messages', [
    {'lead_id': 1, 'message': 'Olá!'},
    {'lead_id': 2, 'message': 'Bem-vindo!'}
])
```

#### 4. PATCH - Atualizar registros

```python
# Atualizar por ID
updated = client.patch('barbers', 1, {
    'active': False,
    'name': 'Novo Nome'
})

# Atualizar com outra coluna como ID
updated = client.patch('whatsapp_instances', 'inst_001', {
    'status': 'connected'
}, id_column='instance_name')
```

#### 5. DELETE - Deletar registros

```python
# Deletar por ID
success = client.delete('crm_leads', 1)

# Deletar com outra coluna como ID
success = client.delete('whatsapp_instances', 'inst_001',
                       id_column='instance_name')
```

#### 6. UPSERT - Insert ou Update

```python
# Atualiza se existe, insere se não existe
config = client.upsert(
    'agente_config',
    {'user_id': 'eq.123'},  # Filtros para buscar existente
    {
        'user_id': 123,
        'barber_name': 'Barbearia Exemplo',
        'address': 'Rua 123'
    },
    id_column='user_id'
)
```

### Operadores de Filtro

| Operador | Sintaxe | Exemplo |
|----------|---------|---------|
| Igual | `col=value` ou `col=eq.value` | `{'active': 'true'}` |
| Diferente | `col=neq.value` | `{'status': 'neq.deleted'}` |
| Maior que | `col=gt.value` | `{'price': 'gt.50'}` |
| Maior ou igual | `col=gte.value` | `{'price': 'gte.30'}` |
| Menor que | `col=lt.value` | `{'price': 'lt.100'}` |
| Menor ou igual | `col=lte.value` | `{'price': 'lte.90'}` |
| LIKE | `col=like.value` | `{'name': 'like.%João%'} ` |
| ILIKE (case-insensitive) | `col=ilike.value` | `{'name': 'ilike.%joão%'} ` |
| IS | `col=is.value` | `{'active': 'is.true'}` |
| IN | `col=in.(val1,val2)` | `{'status': 'in.(new,contacted)'} ` |

### Funções de Atalho

Para uso rápido sem instanciar cliente:

```python
from integrations.supabase_rest import (
    supabase_get,
    supabase_post,
    supabase_patch,
    supabase_delete,
    supabase_upsert
)

# Usa cliente global padrão
barbers = supabase_get('barbers', {'active': 'true'})
```

### Funções Utilitárias

```python
# Verificar se registro existe
exists = client.exists('barbers', {'id': 'eq.1'})

# Contar registros
count = client.count('crm_leads', {'status': 'eq.new'})

# Obter metadados da tabela
info = client.table_info('services')
print(info['columns'])
```

### Operações em Lote

```python
operations = [
    {'method': 'get', 'table': 'barbers', 'filters': {'active': 'true'}},
    {'method': 'post', 'table': 'crm_leads', 'data': {...}},
    {'method': 'patch', 'table': 'barbers', 'id': 1, 'data': {...}}
]

results = client.batch操作(operations)
```

### Context Manager

```python
with SupabaseRestClient() as client:
    barbers = client.get('barbers')
    # Conexão fechada automaticamente
```

### Tratamento de Erros

```python
from integrations.supabase_rest import (
    SupabaseError,
    SupabaseConnectionError,
    SupabaseResponseError,
    SupabaseValidationError
)

try:
    client.post('crm_leads', {...})
except SupabaseValidationError as e:
    print(f"Erro de validação: {e}")
except SupabaseConnectionError as e:
    print(f"Erro de conexão: {e}")
except SupabaseResponseError as e:
    print(f"Erro na API: {e}")
except SupabaseError as e:
    print(f"Erro geral: {e}")
```

### Exemplos Práticos

#### Exemplo 1: Criar e Atualizar Lead

```python
# Criar lead
lead = client.post('crm_leads', {
    'name': 'Maria Silva',
    'phone': '5511999998888',
    'status': 'new',
    'source': 'whatsapp'
})

# Atualizar status
updated = client.patch('crm_leads', lead['id'], {
    'status': 'contacted',
    'contacted_at': 'now()'
})
```

#### Exemplo 2: Gerenciar Instância WhatsApp

```python
# Upsert instância (cria ou atualiza)
instance = client.upsert(
    'whatsapp_instances',
    {'instance_name': 'eq.barber_principal'},
    {
        'instance_name': 'barber_principal',
        'user_id': 1,
        'status': 'connected',
        'phone_number': '5511999999999'
    },
    id_column='instance_name'
)
```

#### Exemplo 3: Listar Serviços Ativos

```python
services = client.get('services', {
    'active': 'true',
    'order': 'name.asc'
})

for service in services:
    print(f"{service['name']}: R$ {service['price']}")
```

### Demo Completo

Execute o arquivo de demonstração:

```bash
python integrations/supabase_rest_demo.py
```

### Referências

- [Supabase REST API Docs](https://supabase.com/docs/guides/api)
- [Supabase Python Client](https://supabase.com/docs/reference/python)

### Testes de Conexão

```python
from integrations.supabase_rest import get_client

client = get_client()

# Testar conexão
try:
    result = client.get('barbers', {'limit': '1'})
    print(f"✓ Conectado! {len(result)} barbeiro(s)")
except Exception as e:
    print(f"✗ Erro de conexão: {e}")
```

### Tips

1. **Use `single=True`** quando espera apenas um registro
2. **Use `select`** para buscar apenas colunas necessárias (melhora performance)
3. **Use `order`** e `limit`** para paginação
4. **Use `upsert`** para garantir unicidade de registros
5. **Use Context Manager** para gestão automática de recursos
6. **Sempre trate exceções** em produção
