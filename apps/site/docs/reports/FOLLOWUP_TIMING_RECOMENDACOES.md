# ⏱️ BarberZap - Timing de Follow-up (RECOMENDAÇÕES)

**Data:** 2026-02-23  
**Versão:** 1.0  
**Propósito:** Definir timing e lógica de agendamento para sequência de follow-up

---

## 📊 RESUMO EXECUTIVO

### Estado Atual
- **Timing definido:** 🔴 NENHUM
- **Lógica de scheduling:** 🔴 INEXISTENTE
- **Fuso horário:** 🔴 NÃO IMPLEMENTADO
- **Regras de envio:** 🔴 NÃO DEFINIDAS

### Recomendação Geral

**Sequência de follow-up otimizada:**

```
DIA 0        → 1º Contato (Time Test + Impact)
DIA 1 ou 2  → Follow-up #2 (Re-engajamento)
DIA 3 ou 4  → Follow-up #3 (Urgência)
DIA 5 ou 6  → Follow-up #4 (Last Chance / Opt-out)
```

**Taxa de envio:**
- Opção Conservadora: 48h entre cada mensagem
- Opção Agressiva: 24h entre follow-ups #2 e #3
- **Recomendado:** Variável baseado no perfil (ver seção "Segmentação de Timing")

---

## 🕐 TIPOLOGIA DE LEAD & TIMING

### Classificação de Lead por Tempero de Tempo

| Tipo | Definição | Timing Recomendado | Script |
|------|-----------|-------------------|--------|
| **A (Quente)** | Responde em 1ª mensagem | Demo CTA imediato | Demo CTA |
| **B (Morno)** | Responde em 2ª-3ª mensagem | Follow-up #2 | Re-engajamento |
| **C (Frio)** | Não responde (5+ mensagens) | Follow-up #4 | Last Chance |
| **D (Recuperável)** | Demorou muito (>7 dias) | Re-engajar + oferta especial | Follow-up #2 modificada |

---

## 📅 SEQUÊNCIA COMPLETA DE TIMING

### Fluxo Temporal Detalhado

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEQUÊNCIA DE FOLLOW-UP                        │
└─────────────────────────────────────────────────────────────────┘
                        
     DIA 0: 1º CONTATO
     ├─ Horário da barbearia local (ver fuso horário)
     ├─ Permite: 09:00 - 12:00 e 14:00 - 19:00
     ├─ Bloqueia: Domingo e feriados
     └─ Segunda-feira preferível (dia mais ativo)
     
     ↓ [SE SEM RESPOSTA]
     
     DIA 1 OU 2: FOLLOW-UP #2 (Re-engajamento)
     ├─ Timing: 24-48h após 1º contato
     ├─ Regra: Enviar no mesmo horário que 1º contato
     ├─ Preferência: 24h (perfil simples/premium)
     └─ Adiamento: 48h se lead é "muito ocupado" (detectado pelo lead)
     
     ↓ [SE SEM RESPOSTA]
     
     DIA 3 OU 4: FOLLOW-UP #3 (Urgência/Última Tentativa Forte)
     ├─ Timing: 72-96h após 1º contato
     ├─ Regra: Enviar no mesmo horário que anterior
     ├─ Script: Urgência / Exclusividade
     └─ Ação: Marcar como last attempt
     
     ↓ [SEM RESPOSTA]
     
     DIA 5 OU 6: FOLLOW-UP #4 (Last Chance / Opt-out)
     ├─ Timing: 120-144h após 1º contato
     ├─ Script: Encerramento profissional
     ├─ CTA: Opt-out explícito (responder "PARE" para remover)
     ├─ Ação CRM: Marcar como UNRESPONSIVE
     └─ Regra: Não enviar mais mensagens após
     
     ↓ [SE RESPONDER A QUALQUER MOMENTO]
     
     RESPOSTA POSITIVA:
     ├─ Timing: IMEDIATO (assim que responder)
     ├─ Script: Demo CTA
     ├─ Agendar demo: 24-48h após resposta
     └─ Stage CRM: INTERESTED → DEMO_REQUESTED
     
     RESPOSTA "NÃO TENHO INTERESSE":
     ├─ Timing: IMEDIATO
     ├─ Script: Encerramento profissional
     ├─ Stage CRM: NOT_INTERESTED
     └─ Regra: Não enviar mais mensagens
     
     RESPOSTA "MUITO CARO":
     ├─ Timing: IMEDIATO
     ├─ Script: Rebuttal ROI
     ├─ Stage CRM: INTERESTED (reativo)
     └─ Follow-up: 3 dias após se não converter
     
     RESPOSTA "LIGUE DEPOIS" / "ESTOU OCUPADO":
     ├─ Timing: IMEDIATO
     ├─ Script: Proposta de horário
     ├─ Stage CRM: CONSIDERING
     └─ Action: Agendar follow-up no horário informado
