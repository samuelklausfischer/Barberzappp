# 📝 BarberZap - Scripts de Follow-up (TEMPLATES)

**Data:** 2026-02-23  
**Versão:** 1.0  
**Propósito:** Templates de scripts para prospecção outbound

> ⚠️ **AVISO:** Estes são TEMPLATES em português. Para implementação, traduzir para linguagem de template (Python f-strings, Jinja2, etc.) e substituir variáveis dinâmicas.

---

## 🎯 VARIÁVEIS DISPONÍVEIS

### Variáveis de Lead

```
{nome_barbeiro}       - Nome do proprietário (do CSV ou inferido)
{barbearia}            - Nome da barbearia
{cidade}               - Cidade
{estado}               - Estado (UF)
{perfil}               -Perfil: simples/premium/grande
{cadeiras}             - Número de cadeiras (se disponível)
```

### Variáveis de Sistema

```
{primeiro_nome}        - Primeiro nome do barbeiro
{horario_demo}         - Horário sugerido para demo
{data_demo}            - Data sugerida para demo
{link_demo}            - Link para agendamento de demo
{link_trial}           - Link para trial gratuito
{meu_nome}             - Nome do representante
{telefone}             - Telefone de contato do representante
```

---

## 📨 1º CONTATO

### Script Base (EXISTENTE no Strategy Doc)

```
Variante: Time Test + Impact
Uso: Primeira mensagem para todos os leads

TEMPLATE:
"Olá, {primeiro_nome}! 

Vi sua barbearia {barbearia} no Maps e fiz um teste. 
Uma mensagem de agendamento que fica 15 minutos sem resposta 
é um cliente que você provavelmente perdeu agora.

Eu treinei uma IA especificamente para barbeiros que responde 
em 5 segundos, agenda o horário e já lança no seu financeiro. 
24h por dia.

Se você perde apenas 2 clientes por dia por demora no WhatsApp 
(ticket R$ 50), são R$ 3.000,00 a menos no seu bolso por mês. 
O BarberZap resolve isso por uma fração desse valor.

Quer ver uma demonstração rápida da IA em ação?"
```

### Variante por Perfil (PROPOSTA)

#### Perfil Simples
```
"Olá, {primeiro_nome}!

Notei sua barbearia {barbearia} no Google Maps e fiz um teste rápido. 
Mandei uma mensagem de agendamento e demorei para receber resposta.

Sei que com 1-2 cadeiras você precisa responder todo mundo, 
mas às vezes é impossível estar no WhatsApp o dia todo.

A IA do BarberZap responde em 5 segundos, agenda o horário e 
anota na sua agenda financeira. Funciona 24h por dia, inclusive 
quando você está ocupado cortando ou com cliente.

Investimento: R$ 49,90/mês (menos de 2 cortes por mês).

Quer testar grátis por 7 dias? Posso demonstrar logo agora."
```

#### Perfil Premium
```
"Olá, {primeiro_nome}!

Vi sua barbearia {barbearia} no Maps - é uma das mais bem avaliadas!

Fiz um teste de agendamento e notei a demora na resposta. 
Seus clientes esperam atendimento de alto nível, e uma demora 
no WhatsApp pode deixar essa experiência abaixo do esperado.

O BarberZap é uma IA que responde em 5 segundos, agenda o horário 
com a etiqueta e profissionalismo que sua barbearia oferece, e já 
lança no financeiro. 24h por dia.

Seus clientes percebem a diferença imediatamente.

Quer ver uma demonstração da IA em ação?"
```

#### Perfil Grande/Rede
```
"Olá, {primeiro_nome}!

Notei sua barbearia {barbearia} no Maps - vocês operam com {cadeiras} 
cadeiras! É um bom volume.

Como vocês gerenciam o atendimento ao cliente hoje? Com {cadeiras} 
cadeiras, a equipe precisa centralizar e ter visão do negócio.

O BarberZap é uma IA que responde em 5 segundos, agenda horários, 
gerencia a agenda da equipe e já lança tudo no financeiro. 24h por dia.

Você ganha visão total do negócio e sua equipe sai da tarefa de 
responder WhatsApp para focar no atendimento.

Quer ver uma demonstração da IA para sua equipe?"
```

