# 🔧 ARQUITETURA VISUAL - BARBERZAP FRONTEND

**Documentos de Diagramas ASCII para Notebook LM**

---

## 📋 ÍNDICE

1. [Diagrama de Arquitetura Completa](#1-diagrama-de-arquitetura-completa)
2. [Fluxo do Usuário na Landing Page](#2-fluxo-do-usuário-na-landing-page)
3. [Árvore de Componentes](#3-árvore-de-componentes)
4. [Fluxo de Animações ScrollCard](#4-fluxo-de-animações-scrollcard)
5. [Pipeline de Tracking Meta Pixel](#5-pipeline-de-tracking-meta-pixel)
6. [Gerenciamento de Estado](#6-gerenciamento-de-estado)
7. [Diagrama de Integrações Backend](#7-diagrama-de-integrações-backend)
8. [Design System Visual](#8-design-system-visual)

---

## 1. DIAGRAMA DE ARQUITETURA COMPLETA

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           BARBERZAP FULL ARCHITECTURE                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────┐      ┌──────────────────┐      ┌────────────────┐ │
│  │   VISITORS       │      │   BROWSER        │      │   CLOUD INFRA  │ │
│  │  (Mobile/Desktop)│─────▶│   (Chrome/Edge)  │─────▶│   (Vercel/etc) │ │
│  └──────────────────┘      └────────┬─────────┘      └────────┬───────┘ │
│                                      │                         │         │
│                                      ▼                         │         │
│                           ┌────────────────────┐              │         │
│                           │  BARBERZAP SITE    │              │         │
│                           │  (React SPA)       │◀─────────────┘         │
│                           └────────┬───────────┘                        │
│                                    │                                     │
│                    ┌───────────────┼───────────────┐                    │
│                    │               │               │                    │
│                    ▼               ▼               ▼                    │
│         ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐        │
│         │   LANDING PAGE  │ │   DASHBOARD  │ │  AUTH LOGIN  │        │
│         │  HomeDashboard  │ │ (CRM/Config) │ │  LoginPage   │        │
│         └────────┬────────┘ └──────────────┘ └──────────────┘        │
│                  │                                                   │
│        ┌─────────┴─────────┐                                         │
│        │  14 SECTIONS      │                                         │
│        │  (Hero → Footer)  │                                         │
│        └─────────┬─────────┘                                         │
│                  │                                                   │
│         ┌────────┴────────┐                                         │
│         │  UI COMPONENTS  │                                         │
│         │  • Button       │                                         │
│         │  • ScrollCard   │                                         │
│         │  • SectionHdg   │                                         │
│         │  • Accordion    │                                         │
│         └────────┬────────┘                                         │
│                  │                                                   │
│                  ▼                                                   │
│         ┌──────────────────┐                                        │
│         │  STATE MANAGER   │                                        │
│         │  (React Hooks)   │                                        │
│         └────────┬─────────┘                                        │
│                  │                                                   │
│                  ▼                                                   │
│         ┌──────────────────┐                                        │
│         │  ANIMATION LIB   │                                        │
│         │  Framer Motion   │                                        │
│         └────────┬─────────┘                                        │
│                  │                                                   │
│                  ▼                                                   │
│         ┌──────────────────┐                                        │
│         │  CSS FRAMEWORK   │                                        │
│         │  Tailwind CSS    │                                        │
│         └────────┬─────────┘                                        │
│                  │                                                   │
│                  ▼                                                   │
│         ┌──────────────────────────────────────────┐                │
│         │         INTEGRAÇÕES EXTERNAS             │                │
│         ├──────────────────────────────────────────┤                │
│         │                                          │                │
│         │  ┌─────────────┐  ┌─────────────────┐   │                │
│         │  │ META PIXEL  │  │  n8n WEBHOOK    │   │                │
│         │  │   (1757...)  │  │  /barberzap     │   │                │
│         │  └──────┬──────┘  └────────┬────────┘   │                │
│         │         │                  │            │                │
│         │         ▼                  ▼            │                │
│         │  ┌─────────────┐  ┌─────────────────┐   │                │
│         │  │  ANALYTICS  │  │   SUPABASE DB   │   │                │
│         │  │  (Tracking) │  │  • leads (105)  │   │                │
│         │  └─────────────┘  │  • messages     │   │                │
│         │                  │  • agents       │   │                │
│         │                  └────────┬────────┘   │                │
│         │                           │            │                │
│         │                  ┌────────▼────────┐   │                │
│         │                  │ EVOLUTION API   │   │                │
│         │                  │ (WhatsApp)      │   │                │
│         │                  └────────┬────────┘   │                │
│         │                           │            │                │
│         │                  ┌────────▼────────┐   │                │
│         │                  │   CAKTO CHECKOUT │   │                │
│         │                  │   Pay Gateway    │   │                │
│         │                  └─────────────────┘   │                │
│         └──────────────────────────────────────┘                │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. FLUXO DO USUÁRIO NA LANDING PAGE

```
┌──────────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY ON BARBERZAP LP                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  VISITOR                                                             │
│    │                                                                 │
│    │  1. LANDS ON HOMEPAGE                                          │
│    │     └─▶ PageView Pixel Event                                   │
│    │                                                                  │
│    ▼                                                                 │
│  ┌──────────────────────────────────────────┐                       │
│  │ HERO SECTION                             │                       │
│  │ • Headline Impactful                     │                       │
│  │ • "Deixe de ser o Barbeiro do Zap"       │                       │
│  │ • CTA: "Quero organizar minha barbearia" │                       │
│  └────────┬─────────────────────────────────┘                       │
│           │                                                           │
│           ├──▶ SCROLL DOWN (Explore Content)                         │
│           │                                                           │
│           │  2. PAIN POINTS SECTION                                  │
│           │     ├─ "O som do dinheiro indo embora"                   │
│           │     ├─ "Cadeira vazia que custa caro"                    │
│           │     └─ "Barbeiro ou atendente?"                          │
│           │                                                           │
│           │  3. BENEFITS SECTION                                     │
│           │     ├─ Agilidade                                         │
│           │     ├─ Mais Foco                                         │
│           │     └─ Organização                                       │
│           │                                                           │
│           │  4. HOW IT WORKS SECTION                                 │
│           │     ├─ 01. Conecte seu WhatsApp                         │
│           │     ├─ 02. Configure suas Regras                        │
│           │     └─ 03. Atenda com Foco Total                        │
│           │                                                           │
│           │  5. COMPARISON SECTION                                   │
│           │     ├─ O Jeito Amateur ❌                                │
│           │     └─ O Jeito BarberZap ✅                              │
│           │                                                           │
│           │  6. COMPETITOR ALERT SECTION                             │
│           │     └─ Warning: Apps externos roubam clientes           │
│           │                                                           │
│           │  7. ECOSYSTEM SECTION                                   │
│           │     ├─ Recuperação Ativa                                │
│           │     ├─ Controle Financeiro                              │
│           │     └─ Inovação Constante                               │
│           │                                                           │
│           │  8. TESTIMONIALS SECTION                                │
│           │     ├─ 3 depoimentos principais                         │
│           │     ├─ Galeria de resultados (marquee)                   │
│           │     └─ 6 feature tags listed                            │
│           │                                                           │
│           │  9. PRICING SECTION                                     │
│           │     ├─ Progress bar (vagas restantes)                   │
│           │     ├─ Valor De R$99,90 → R$49,90                        │
│           │     ├─ CTA: "Quero Profissionalizar"                    │
│           │     └─ ViewPrice Pixel Triggered                         │
│           │                                                           │
│           │  10. GUARANTEE SECTION                                   │
│           │     └─ 7 Dias de Teste Grátis                           │
│           │                                                           │
│           │  11. FAQ SECTION                                        │
│           │     └─ 5 Perguntas Frequentes                           │
│           │                                                           │
│           │  12. FINAL CTA SECTION                                   │
│           │     └─ "Tenha mais foco no seu corte"                    │
│           │                                                           │
│           └──────▶ MULTIPLE CTA CLICKS                               │
│                   │                                                   │
│                   ├─▶ Hero CTA Click → Contact Pixel                 │
│                   ├─▶ Benefits CTA → Contact Pixel                   │
│                   ├─▶ HowItWorks CTA → Contact Pixel                 │
│                   ├─▶ Pricing CTA → Contact Pixel + ViewPrice        │
│                   └─▶ Final CTA → Contact Pixel                      │
│                                                                      │
│                      ALL CTAs OPEN: LEAD MODAL                        │
│                           │                                           │
│                           ▼                                           │
│                   ┌─────────────────────┐                           │
│                   │   LEAD MODAL        │                           │
│                   │   ("Vincule seu     │                           │
│                   │    Desconto 🚀")    │                           │
│                   └──────────┬──────────┘                           │
│                              │                                       │
│                              ▼                                       │
│                    ┌────────────────────┐                            │
│                    │ USER FILLS FORM    │                            │
│                    │ ─────────────────   │                            │
│                    │ 1. Nome Barbearia   │                            │
│                    │ 2. WhatsApp         │                            │
│                    └──────────┬─────────┘                            │
│                               │                                        │
│                               ▼                                        │
│                         USER CLICKS SUBMIT                            │
│                               │                                        │
│                               ▼                                        │
│                    ┌────────────────────┐                             │
│                    │ INITIATECHECKOUT    │                             │
│                    │ PIXEL TRIGGERED     │                             │
│                    │ (R$49.90, BRL)      │                             │
│                    └──────────┬─────────┘                             │
│                               │                                        │
│                               ▼                                        │
│                    ┌──────────────────────────────────┐              │
│                    │ POST TO n8n WEBHOOK              │              │
│                    │ /webhook/barberzap               │              │
│                    │ {                                 │              │
│                    │   name: "Barbearia Exemplo",      │              │
│                    │   whatsapp: "(11) 99999-9999",   │              │
│                    │   plan: "promocional"            │              │
│                    │ }                                 │              │
│                    └──────────┬───────────────────────┘              │
│                               │                                       │
│                               ▼                                       │
│                    ┌──────────────────────────────────────────────┐   │
│                    │ n8n WORKFLOW ACTIONS                         │   │
│                    ├──────────────────────────────────────────────┤   │
│                    │ 1. Validate payload                         │   │
│                    │ 2. Check Supabase for existing lead         │   │
│                    │ 3. INSERT into leads table                  │   │
│                    │ 4. LEAD PIXEL Event triggered               │   │
│                    │ 5. Send WhatsApp welcome (Evolution API)    │   │
│                    │ 6. Return Cakto checkout URL to frontend    │   │
│                    └──────────┬───────────────────────────────────┘   │
│                               │                                       │
│                               ▼                                       │
│                    ┌──────────────────────────────────┐              │
│                    │ FRONTEND REDIRECTS TO CAKTO      │              │
│                    │ https://pay.cakto.com.br/psc... │              │
│                    └──────────┬───────────────────────┘              │
│                               │                                        │
│                               ▼                                        │
│                    ┌──────────────────────────────────┐              │
│                    │ USER COMPLETES PAYMENT           │              │
│                    │ (Cakto Checkout)                 │              │
│                    └──────────┬───────────────────────┘              │
│                               │                                        │
│                               ▼                                        │
│                    ┌──────────────────────────────────┐              │
│                    │ CAKTO PURCHASE WEBHOOK → n8n     │              │
│                    │ (Activate account, send access)  │              │
│                    └──────────────────────────────────┘              │
│                                                                      │
│                              ✅ CONVERSION                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. ÁRVORE DE COMPONENTES

```
App
└─┬─ BrowserRouter
  └─┬─ Routes
    ├────► /login → LoginPage
    └────► / → ProtectedRoute → HomeDashboard
           │
           └───┬─ HOME DASHBOARD (Landing Page Orchestrator)
               │  ┌──────────────────────────────────────────┐
               │  │ STATE MANAGEMENT                         │
               │  │ • vagas: 33                               │
               │  │ • selectedImgIndex: null                 │
               │  │ • leadModalOpen: false                   │
               │  │ • leadData: {name, whatsapp}             │
               │  │ • isSubmitting: false                    │
               │  │ • notification: null                     │
               │  │ • heroY: useTransform (parallax)         │
               │  └──────────────────────────────────────────┘
               │
               ├──────► HeroSection [props: heroY, openLeadModal]
               │            └─ Badge + H1 + H2 + CTA + HeroImage
               │
               ├──────► PainPointsSection
               │            └─ 3 Cards ScrollCard (pain)
               │
               ├──────► BenefitsSection
               │            └─ 3 Cards ScrollCard (benefits)
               │
               ├──────► HowItWorksSection
               │            └─ 3 Steps (SVG icons + arrows)
               │
               ├──────► ComparisonSection
               │            └─ 2 Large Cards (Amateur vs Pro)
               │
               ├──────► CompetitorAlertSection
               │            └─ Alert panel + mockup
               │
               ├──────► EcosystemSection
               │            └─ 3 Feature Cards
               │
               ├──────► TestimonialsSection [galleryImages, setSelectedImgIndex]
               │            ├─ 3 Testimonial cards ScrollCard
               │            ├─ Gallery marquee infinite
               │            └─ ImageLightbox (overlay if selectedImgIndex)
               │
               ├──────► PricingSection [vagas, priceRef, openLeadModal]
               │            ├─ Urgency banner + progress bar
               │            ├─ Pricing card (animated glow)
               │            └─ 3 Feature cards
               │
               ├──────► GuaranteeSection
               │            └─ Badge pulse + content
               │
               ├──────► FAQSection
               │            └─ 5 AccordionItem
               │
               ├──────► FinalCTASection [openLeadModal]
               │            └─ Button CTA
               │
               ├──────► Footer
               │            └─ Logo + links + disclaimer + legal
               │
               └──────► OVERLAYS (Conditionals)
                    ├─ LeadModal [isOpen: leadModalOpen...]
                    │    └─ Form: Barbearia Name + WhatsApp
                    │
                    └─ SocialProofNotification [notification]
                         └─ Fly-in popup (random timing)

UI COMPONENTS (Reusable)
├─ Button [variant, size, children]
├─ SectionHeading [badge, title, subtitle]
├─ ScrollCard [children, className] ← Uses Framer Motion
└─ AccordionItem [question, answer]

DASHBOARD ROUTES (Protected)
├─ /dashboard/agenda → Agenda
├─ /dashboard/horarios → Horarios
├─ /dashboard/clientes → Clientes
├─ /dashboard/servicos → Servicos
├─ /dashboard/funcionarios → Funcionarios
├─ /dashboard/financeiro → Financeiro
├─ /dashboard/whatsapp → WhatsApp
├─ /dashboard/ia → IAConfig
├─ /dashboard/aparencia → Aparencia
└─ /dashboard/settings → Settings
```

---

## 4. FLUXO DE ANIMAÇÕES SCROLLCARD

```
┌──────────────────────────────────────────────────────────────────────┐
│                   SCROLLCARD ANIMATION FLOW                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SCROLL POSITION (User scrolls down page)                           │
│       │                                                             │
│       ▼                                                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ SCROLL PROGRESS (0 → 1)                                    │    │
│  │                                                             │    │
│  │  0.0 ───────────────────────────────────────────────── 1.0 │    │
│  │  ↑                                                           │    │
│  │  │                                                           │    │
│  │  └─ scrollYProgress (Framer useScroll)                      │    │
│  │                                                             │    │
│  │  Offset: ["start end", "center center", "end start"]       │    │
│  │                                                             │    │
│  │  ┌──────────────────────────────────────────────────┐      │    │
│  │  │ viewport thresholds                              │      │    │
│  │  │                                                  │      │    │
│  │  │  ┌────────────┐                                │      │    │
│  │  │  │ CARD ENTERS├─► START offset                 │      │    │
│  │  │  └────────────┘                                │      │    │
│  │  │        │                                       │      │    │
│  │  │        ▼ (continues scroll)                    │      │    │
│  │  │  ┌────────────┐                                │      │    │
│  │  │  │CARD PEAKS  ├─► CENTER offset                │      │    │
│  │  │  └────────────┘                                │      │    │
│  │  │        │                                       │      │    │
│  │  │        ▼ (continues scroll)                    │      │    │
│  │  │  ┌────────────┐                                │      │    │
│  │  │  │CARD EXITS  ├─► END offset                   │      │    │
│  │  │  └────────────┘                                │      │    │
│  │  └──────────────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│       │                                                             │
│       └─► scrollYProgress transforms to visual properties          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ SCALE ANIMATION (useTransform)                              │    │
│  │                                                             │    │
│  │  scroll:      0.0      0.5      1.0                        │    │
│  │              ──┼───────┼───────┼──                         │    │
│  │  scale:      0.9     1.05     0.9                         │    │
│  │              │        │        │                           │    │
│  │   enter─────┼────────┼────────┼────exit                   │    │
│  │   (small)   │   PEAK │   (small)                         │    │
│  │            │   (max) │                                   │    │
│  │                                                             │    │
│  │  ╭───────╮              ┌─────────────┐              ╭──────╮ │    │
│  │  │ CARD ╱│───────────▶ │   CARD MAX  │──────────▶ │ CARD │ │    │
│  │  │      ╲│             │   SCALE     │             │      │ │    │
│  │  ╰───────╯ (90%)       ╰─────┬───────╯ (105%)      ╰──────╯ │    │
│  │                                │                              │    │
│  │                                └─ Gold glow active            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ OPACITY ANIMATION (useTransform)                            │    │
│  │                                                             │    │
│  │  scroll:      0.0  0.2  0.5  0.8  1.0                      │    │
│  │              ──┼───┼───┼───┼──                           │    │
│  │  opacity:    0.5 0.8 1.0 0.8 0.5                         │    │
│  │              │    │    │    │   │                         │    │
│  │  ──────────fade-in──fadeIn─fade-out────────               │    │
│  │              (becomes visible) (starts fading)            │    │
│  │                                                             │    │
│  │  CARD OPACITY OVER SCROLL                                   │    │
│  │  ░░ 50%      ▒▒▒ 80%  ███ 100%  ▒▒▒ 80%  ░░ 50%           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ GLOW/SHADOW ANIMATION (useTransform)                        │    │
│  │                                                             │    │
│  │  scroll:      0.0                0.5                1.0   │    │
│  │              ──┼─────────────────┼─────────────────┼─     │    │
│  │  shadow:    0px 0px 0px    0px 0px 40px    0px 0px 0px    │    │
│  │             α(234,179,8,0)  α(234,179,8,0.25) α(234,179,8,0)│    │
│  │                              │                              │    │
│  │                no glow         GOLD GLOW        no glow    │    │
│  │                                ◉◉◉                           │    │
│  │                                ⟡⟡                            │    │
│  │                                                             │    │
│  │  ════       ════════════    ════════════    ════            │    │
│  │  CARD       CARD            CARD            CARD              │    │
│  │  (plain)    (golden glow)   (golden glow)   (plain)          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  RESULT: Card grows, brightens, and shines as it reaches viewport   │
│  center, then shrinks back as it leaves (parallax-like feel)       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. PIPELINE DE TRACKING META PIXEL

```
┌──────────────────────────────────────────────────────────────────────┐
│                   META PIXEL TRACKING PIPELINE                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BROWSER LOAD                                                        │
│       │                                                             │
│       ▼                                                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ PIXEL INIT (Facebook Pixel Code)                           │    │
│  │                                                             │    │
│  │  fbq('init', '1757123869009394');                           │    │
│  │  └─▶ Associates current page session with Pixel            │    │
│  │                                                             │    │
│  │  fbq('track', 'PageView');                                 │    │
│  │  └─▶ Immediate tracking event                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│       │                                                             │
│       ▼                                                             │
│  USER INTERACTIONS (Tracking Events Triggered)                      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 1. SCROLL-BASED EVENTS                                    │    │
│  │                                                             │    │
│  │  User scrolls to Pricing section                          │    │
│  │  └─▶ trackEvent('ViewPrice') [custom event]                │    │
│  │  └─▶ Facebook: "User viewed pricing page"                  │    │
│  │                                                             │    │
│  │  User scrolls to FAQ section                              │    │
│  │  └─▶ trackEvent('ViewContent', {content_name: 'FAQ'})     │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 2. CLICK-BASED EVENTS                                     │    │
│  │                                                             │    │
│  │  User clicks ANY CTA button                               │    │
│  │  └─▶ trackEvent('Contact', {content_name: 'whatsapp'})    │    │
│  │  └─▶ Facebook: "User initiated contact"                   │    │
│  │  └─▶ Opens LeadModal                                      │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 3. CONVERSION EVENTS                                       │    │
│  │                                                             │    │
│  │  LeadModal opens                                           │    │
│  │  └─▶ trackEvent('InitiateCheckout',                        │    │
│  │        {value: 49.90, currency: 'BRL'})                    │    │
│  │  └─▶ Facebook: "User initiated checkout"                  │    │
│  │                                                             │    │
│  │  User submits form successfully                           │    │
│  │  └─▶ POST to n8n webhook ← lead data                       │    │
│  │  └─▶ n8n processes lead                                    │    │
│  │  └─▶ n8n triggers: trackEvent('Lead')                      │    │
│  │  └─▶ Facebook: "User submitted a lead" ✅                │    │
│  │  └─▶ REDIRECT to Cakto checkout                            │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ PIXEL DATA FLOW                                            │    │
│  │                                                             │    │
│  │  Frontend (React)     Pixel Server      Facebook Ads        │    │
│  │       │                    │                  │             │    │
│  │   fbq() ──────────────▶ ◉ ────────────────▶ Analytics ◉   │    │
│  │   trackEvent()        │  (collecting)       (reporting)    │    │
│  │                        │                  │               │    │
│  │                        ▼                  ▼               │    │
│  │                   Event Queue         Campaign Reports    │    │
│  │                   (processed)          (conversions)      │    │
│  │                                                             │    │
│  │  [PageView] ────────────────────── 100% of visitors        │    │
│  │  [ViewPrice] ───────────────────── ~70% scroll to pricing   │    │
│  │  [Contact] ─────────────────────── ~30% click CTA          │    │
│  │  [InitiateCheckout] ───────────── ~15% open modal          │    │
│  │  [Lead] ───────────────────────── ~5-8% conversion rate    │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  FACEBOOK PIXEL DASHBOARD                                           │
│       │                                                             │
│       ▼                                                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ CAMPAIGN PERFORMANCE                                        │    │
│  │                                                             │    │
│  │  ■ Impressions: PageView count                              │    │
│  │  ■ Reach: Unique visitors (fingerprinted)                    │    │
│  │  ■ Clicks: CTA button clicks                               │    │
│  │  ■ Conversions: Lead events                                 │    │
│  │  ■ Cost per Lead: Budget / Leads                           │    │
│  │  ■ ROAS: Revenue from ads / Ad spend                       │    │
│  │                                                             │    │
│  │  Funnel Visualization:                                      │    │
│  │  PageView ──► ViewPrice ──► Lead ──► Purchase              │    │
│  │     100%        70%         8%       5%                    │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. GERENCIAMENTO DE ESTADO

```
┌──────────────────────────────────────────────────────────────────────┐
│                STATE MANAGEMENT IN HOMEDASHBOARD                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HOME DASHBOARD COMPONENT (Orchestrator)                            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ REACT.useState HOOKS                                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│       │                                                             │
│       ├─► vagas (number) = useState(33)                            │
│       │   │                                                         │
│       │   └─▶ DISPLAY: "Restam apenas {vagas}"                      │
│       │   └─▶ PROGRESS BAR: (vagas / 50) * 100%                    │
│       │   └─▶ USAGE: Pricing section urgency                        │
│       │                                                           │
│       ├─► selectedImgIndex (number | null) = useState(null)        │
│       │   │                                                         │
│       │   ├─▶ null: Lightbox OFF                                   │
│       │   ├─▶ 0-5: Lightbox ON showing image at index              │
│       │   └─▶ USAGE: TestimonialsSection gallery                   │
│       │                                                           │
│       ├─► leadModalOpen (boolean) = useState(false)                │
│       │   │                                                         │
│       │   ├─▶ false: Modal hidden                                   │
│       │   ├─▶ true: Modal visible (z-index: 300)                    │
│       │   └─▶ USAGE: Controlled by CTA clicks                      │
│       │                                                           │
│       ├─► leadData (object) = useState({                           │
│       │       name: '',                                           │
│       │       whatsapp: ''                                       │
│       │   })                                                      │
│       │   │                                                         │
│       │   └─▶ Controlled inputs in LeadModal                       │
│       │   └─▶ OnSubmit → POST to n8n webhook                      │
│       │                                                           │
│       ├─► isSubmitting (boolean) = useState(false)                 │
│       │   │                                                         │
│       │   ├─▶ false: Button shows normal text                      │
│       │   ├─▶ true: Button shows "Vinculando..." + disabled        │
│       │   └─▶ Prevents double-submission                           │
│       │                                                           │
│       ├─► notification (object | null) = useState(null)            │
│       │   │                                                         │
│       │   ├─▶ {name: "João Silva", city: "São Paulo"}              │
│       │   ├─▶ null: No notification showing                         │
│       │   ├─▶ Random timing (8-15s via useEffect)                  │
│       │   └─▶ Social proof popup (fly-in)                          │
│       │                                                           │
│       └─► heroY (MotionValue)                                      │
│           │                                                         │
│           └─