```

---

## 🌍 FUSO HORÁRIO POR REGIÃO

### Mapeamento de DDD para Fuso Horário

| DDD | Região | Fuso Horário | Cidades Principais no Dataset |
|-----|--------|--------------|------------------------------|
| 11 | São Paulo | UTC-3 | São Paulo, Guarulhos |
| 21 | Rio de Janeiro | UTC-3 | Rio de Janeiro, Niterói |
| 31 | Minas Gerais | UTC-3 | Belo Horizonte |
| 41 | Paraná/Sul | UTC-3 | Curitiba, Ponta Grossa |
| 51 | Rio Grande do Sul | UTC-3 | Porto Alegre |
| 61 | Brasília/DF | UTC-3 | Brasília |
| 71 | Bahia | UTC-3 | Salvador |
| 81 | Pernambuco | UTC-3 | Recife |
| 85 | Ceará | UTC-3 | Fortaleza |
| 92 | Amazonas | UTC-4 | Manaus |
| 93 | Pará | UTC-3 | Belém |

**Regra:** A maioria dos leads está em UTC-3 (Horário de Brasília), apenas Manaus (DDD 92) está em UTC-4.

### Cálculo de Horário Local

```python
def calculate_local_time(phone: str) -> str:
    """
    Calcula fuso horário local baseado no DDD
    
    Args:
        phone: Telefone no formato 5511999999999
    
    Returns:
        Fuso horário (UTC-3 ou UTC-4)
    """
    ddd = phone[2:4]  # Extrai DDD do telefone (55xx...)
    
    # Mapeamento DDD → Fuso horário
    timezones = {
        '92': 'UTC-4',  # Manaus
    }
    
    return timezones.get(ddd, 'UTC-3')  # Padrão: UTC-3


def is_allowed_send_time(phone: str, current_time_utc: datetime) -> bool:
    """
    Verifica se é horário permitido para enviar mensagem
    
    Args:
        phone: Telefone do lead
        current_time_utc: Hora atual em UTC
    
    Returns:
        True se pode enviar, False se não
    """
    # Calcula fuso horário local
    timezone_ddd = calculate_local_time(phone)
    
    # Converte UTC para local
    if timezone_ddd == 'UTC-4':
        local_time = current_time_utc - timedelta(hours=1)
    else:
        local_time = current_time_utc  # UTC-3
    
    # Horário permitido: 09:00 - 12:00 e 14:00 - 19:00 (local)
    hour = local_time.hour
    
    if 9 <= hour < 12:
        return True
    elif 14 <= hour < 19:
        return True
    
    return False


def calculate_next_send_time(
    phone: str,
    last_contact_utc: datetime,
    followup_number: int
) -> datetime:
    """
    Calcula horário para próximo follow-up
    
    Args:
        phone: Telefone do lead
        last_contact_utc: Data/hora do último contato
        followup_number: Número do follow-up (0=primeiro, 1=2º contato, etc.)
    
    Returns:
        Próxima data/hora permitida para envio
    """
    # Intervalos (em horas)
    intervals = {
        0: 24,   # Follow-up #1 → #2: 24h
        1: 48,   # Follow-up #3: +48h (total 72h)
        2: 72,   # Follow-up #4: +72h (total 144h)
    }
    
    # Calcula próxima data baseada em intervalo
    interval_hours = intervals.get(followup_number, 48)
    next_contact = last_contact_utc + timedelta(hours=interval_hours)
    
    # Ajusta para horário permitido
    while not is_allowed_send_time(phone, next_contact):
        next_contact = next_contact + timedelta(hours=1)
    
    # Evita domingo
    while next_contact.weekday() == 6:  # 6 = domingo
        next_contact = next_contact + timedelta(days=1)
    
    # Ajusta novamente para horário permitido após pular domingo
    while not is_allowed_send_time(phone, next_contact):
        next_contact = next_contact + timedelta(hours=1)
    
    return next_contact