---

## 📨 FOLLOW-UP #2 (RE-ENGAJAMENTO)

### Variante Base

#### Perfil Simples
```
"{primeiro_nome}, tudo bem?

Aqui da BarberZap passando de novo.

Só reforçando: a demora no WhatsApp está te custando clientes. 
Se perdidos 2 clientes/dia por causa disso, são R$ 2.400/mês 
que deixam de entrar no caixa.

A IA do BarberZap responde em 5 segundos, agenda o horário e 
lança no financeiro. Automatiza tudo.

Investimento: R$ 49,90/mês (menos que 2 cortes).

Quer testar grátis por 7 dias? Posso ativar agora."
```

#### Perfil Premium
```
"{primeiro_nome}, tudo bem?

Seguindo nosso contato.

Sua barbearia tem avaliações excelentes no Maps - sua marca é 
reconhecida. Mas a demora no WhatsApp pode impactar essa imagem.

Seus clientes esperam atendimento de alto nível em todos os 
canais. O BarberZap mantém essa percepção respondendo em 
5 segundos com etiqueta adequada.

Teste grátis de 7 dias disponível. Quer ativar?"
```

#### Perfil Grande/Rede
```
"{primeiro_nome}, tudo bem?

Voltando ao nosso contato.

Com {cadeiras} cadeiras, você precisa centralizar e ter visão. 
O BarberZap faz exatamente isso: agenda, gerencia equipe e 
lança no financeiro. Tudo em 5 segundos.

Você ganha tempo, sua equipe ganha produtividade e seu negócio 
ganha controle.

Posso demonstrar para sua equipe?"
```

---

## 📨 FOLLOW-UP #3 (URGÊNCIA)

### Variante Base

#### Perfil Simples
```
"{primeiro_nome}, última pergunta rápida:

Você tem disponível para responder a maioria das mensagens do WhatsApp?
Se a resposta for "não", a IA do BarberZap resolve esse problema.

Teste grátis de 7 dias - sem compromisso, pode cancelar a qualquer 
momento. Basta responder "SIM" que ativo agora."
```

#### Perfil Premium
```
"{primeiro_nome}, última mensagem:

Seus clientes percebem a diferença no atendimento. Barbearias 
premium mantêm esse padrão em todos os canais.

A demora no WhatsApp é a única exceção na sua operação atual.

Teste grátis de 7 dias disponível. Barra a entrada, começa o teste, 
cancela se não agradar. Simples assim.

Quer ativar?"
```

#### Perfil Grande/Rede
```
"{primeiro_nome}, último contato:

Barbearias com {cadeiras} ou mais cadeiras perdem 3+ clientes/dia 
por demora no WhatsApp. São R$ 4.500/mês que deixam de entrar.

O BarberZap resolve isso em 5 segundos.

Lançamos novos slots para demonstração esta semana. Posso agendar 
para sua equipe?"
```

---

## 📨 FOLLOW-UP #4 / LAST CHANCE

### Script Base (Único)

```
"{primeiro_nome}, vou respeitar seu tempo e não vou incomodar mais.

O BarberZap está aqui se você mudar de ideia.

Se quiser, posso deixar seu contato na nossa lista de futuros 
parceiros. Quando quiser experimentar (mesmo daqui a 1 mês, 6 
meses, 1 ano), só me avisar.

Basta responder "QUERO" para ficar na lista, ou "PARE" para 
remover seu contato.

Boa sorte nos negócios! 

Equipe BarberZap"
```

---

## 📨 DEMO CTA (AGENDAR DEMO)

### Script Base

