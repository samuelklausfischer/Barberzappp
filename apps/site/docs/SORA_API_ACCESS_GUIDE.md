# OpenAI Sora API Access Guide
================================

## Status Atual (Fevereiro 2026)

**Sora API Status:** ❌ **RESTRICTED ACCESS ONLY**

Sora está disponível APENAS para:
- Red teamers (teste de segurança)
- Artistas, designers e cineastas selecionados via **aplicação**

**Não há:**
- ❌ API pública
- ❌ Release date público
- ❌ Workaround por VPN/região
- ❌ Access via waitlist pública

---

## Tentativas de Workaround (TODAS FALHARAM)

| Método | Resultado | Motivo |
|--------|-----------|--------|
| VPN/Proxy | ❌ Funciona | Acesso é por **account-level** (convite), não regional |
| API endpoint direto | ❌ Bloqueado | Precisa de token autenticado aprovado |
| Third-party wrappers | ❌ Não existe | Ninguém tem acesso para criar wrapper |
| Leaked keys | ❌ Risco alto | Against TOS, pode ser banido |

---

## Alternativas DISPONÍVEIS AGORA

### 1. RunwayML Gen-2 ✅ (RECOMENDADO)

**Status:** Disponível via API

**Preço:** $0.20/credit (~1 vídeo de 5s = 5 credits)

**Features:**
- 4-18 seconds videos
- 720p / 1080p
- Text-to-video, image-to-video
- Real-time generation

**API Access:**
```bash
# Site: https://runwayml.com/api
# Key: Obter em https://runwayml.com/account/api-keys
curl -X POST "https://api.runwayml.com/v1/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Barbearia moderna em São Paulo, luzes douradas",
    "duration": 10,
    "resolution": "1080p"
  }'
```

**Wrapper pronto em:**
```
barberzap_python/video_generator.py (model="runway_gen2")
```

---

### 2. Stability AI Video ✅ (RECOMENDADO)

**Status:** API pública disponível

**Preço:** $0.05/second (1080p), $0.02/second (720p)

**Features:**
- 2-25 videos por mês no plano gratuito
- Text-to-video, image-to-video, img2img
- Up to 4K resolution
- Frame-by-frame control

**API Access:**
```bash
# Site: https://platform.stability.ai
# Key: Obter em https://platform.stability.ai/account/keys
curl -X POST "https://api.stability.ai/v2beta/video/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -F "prompt=Barbearia moderna em São Paulo" \
  -F "duration=10"
```

**Wrapper pronto em:**
```
barberzap_python/video_generator.py (model="stability_video")
```

---

### 3. Pika Labs

**Status:** Web-based, API em beta

**Preço:** $8/mo (Pro), $24/mo (Unlimited)

**Features:**
- Text-to-video, image-to-video
- 3-4 seconds default, upgradeable
- Discord integration

**Site:** https://pika.art
**API:** Discord-first, HTTP API em espera

---

### 4. Kaiber AI

**Status:** Web + API

**Preço:** $5/mo (Explorer), $15/mo (Creator)

**Features:**
- Text-to-video, music video
- 16:9, 9:16, 1:1 aspect ratios
- Style presets (anime, cinematic, etc.)

**Site:** https://kaiber.ai
**API:** https://api.kaiber.ai

---

## Cómo Obter Sora Access (Quado Disponível)

### Método 1: Aguardar Release Público

**Estimado:** Q2-Q3 2026 (futuro, incerto)

**Como obter:**
1. Criar conta OpenAI
2. Adicionar cartão de crédito
3. Aguardar release no dashboard

**Preço estimado:** $0.20-$0.50/second

---

### Método 2: Aplicação para Red Teaming (Futuro)

**Quem pode aplicar:**
- Especialistas em segurança AI
- Pesquisadores acadêmicos
- Auditores de moderação

**Como aplicar:**
1. Visitar https://openai.com/red-teaming
2. Submeter portfólio/cv
3. Passar processo de seleção

---

### Método 3: Artist/Filmmaker Program (Futuro)

**Quem pode aplicar:**
- Cineastas
- Videógrafos
- Produtores

**Como aplicar:**
1. Submeter portfolio em https://openai.com/form/sora-access
2. Esperar aprovação (altamente competitivo)

---

## Recomendação Para BarberZap

### HOJE (Imediato):
**Usar Stability AI Video ou RunwayML Gen-2**

**Por quê:**
- ✅ API pública disponível
- ✅ Preço acessível
- ✅ Qualidade profissional
- ✅ Já tem wrapper pronto

**Implementação:**
```python
from video_generator import VideoGenerator, VideoGenerationRequest

# Stability AI
generator = VideoGenerator(
    api_key="STABILITY_API_KEY",
    model="stability_video"
)

request = VideoGenerationRequest(
    prompt="Barbearia moderna em São Paulo, luzes douradas",
    duration=10,
    resolution="1080p"
)

response = generator.generate(request)
print(response.video_url)
```

---

### FUTURO (Quando Sora Disponível):
**Migrar wrapper para Sora quando OpenAI liberar**

**O wrapper já está preparado:**
- Classe `VideoGenerator` suporta múltiplos modelos
- Basta trocar `model="openai_sora"` quando disponível
- Interface uniforme para todos providers

---

## Passos Para Agora:

1. **Obter API key:**
   - Stability AI: https://platform.stability.ai/account/keys
   - RunwayML: https://runwayml.com/account/api-keys

2. **Testar wrapper:**
   ```bash
   cd /root/Barberzap SITE/barberzap_python
   export STABILITY_API_KEY="your-key"
   python3 video_generator.py
   ```

3. **Integrar no dashboard:**
   - Criar nova página "Vídeos"
   - Usar `VideoGenerator` no backend FastAPI
   - Expor endpoint `/api/videos/generate`

---

## Links Úteis

- OpenAI Sora: https://openai.com/sora
- OpenAI Blog Sora: https://openai.com/blog/sora
- Stability AI Video: https://platform.stability.ai/features/video
- RunwayML API: https://runwayml.com/api
- Pika Labs: https://pika.art
- Kaiber AI: https://kaiber.ai

---

[END OF GUIDE]