```

---

## 🎯 SEGMENTAÇÃO DE TIMING

### Opção 1: TIMING CONSERVADOR (Recomendado Inicialmente)

| Perfil | Follow-up #2 | Follow-up #3 | Follow-up #4 |
|--------|-------------|--------------|--------------|
| **Simples** | 48h | +72h (120h total) | +48h (168h total) |
| **Premium** | 48h | +72h (120h total) | +48h (168h total) |
| **Grande** | 48h | +72h (120h total) | +48h (168h total) |

**Total timeline:** 7 dias

**Motivo:** Permite tempo suficiente para o barbeiro processar

### Opção 2: TIMING AGRESSIVO (Apenas para leads altamente engajados)

| Perfil | Follow-up #2 | Follow-up #3 | Follow-up #4 |
|--------|-------------|--------------|--------------|
| **Simples** | 24h | +48h (72h total) | +48h (120h total) |
| **Premium** | 24h | +48h (72h total) | +48h (120h total) |
| **Grande** | 24h | +48h (72h total) | +48h (120h total) |

**Total timeline:** 5 dias

**Motivo:** Acelera fechamento de leads interessados

### Opção 3: TIMING HÍBRIDO (Recomendado Fase 2)

| Perfil | Follow-up #2 | Follow-up #3 | Follow-up #4 |
|--------|-------------|--------------|--------------|
| **Simples** | 48h | +72h (120h total) | +48h (168h total) |
| **Premium** | 24h | +48h (72h total) | +48h (120h total) |
| **Grande** | 24h | +48h (72h total) | +48h (120h total) |

**Total timeline:** 5-7 dias (variável)

**Motivo:** Acelera leads premium/large que têm maior urgência

---

## 📋 REGRAS DE ENVIO

### Regras Gerais

| Regra | Descrição | Implementação |
|-------|-----------|---------------|
| **Horário permitido** | 09:00 - 12:00 e 14:00 - 19:00 (fuso local) | ❌ NÃO implementado |
| **Dias bloqueados** | Domingo e feriados | ❌ NÃO implementado |
| **Fato horário** | Calcular fuso horário por cidade | ❌ NÃO implementado |
| **Respeito opt-out** | Se responder "PARE" → not_interested/lost | ❌ NÃO implementado |
| **Máximo mensagens** | 5 tentativas (incluindo 1º contato) | ✅ IMPLEMENTADO no CRM schema |

### Regras por Estágio

#### Stage: NEW (não contactado)
- **Regra:** Enviar 1º contato imediatamente após importação
- **Timing:** Primeira janela disponível (9h-12h ou 14h-19h local)
- **Freq:** 1 mensagem
- **Next:** Mover para `contacted`

#### Stage: CONTACTED (aguardando resposta)
- **Regra:** Se `messages_sent < 5` e `messages_received = 0` → Seguir sequência
- **Intervalo:**
  - Follow-up #2: 24-48h após 1º contato
  - Follow-up #3: +48-72h
  - Follow-up #4: +48-72h
- **Cancel se:**
  - Receber resposta (qualquer)
  - `messages_sent >= 5` → Mover para `unresponsive`
  - Opt-out ("pare", "não quero") → Mover para `not_interested`

#### Stage: INTERESTED (demonstrou interesse)
- **Regra:** Enviar Demo CTA imediatamente
- **Timing:** Assim que responder mensagens anteriores com palavras de interesse
- **Freq:** 1-2 mensagens
- **Next:** Mover para `demo_requested`

#### Stage: DEMO_REQUESTED (agendou demo)
- **Regra:** Confirmar agendamento e enviar lembrete 1h antes
- **Timing:** Imediato + lembrete
- **Freq:** 2 mensagens
- **Next:** Após demo → `considering` ou `customer`

#### Stage: CONSIDERING (está avaliando/lige depois)
- **Regra Follow-up em 3 dias
- **Timing:** +72h após última mensagem
- **Freq:** 1-2 tentativas
- **Next:** Converter ou `not_interested`

#### Stage: UNRESPONSIVE (não respondeu 5+ mensagens)
- **Regra:** Parar envios (seguiu sequência completa)
- **Nota:** Opcionalmente enviar reengajamento após 30 dias
- **Reforç:** Lead cold mas não perdido

---

## 🔄 ALGORITMO DE SCHEDULING

### Pseudocódigo

```
PARA CADA lead EM:
    IF lead.stage == "new"
        AND is_allowed_time_now(lead.phone)
        THEN
            SEND first_contact(lead)
            UPDATE lead.stage = "contacted"
            UPDATE lead.messages_sent = 1
            UPDATE lead.next_followup_at = calculate_next(lead, followup_number=0)
            
    ELSE IF lead.stage == "contacted"
        AND lead.messages_sent < 5
        AND lead.messages_received == 0
        AND lead.next_followup_at <= NOW()
        AND is_allowed_time_now(lead.phone)
        THEN
            
            followup_number = lead.messages_sent - 1  # 0=1º contato, 1=2º follow-up, etc.
            IF followup_number <= 3  # Max 4 follow-ups (0, 1, 2, 3)
                message = get_followup_script(followup_number, lead)
                SEND message TO lead.phone
                UPDATE lead.messages_sent += 1
                
                IF followup_number == 3  # Last attempt
                    UPDATE lead.stage = "unresponsive"
                ELSE
                    UPDATE lead.next_followup_at = calculate_next(lead, followup_number)
            END IF
            
    ELSE IF lead.stage == "interested"
        AND is_allowed_time_now(lead.phone)
        THEN
            SEND demo_cta(lead)
            UPDATE lead.stage = "demo_requested"
            
    ELSE IF lead.stage == "considering"
        AND lead.next_followup_at <= NOW()
        AND is_allowed_time_now(lead.phone)
        THEN
            SEND followup_reengagement(lead)
            UPDATE lead.followup_count += 1
            UPDATE lead.next_followup_at = NOW() + 72 hours
            
    END IF