```
"Legal que se interessou! 🎉

Quando é melhor para demonstrar a IA?

Opções:
• Hoje às {horario_disponivel_min}
• Amanhã às {horario_disponivel_manha}
• [outro horário que me diga]

Formato: Demonstração via WhatsApp (15 minutos), você vê a 
IA respondendo em tempo real.

O que sugere?"
```

### Variante com Link de Agendamento

```
"Legal que se interessou! 🎉

Vou te enviar um link para agendar a demonstração no horário 
disponível:

{link_demo}

A demo dura 15 minutos e é via WhatsApp. Você verá a IA respondendo 
em tempo real.

Se preferir, posso agendar agora. Diga um horário!"
```

---

## 📨 CONCLUSÃO DE DEMO (NEXT STEPS)

### Script Base

```
"{primeiro_nome}!

Foi ótimo demonstrar a IA para você! 🚀

Resumo do que você viu:
✅ IA respondendo em 5 segundos
✅ Agendamento automático
✅ Lançamento no financeiro
✅ Disponível 24h por dia

**Próximo passo:**

Para ativar seu teste gratuito de 7 dias, acesse:
{link_trial}

São 2 minutos de setup. A IA já começa a responder.

Se tiver dúvidas, pode me chamar no WhatsApp: {telefone}

Estou à disposição!"
```

### Variante com Instruções Detalhadas

```
"{primeiro_nome}!
Ótimo ver a IA em ação! 🎉

Resumo da demonstração:
✅ Resposta em 5 segundos (vs. demora atual)
✅ Agendamento automático com confirmação
✅ Lançamento no financeiro integrado
✅ 24h por dia, sem seu envolvimento

**Para ativar seu teste de 7 dias:**

1. Acesse: {link_trial}
2. Crie sua conta (nome, email, WhatsApp)
3. Configure sua barbearia (nome, serviços, horários)
4. Pronto! A IA começa a responder

**Dica:** Crie seus serviços padrão (Ex: "Corte Cabelo R$ 35", "Barba R$ 20")

Se precisar de ajuda na configuração, estou à disposição:
WhatsApp: {telefone}

O teste é totalmente grátis. Pode cancelar a qualquer momento.

Boa sorte!"
```

---

## 🔔 REBUTS (RESPOSTAS A OBJEÇÕES)

### "Não tenho interesse"

```
"Sem problemas! Entendo perfeitamente. 

Se mudar de ideia no futuro, pode me procurar. Estarei aqui.

Boa sorte nos negócios! 👍
Sou {meu_nome} da BarberZap."
```

**Action CRM:** Marcar como `not_interested` → `lost`, motivo: "sem interesse"

---

### "Muito caro"

```
"Entendo! Vamos fazer as contas:

Preço BarberZap: R$ 49,90/mês

Custo de demora no WhatsApp:
• 2 clientes perdidos/dia (ticket R$ 50)
• = R$ 100/dia
• = R$ 3.000/mês que você DEIXA de ganhar

O BarberZap evita essa perda em 7 dias.ROI é de **60x o investimento**.

Teste grátis de 7 dias disponível. Experimenta e vê se funciona.

Se não agradar, cancela sem custo. Parece razoável?"
```

**Action CRM:** Marcar como `considering`, agendar follow-up em 3 dias

---

### "Já tenho sistema"

```
"Legal! Qual sistema você usa hoje?

Posso te mostrar um comparativo. Muitas vezes o BarberZap faz 
coisas que outros não:
• Resposta em 5 segundos (não 2-5 minutos)
• Integrado diretamente com financeiro
• IA treinada especificamente para barbeiros
• Preço: R$ 49,90/mês (não R$ 150+)

Quer ver o comparativo?"
```

**Action CRM:** Marcar como `considering`, enviar comparativo, follow-up em 2 dias

---

### "Não preciso agora / Estou avaliando"

```
"Deixa eu perguntar: qual critério você está usando para avaliar?

Vai testar alguma solução similar ou está comparando custo X benefício?

Posso te passar:
• Comparativo: BarberZap vs. Outras soluções
• Calculadora de ROI para sua barbearia
• Caso de sucesso de {cidade}

Qual ajuda mais?"
```

**Action CRM:** Marcar como `considering`, agendar follow-up em 3 dias

---

### "Ligue depois" / "Estou ocupado"

```
"Claro! Qual melhor horário para conversar?

• Manhã: 9h - 12h
• Tarde: 14h - 18h  
• Qual outro horário funciona?

Vou anotar e te ligo nesse horário."
```

**Action CRM:** Marcar como `considering`, agendar follow-up no horário informado

---

### "Fale com meu sócio / Gerente"

```
"Sem problemas! Vou te enviar as informações por aqui:

📋 **Resumo BarberZap:**
• IA que responde em 5 segundos
• Agenda e lança no financeiro
• 24h por dia
• Preço: R$ 49,90/mês
• Teste grátis de 7 dias

Posso enviar um PDF completo? Vai ajudando seu sócio a entender.

É só responder "ENVIE" que passo as informações."
```

**Action CRM:** Marcar como `considering`, agendar follow-up em 2 dias

---

### "Precisei de mais informações"

```
"Claro! Vou te enviar tudo:

📋 **O que é o BarberZap:**
IA que responde WhatsApp de barbearias em 5 segundos, agenda 
horários e lança no financeiro. 24h por dia.

💰 **Investimento:**
R$ 49,90/mês. Teste grátis de 7 dias.

✨ **Benefícios:**
• Resposta em 5 segundos (vs. 2-5 minutos atual)
• Agenda automática com confirmação
• Lançamento no financeiro integrado
• Disponível 24h por dia
• Profissionalismo no atendimento

📊 **ROI:**
Se perder 2 clientes/dia por demora (ticket R$ 50), 
são R$ 3.000/mês que você deixa de ganhar.
BarberZap evita essa perda em 7 dias.

**Documentos disponíveis:**
• Caso de sucesso: [LINK]
• Comparativo de soluções: [LINK]

Quer que eu envie mais alguma coisa? Ou prefere agendar uma demo?"
```

**Action CRM:** Marcar como `considering`, send documents, agendar follow-up em 2 dias

---

## 🎉 RESPOSTAS POSITIVAS

### "Sim" / "Quero testar" / "Interessado"

```
"Excelente! 🎉

Para ativar seu teste grátis de 7 dias, acesse:
{link_trial}

Setup demora 2 minutos. A IA começa a responder imediatamente.

Se precisar de ajuda, estou à disposição:
WhatsApp: {telefone}

Boa sorte! Vai funcionar bem! 💪"
```

**Action CRM:** 
- Marcar como `interested`
- Enviar link de trial
- Agendar follow-up em 3 dias se não ativar trial

---

### "Vou ver" / "Vou analisar"

```
"Decidido! Fico à disposição.

Vou te seguir aqui. Se precisar de algo, me chama.

Estou no WhatsApp: {telefone}

Qualquer dúvida, pode perguntar."
```

**Action CRM:** 
- Marcar como `considering`
- Agendar follow-up em 2 dias

---

## 📧 OPT-OUT (REMOVER CONTATO)

### Script Base

```
"Entendido. Seu contato foi removido da nossa lista.

Se mudar de ideia no futuro, pode nos procurar:
WhatsApp: {telefone}

Boa sorte! 👍"
```

**Action CRM:** 
- Marcar como `not_interested` → `lost`
- Motivo: "opt-out solicitado"
- Não enviar mais follow-ups

---

## 🛠️ IMPLEMENTAÇÃO

### Estrutura de Arquivos Sugerida