END PARAR
```

---

## 🗂️ IMPLEMENTAÇÃO TÉCNICA

### Arquivos Necessários

```
barberzap_python/prospection/
├── timing.py              # ← A CRIAR - Calculadora de timing
├── scheduler.py           # ← A CRIAR - Scheduler de envios
├── followup_engine.py     # ← A CRIAR - Engine principal
└── timezones/
    └── timezone_map.py    # ← A CRIAR - Mapeamento DDD→Fuso
```

### Exemplo: timing.py

```python
"""
BarberZap Prospection Timing Calculator
Calcula horários de envio baseado em fuso horário e regras
"""

from typing import Dict, Optional
from datetime import datetime, timedelta, time
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class TimezoneType(Enum):
    """Tipos de fuso horário"""
    UTC_MINUS_3 = "UTC-3"  # Horário de Brasília
    UTC_MINUS_4 = "UTC-4"  # Manaus


# Mapeamento DDD → Fuso horário
DDD_TIMEZONE_MAP = {
    '92': TimezoneType.UTC_MINUS_4,  # Manaus
    # Todos os outros DDDs são UTC-3 por padrão
}

# Horários permitidos (UTC-3)
ALLOWED_WINDOWS = [
    (time(9, 0), time(12, 0)),   # 09:00 - 12:00
    (time(14, 0), time(19, 0)),  # 14:00 - 19:00
]