```
barberzap_python/prospection/
├── __init__.py
├── scripts.py              # ← Implementar templates aqui
├── followup_engine.py      # ← Engine de envio
├── timing.py               # ← Calculadora de timing
└── templates/
    ├── first_contact/
    │   ├── base.md
    │   ├── simple.md
    │   ├── premium.md
    │   └── large.md
    ├── followup_2/
    │   ├── simple.md
    │   ├── premium.md
    │   └── large.md
    ├── followup_3/
    │   ├── simple.md
    │   ├── premium.md
    │   └── large.md
    ├── followup_4_last_chance.md
    ├── demo_cta.md
    ├── demo_conclusion.md
    └── rebuttals.md
```

### Exemplo de Implementação (Python)

```python
"""
BarberZap Prospection Scripts
Módulo de templates de scripts de follow-up
"""

from typing import Dict, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ScriptType(Enum):
    """Tipos de scripts disponíveis"""
    FIRST_CONTACT_BASE = "first_contact_base"
    FIRST_CONTACT_SIMPLE = "first_contact_simple"
    FIRST_CONTACT_PREMIUM = "first_contact_premium"
    FIRST_CONTACT_LARGE = "first_contact_large"
    
    FOLLOWUP_2_SIMPLE = "followup_2_simple"
    FOLLOWUP_2_PREMIUM = "followup_2_premium"
    FOLLOWUP_2_LARGE = "followup_2_large"
    
    FOLLOWUP_3_SIMPLE = "followup_3_simple"
    FOLLOWUP_3_PREMIUM = "followup_3_premium"
    FOLLOWUP_3_LARGE = "followup_3_large"
    
    FOLLOWUP_4_LAST_CHANCE = "followup_4_last_chance"
    
    DEMO_CTA = "demo_cta"
    DEMO_CONCLUSION = "demo_conclusion"
    
    REBUT_NOT_INTERESTED = "rebut_not_interested"
    REBUT_TOO_EXPENSIVE = "rebut_too_expensive"
    REBUT_HAVE_SYSTEM = "rebut_have_system"
    REBUT_NOT_NOW = "rebut_not_now"
    REBUT_CALL_LATER = "rebut_call_later"
    REBUT_MORE_INFO = "rebut_more_info"
    
    POSITIVE_RESPONSE = "positive_response"
    OPT_OUT = "opt_out"


class LeadProfile(Enum):
    """Perfis de lead"""
    SIMPLE = "simple"      # 1-2 cadeiras
    PREMIUM = "premium"    # Experiência
    LARGE = "large"        # 3+ cadeiras / rede


# Templates de scripts
SCRIPTS_TEMPLATES: Dict[ScriptType, str] = {
    # First Contact
    ScriptType.FIRST_CONTACT_BASE: """
Olá, {primeiro_nome}!

Vi sua barbearia {barbearia} no Maps e fiz um teste. 
Uma mensagem de agendamento que fica 15 minutos sem resposta 
é um cliente que você provavelmente perdeu agora.

Eu treinei uma IA especificamente para barbeiros que responde 
em 5 segundos, agenda o horário e já lança no seu financeiro. 
24h por dia.

Se você perde apenas 2 clientes por dia por demora no WhatsApp 
(ticket R$ 50), são R$ 3.000,00 a menos no seu bolso por mês. 
O BarberZap resolve isso por uma fração desse valor.

Quer ver uma demonstração rápida da IA em ação?
    """.strip(),
    
    ScriptType.FIRST_CONTACT_SIMPLE: """
Olá, {primeiro_nome}!

Notei sua barbearia {barbearia} no Google Maps e fiz um teste rápido. 
Mandei uma mensagem de agendamento e demorei para receber resposta.

Sei que com 1-2 cadeiras você precisa responder todo mundo, 
mas às vezes é impossível estar no WhatsApp o dia todo.

A IA do BarberZap responde em 5 segundos, agenda o horário e 
anota na sua agenda financeira. Funciona 24h por dia, inclusive 
quando você está ocupado cortando ou com cliente.

Investimento: R$ 49,90/mês (menos de 2 cortes por mês).

Quer testar grátis por 7 dias? Posso demonstrar logo agora.
    """.strip(),
    
    # [Adicionar todos os outros templates aqui...]
}


def generate_script(
    script_type: ScriptType,
    lead_data: Dict,
    overrides: Optional[Dict] = None
) -> str:
    """
    Gera script personalizado substituindo variáveis
    
    Args:
        script_type: Tipo de script (ScriptType enum)
        lead_data: Dicionário com dados do lead:
            - primeiro_nome: str
            - barbearia: str
            - cidade: str (opcional)
            - perfil: LeadProfile (opcional)
        overrides: Dicionário de substituições adicionais
    
    Returns:
        Script com variáveis substituídas
    """
    # Obtém template base
    template = SCRIPTS_TEMPLATES.get(script_type)
    
    if not template:
        logger.error(f"Script type not found: {script_type}")
        return ""
    
    # Prepara dados para substituição
    data = {
        'primeiro_nome': lead_data.get('primeiro_nome', 'Olá'),
        'barbearia': lead_data.get('barbearia', 'sua barbearia'),
        'cidade': lead_data.get('cidade', ''),
        'estado': lead_data.get('estado', ''),
        'perfil': lead_data.get('perfil', 'simple'),
        'cadeiras': lead_data.get('cadeiras', ''),
        **(overrides or {})
    }
    
    # Substitui variáveis
    script = template.format(**data)
    
    return script


def get_first_contact_script(
    nome_barbearia: str,
    primeiro_nome: str,
    perfil: LeadProfile = LeadProfile.SIMPLE,
    cidade: str = ""
) -> str:
    """
    Gera script de primeiro contato para perfil específico
    
    Args:
        nome_barbearia: Nome da barbearia
        primeiro_nome: Primeiro nome do barbeiro
        perfil: Perfil (simple, premium, large)
        cidade: Cidade (opcional)
    
    Returns:
        Script de primeiro contato
    """
    lead_data = {
        'primeiro_nome': primeiro_nome,
        'barbearia': nome_barbearia,
        'cidade': cidade,
        'perfil': perfil.value
    }
    
    # Seleciona script baseado em perfil
    if perfil == LeadProfile.SIMPLE:
        script_type = ScriptType.FIRST_CONTACT_SIMPLE
    elif perfil == LeadProfile.PREMIUM:
        script_type = ScriptType.FIRST_CONTACT_PREMIUM
    elif perfil == LeadProfile.LARGE:
        script_type = ScriptType.FIRST_CONTACT_LARGE
    else:
        script_type = ScriptType.FIRST_CONTACT_BASE
    
    return generate_script(script_type, lead_data)


def get_followup_script(
    followup_number: int,
    lead_data: Dict
) -> str:
    """
    Gera script de follow-up para etapa específica
    
    Args:
        followup_number: Número do follow-up (1=2º contato, 2=3º, etc.)
        lead_data: Dicionário com dados do lead
    
    Returns:
        Script de follow-up
    """
    perfil = LeadProfile(lead_data.get('perfil', 'simple'))
    
    # Seleciona script baseado em número e perfil
    if followup_number == 1:  # 2º contato (Follow-up #2)
        if perfil == LeadProfile.SIMPLE:
            script_type = ScriptType.FOLLOWUP_2_SIMPLE
        elif perfil == LeadProfile.PREMIUM:
            script_type = ScriptType.FOLLOWUP_2_PREMIUM
        else:
            script_type = ScriptType.FOLLOWUP_2_LARGE
            
    elif followup_number == 2:  # 3º contato (Follow-up #3)
        if perfil == LeadProfile.SIMPLE:
            script_type = ScriptType.FOLLOWUP_3_SIMPLE
        elif perfil == LeadProfile.PREMIUM:
            script_type = ScriptType.FOLLOWUP_3_PREMIUM
        else:
            script_type = ScriptType.FOLLOWUP_3_LARGE
            
    elif followup_number == 3:  # 4º contato (Last Chance)
        script_type = ScriptType.FOLLOWUP_4_LAST_CHANCE
        
    else:
        logger.error(f"Invalid followup number: {followup_number}")
        return ""
    
    return generate_script(script_type, lead_data)


def get_rebuttal_script(
    objection_type: str,
    lead_data: Dict
) -> str:
    """
    Gera script de rebuttal para objeção específica
    
    Args:
        objection_type: Tipo de objeção
            - "not_interested"
            - "too_expensive"
            - "have_system"
            - "not_now"
            - "call_later"
            - "more_info"
        lead_data: Dicionário com dados do lead
    
    Returns:
        Script de rebuttal
    """
    # Map string objection to enum
    objection_map = {
        "not_interested": ScriptType.REBUT_NOT_INTERESTED,
        "too_expensive": ScriptType.REBUT_TOO_EXPENSIVE,
        "have_system": ScriptType.REBUT_HAVE_SYSTEM,
        "not_now": ScriptType.REBUT_NOT_NOW,
        "call_later": ScriptType.REBUT_CALL_LATER,
        "more_info": ScriptType.REBUT_MORE_INFO,
    }
    
    script_type = objection_map.get(objection_type)
    
    if not script_type:
        logger.error(f"Invalid objection type: {objection_type}")
        return ""
    
    return generate_script(script_type, lead_data)


# Exemplos de uso
if __name__ == "__main__":
    # Exemplo 1: First contato perfil simples
    script = get_first_contact_script(
        nome_barbearia="Barbearia do João",
        primeiro_nome="João",
        perfil=LeadProfile.SIMPLE,
        cidade="São Paulo"
    )
    
    print("=" * 70)
    print("EXEMPLO - First Contact (Perfil Simples)")
    print("=" * 70)
    print(script)
    print()
    
    # Exemplo 2: Follow-up #2 perfil premium
    lead_data = {
        'primeiro_nome': 'Carlos',
        'barbearia': 'Barbearia Premium',
        'cidade': 'Uberlândia',
        'perfil': 'premium'
    }
    
    script = get_followup_script(followup_number=1, lead_data=lead_data)
    
    print("=" * 70)
    print("EXEMPLO - Follow-up #2 (Perfil Premium)")
    print("=" * 70)
    print(script)
    print()
    
    # Exemplo 3: Rebuttal "muito caro"
    script = get_rebuttal_script(
        objection_type="too_expensive",
        lead_data=lead_data
    )
    
    print("=" * 70)
    print("EXEMPLO - Rebuttal (Muito Caro)")
    print("=" * 70)
    print(script)
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Scripts a Implementar

- [ ] **First Contact** (1 variante base + 3 variantes por perfil)
  - [ ] Base
  - [ ] Perfilsimple
  - [ ] Perfil Premium
  - [ ] Perfil Large (rede)

- [ ] **Follow-up #2** (3 variantes por perfil)
  - [ ] Simples
  - [ ] Premium
  - [ ] Large

- [ ] **Follow-up #3** (3 variantes por perfil)
  - [ ] Simples
  - [ ] Premium
  - [ ] Large

- [ ] **Follow-up #4 / Last Chance**
  - [ ] Script base único

- [ ] **Demo CTA** (agendamento de demo)
  - [ ] Script base

- [ ] **Demo Conclusão** (next steps após demo)
  - [ ] Script base
  - [ ] Variante com instruções detalhadas

- [ ] **Rebuttals** (respostas a objeções)
  - [ ] "Não tenho interesse"
  - [ ] "Muito caro"
  - [ ] "Já tenho sistema"
  - [ ] "Não preciso agora / Estou avaliando"
  - [ ] "Ligue depois / Estou ocupado"
  - [ ] "Precisei de mais informações"

- [ ] **Respostas Positivas**
  - [ ] "Sim" / "Quero testar"
  - [ ] "Vou ver" / "Vou analisar"

- [ ] **Opt-out** (remover contato)
  - [ ] Script base

---

**Versão:** 1.0  
**Data:** 2026-02-23  
**Status:** 📝 Templates prontos para implementação Python