class FollowupTimingCalculator:
    """Calculadora de tempo para sequência de follow-up"""
    
    def __init__(self, use_aggressive_timing: bool = False):
        """
        Inicializa calculadora
        
        Args:
            use_aggressive_timing: SeTrue, usa timing mais agressivo (24h)
        """
        self.use_aggressive_timing = use_aggressive_timing
        
        # Intervalos por follow-up (em horas)
        if use_aggressive_timing:
            self.intervals = {
                0: 24,   # Follow-up #1 → #2: 24h
                1: 48,   # Follow-up #3: +48h
                2: 48,   # Follow-up #4: +48h
            }
        else:
            self.intervals = {
                0: 48,   # Follow-up #1 → #2: 48h
                1: 72,   # Follow-up #3: +72h
                2: 48,   # Follow-up #4: +48h
            }
    
    def get_timezone(self, phone: str) -> TimezoneType:
        """
        Obtém fuso horário baseado no DDD
        
        Args:
            phone: Telefone no formato 5511999999999
        
        Returns:
            Tipo de fuso horário
        """
        # Extrai DDD (55[DD]XXXXXXXXX)
        if len(phone) < 4:
            return TimezoneType.UTC_MINUS_3
        
        ddd = phone[2:4]  # Extrai DDD
        return DDD_TIMEZONE_MAP.get(ddd, TimezoneType.UTC_MINUS_3)
    
    def utc_to_local(
        self, 
        utc_time: datetime, 
        timezone: TimezoneType
    ) -> datetime:
        """
        Converte UTC para horário local
        
        Args:
            utc_time: Datetime em UTC
            timezone: Tipo de fuso horário
        
        Returns:
            Datetime em horário local
        """
        if timezone == TimezoneType.UTC_MINUS_4:
            return utc_time - timedelta(hours=1)
        else:
            return utc_time  # UTC-3
    
    def local_to_utc(
        self, 
        local_time: datetime, 
        timezone: TimezoneType
    ) -> datetime:
        """
        Converte horário local para UTC
        
        Args:
            local_time: Datetime em horário local
            timezone: Tipo de fuso horário
        
        Returns:
            Datetime em UTC
        """
        if timezone == TimezoneType.UTC_MINUS_4:
            return local_time + timedelta(hours=1)
        else:
            return local_time  # UTC-3
    
    def is_allowed_send_time(
        self, 
        phone: str, 
        current_utc: datetime
    ) -> bool:
        """
        Verifica se é horário permitido para enviar mensagem
        
        Args:
            phone: Telefone do lead
            current_utc: Hora atual em UTC
        
        Returns:
            True se pode enviar, False se não
        """
        # Calcula fuso horário local
        timezone = self.get_timezone(phone)
        local_time = self.utc_to_local(current_utc, timezone)
        
        # Verifica se está em horário permitido
        for start, end in ALLOWED_WINDOWS:
            if start <= local_time.time() < end:
                return True
        
        return False
    
    def is_weekday(self, dt: datetime) -> bool:
        """
        Verifica se dia útil (segunda - sexta)
        
        Args:
            dt: Datetime a verificar
        
        Returns:
            True se dia útil (0=segunda, 4=sexta)
        """
        return dt.weekday() <= 4  # 0-4 são segunda-sexta
    
    def calculate_next_send_time(
        self,
        phone: str,
        last_contact_utc: datetime,
        followup_number: int = 0
    ) -> datetime:
        """
        Calcula próxima data/hora permitida para envio
        
        Args:
            phone: Telefone do lead
            last_contact_utc: Data/hora do último contato
            followup_number: Número do follow-up 
                (0=1º follow-up, 1=2º follow-up, etc.)
        
        Returns:
            Próxima data/hora permitida para envio (UTC)
        """
        # Obtém fuso horário
        timezone = self.get_timezone(phone)
        
        # Calcula intervalo baseado no número do follow-up
        interval_hours = self.intervals.get(followup_number, 48)
        
        # Calcula próximo contato baseado em intervalo
        next_contact = last_contact_utc + timedelta(hours=interval_hours)
        
        # Ajusta para horário permitido
        count = 0
        while not self.is_allowed_send_time(phone, next_contact):
            next_contact = next_contact + timedelta(hours=1)
            count += 1
            if count > 100:  # Safety: não loop infinito
                logger.error(f"Could not find allowed send time for {phone}")
                break
        
        # Evita domingo
        original_day = next_contact.day
        while next_contact.weekday() == 6:  # 6 = domingo
            next_contact = next_contact + timedelta(days=1)
            logger.debug(f"Skipped Sunday for {phone}")
        
        # Ajusta novamente para horário permitido após pular domingo
        count = 0
        while not self.is_allowed_send_time(phone, next_contact):
            next_contact = next_contact + timedelta(hours=1)
            count += 1
            if count > 100:
                break
        
        return next_contact
    
    def get_followup_schedule(
        self,
        phone: str,
        first_contact_utc: datetime
    ) -> Dict[int, datetime]:
        """
        Calcula horário para todos os follow-ups de uma vez
        
        Args:
            phone: Telefone do lead
            first_contact_utc: Data/hora do 1º contato
        
        Returns:
            Dicionário {followup_number: datetime_utc}
                - 0: Follow-up #2
                - 1: Follow-up #3
                - 2: Follow-up #4 (Last chance)
        """
        schedule = {}
        last_contact = first_contact_utc
        
        for i in range(3):  # 3 follow-ups após 1º contato
            next_time = self.calculate_next_send_time(
                phone=phone,
                last_contact_utc=last_contact,
                followup_number=i
            )
            schedule[i] = next_time
            last_contact = next_time
        
        return schedule
    
    def should_send_followup(
        self,
        phone: str,
        next_followup_utc: datetime,
        current_utc: datetime
    ) -> bool:
        """
        Verifica se deve enviar follow-up agora
        
        Args:
            phone: Telefone do lead
            next_followup_utc: Data/hora agendada para próximo follow-up
            current_utc: Data/hora atual (UTC)
        
        Returns:
            True se deve enviar agora
        """
        # Se já passou do horário agendado
        if current_utc < next_followup_utc:
            return False
        
        # Se está em horário permitido
        if not self.is_allowed_send_time(phone, current_utc):
            return False
        
        # Se é dia útil
        if not self.is_weekday(current_utc):
            return False
        
        return True


# Exemplos de uso
if __name__ == "__main__":
    from datetime import datetime
    
    # Exemplo 1: Calcular próxima data para São Paulo (DDD 11)
    calculator = FollowupTimingCalculator()
    
    phone_sp = "5511999999999"  # São Paulo
    first_contact = datetime(2026, 2, 23, 10, 0, 0)  # 10:00 UTC (7:00 local SP)
    
    next_followup = calculator.calculate_next_send_time(
        phone=phone_sp,
        last_contact_utc=first_contact,
        followup_number=0
    )
    
    print("=" * 70)
    print("EXEMPLO 1: São Paulo (DDD 11)")
    print(f"1º Contato: {first_contact}")
    print(f"Follow-up #2: {next_followup}")
    print(f"Cidade local: {calculator.utc_to_local(next_followup, TimezoneType.UTC_MINUS_3)}")
    print()
    
    # Exemplo 2: Calcular cronograma completo
    schedule = calculator.get_followup_schedule(phone=phone_sp, first_contact_utc=first_contact)
    
    print("=" * 70)
    print("EXEMPLO 2: Cronograma Completo - São Paulo")
    for followup_num, time_utc in schedule.items():
        time_local = calculator.utc_to_local(time_utc, TimezoneType.UTC_MINUS_3)
        print(f"Follow-up #{followup_num + 2}: {time_utc} ({time_local})")
    print()
    
    # Exemplo 3: Verificar se pode enviar agora
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    should_send = calculator.should_send_followup(
        phone=phone_sp,
        next_followup_utc=next_followup,
        current_utc=now
    )
    
    print("=" * 70)
    print("EXEMPLO 3: Verificar se pode enviar agora")
    print(f"Hora atual UTC: {now}")
    print(f"Próximo follow-up: {next_followup}")
    print(f"Pode enviar agora: {should_send}")
```

---

## 📊 ESCALA DE SCHEDULING

### Volume de Mensagens Diárias

| Cenário | Leads/dia | Mensagens/retry | Total Mensagens/dia |
|---------|-----------|-----------------|---------------------|
| **Baixo** | 20 | 2.5 (média) | 50 |
| **Médio** | 50 | 2.5 | 125 |
| **Alto** | 100 | 2.5 | 250 |

**Capacidade do Evolution API:**
- Rate limit tipico: ~1 mensagem/segundo
- Com 250 mensagens/dia em janela de 4 horas (9h-12h ou 14h-19h):
  - 250 mensagens / 4 horas = 62.5 mensagens/hora = ~1 mensagem/minuto
  - ✅ DENTRO da capacidade

**Próxima etapa:**
- Monitorar Evolution API rate limits
- Implementar queue system se necessário (Redis/Celery)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Timing (Módulo timing.py)

- [ ] Mapeamento DDD → Fuso horário
- [ ] Função calculate_next_send_time()
- [ ] Função is_allowed_send_time()
- [ ] Função get_followup_schedule()
- [ ] Regra de dias bloqueados (domingo)
- [ ] Regra de horários permitidos (9-12, 14-19)

### Scheduler (Módulo scheduler.py)

- [ ] Scheduler executando a cada X minutos (5-15 min)
- [ ] Query leads que precisam de follow-up
- [ ] Verificar horário permitido para cada lead
- [ ] Chamar followup_engine.send_followup()

### Integration

- [ ] Integração com CRM prospection (crm_prospection.py)
- [ ] Atualizar lead.messages_sent, lead.next_followup_at
- [ ] Transição de estágio (contacted → unresponsive)
- [ ] Logging de cada follow-up enviado

### Testing

- [ ] Testar timing com leads em diferentes fusos (SP vs Manaus)
- [ ] Testar horário permitido (não enviar 8h nem 20h)
- [ ] Testar dias bloqueados (não enviar domingo)
- [ ] Testar cronograma completo

---

**Versão:** 1.0  
**Data:** 2026-02-23  
**Status:** 📝 Recomendações prontas - Aguardando implementação
