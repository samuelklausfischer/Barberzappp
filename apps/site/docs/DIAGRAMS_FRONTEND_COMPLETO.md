# 🔧 ARQUITETURA VISUAL - BARBERZAP FRONTEND (COMPLETO)

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
│           │  2. PAIN POINTS SECTION → 4. HOW IT WORKS → 9. PRICING → │
│           │  ViewPrice Pixel Triggered                               │
│           │                                                           │
│           └──────▶ MULTIPLE CTA CLICKS                               │
│                   │                                                   │
│                   └─► OPEN LEAD MODAL ("Vincule seu Desconto")         │
│                           │                                           │
│                           ▼                                           │
│                   ┌────────────────────┐                            │
│                   │ USER FILLS FORM    │                            │
│                   │ 1. Nome Barbearia   │                            │
│                   │ 2. WhatsApp         │                            │
│                   └──────────┬─────────┘                            │
│                              │                                        │
│                              ▼                                        │
│                        USER CLICKS SUBMIT                            │
│                              │                                        │
│                              ▼                                        │
│                    ┌──────────────────────────────────┐              │
│                    │ POST TO n8n WEBHOOK              │              │
│                    │ {name, whatsapp, plan, value}    │              │
│                    └──────────┬───────────────────────┘              │
│                              │                                       │
│                              ▼                                       │
│                    ┌──────────────────────────────────────────────┐   │
│                    │ n8n: INSERT lead → Track Lead → Send WhatsApp │   │
│                    │ → Return Cakto checkout URL                   │   │
│                    └──────────┬───────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│                    ┌──────────────────────────────────┐              │
│                    │ FRONTEND REDIRECTS TO CAKTO      │              │
│                    │ https://pay.cakto.com.br/psc... │              │
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
           └───┬─ HOME DASHBOARD (Landing Page)
               │
               ├──────► HeroSection
               ├──────► PainPointsSection (3 Cards)
               ├──────► BenefitsSection (3 Cards)
               ├──────► HowItWorksSection (3 Steps)
               ├──────► ComparisonSection (2 Cards)
               ├──────► CompetitorAlertSection
               ├──────► EcosystemSection (3 Cards)
               ├──────► TestimonialsSection + Lightbox Overlay
               ├──────► PricingSection (vagas dynamic)
               ├──────► GuaranteeSection
               ├──────► FAQSection (5 Accordions)
               ├──────► FinalCTASection
               ├──────► Footer
               └──────► OVERLAYS (LeadModal, Notification)

UI COMPONENTS
├─ Button
├─ SectionHeading
├─ ScrollCard (Framer Motion)
└─ AccordionItem

STATE (useState)
├─ vagas: 33
├─ selectedImgIndex: null
├─ leadModalOpen: false
├─ leadData: {name, whatsapp}
├─ isSubmitting: false
├─ notification: null
└─ heroY: useTransform (parallax)
```

---

## 4. FLUXO DE ANIMAÇÕES SCROLLCARD

```
SCROLL POSITION (0 → 1)
        │
        ▼
┌──────────────────────────────┐
│ SCROLL PROGRESS TRANSFORMS    │
│                               │
│ scrollYProgress:  0.0 → 1.0  │
│                               │
│ ├─ SCALE                    │
│ │   0.0 ──► 0.9 (small)      │
│ │   0.5 ──► 1.05 (max)       │
│ │   1.0 ──► 0.9 (small)      │
│ │                           │
│ ├─ OPACITY                  │
│ │   0.0 ──► 0.5             │
│ │   0.5 ──► 1.0             │
│ │   1.0 ──► 0.5             │
│ │                           │
│ └─ GLOW (box-shadow)        │
│     0.0 ──► none            │
│     0.5 ──► gold glow       │
│     1.0 ──► none            │
└──────────────────────────────┘

RESULT: Card enters → grows → glows → shrinks → exits
```

---

## 5. PIPELINE DE TRACKING META PIXEL

```
PAGE LOAD
    │
    ▼
┌─────────────────────┐
│ fbq('init', '175... │  ← Pixel ID
│ fbq('track', 'Page  │  ← Immediate
│  View')             │
└──────────┬──────────┘
           │
           ▼
USER ACTIONS
    │
    ├────► Scroll to Pricing
    │       └─▶ trackEvent('ViewPrice')
    │
    ├────► Click CTA Button
    │       └─▶ trackEvent('Contact', 'whatsapp')
    │
    ├────► Open Lead Modal
    │       └─▶ trackEvent('InitiateCheckout', R$49.90)
    │
    └────► Submit Form (via n8n)
            └─▶ trackEvent('Lead') ✅ CONVERSION

PIXEL DATA FLOW
React → Facebook Pixel Server → Facebook Ads Dashboard
```

---

## 6. GERENCIAMENTO DE ESTADO

```
HOME DASHBOARD STATE

┌─────────────────────────────────┐
│ React.useState Hooks           │
├─────────────────────────────────┤
│ vagas: 33                      │
│ ├─ Pricing progress bar        │
│ ├─ Dynamic urgency display     │
│ └─ [33/50] = 66% remaining     │
│                                 │
│ selectedImgIndex: null         │
│ ├─ null = Lightbox OFF         │
│ ├─ 0-5 = Lightbox ON (image)   │
│ └─ Used in Testimonials gallery│
│                                 │
│ leadModalOpen: false           │
│ ├─ Opens modal on CTA click    │
│ ├─ z-index: 300 (highest)      │
│ └─ AnimatePresence animation   │
│                                 │
│ leadData: {name, whatsapp}     │
│ ├─ Controlled form inputs      │
│ └─ POSTed to n8n on submit     │
│                                 │
│ isSubmitting: false            │
│ ├─ Button loading state        │
│ └─ Prevents double-submit      │
│                                 │
│ notification: {name, city}      │
│ ├─ Random 8-15s trigger        │
│ └─ Social proof fly-in popup   │
│                                 │
│ heroY: useTransform(...)       │
│ └─ Parallax Y offset           │
└─────────────────────────────────┘
```

---

## 7. DIAGRAMA DE INTEGRAÇÕES BACKEND

```
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND INTEGRATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND (React)                                           │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────┐           │
│  │              n8n ORCHESTRATOR               │           │
│  │         (Self-hosted / easypanel)          │           │
│  └────────┬────────┬────────┬────────┬────────┘           │
│           │        │        │        │                    │
│           ▼        ▼        ▼        ▼                    │
│  ┌────────┐ ┌───────┐ ┌──────┐ ┌───────┐                  │
│  │WEBHOOK │ │SUPABASE│ │META  │ │CAKTO  │                  │
│  │/barber-│ │ (DB)   │ │PIXEL │ │PAY    │                  │
│  │ zap    │ │        │ │      │ │       │                  │
│  └───┬────┘ └───┬────┘ └──┬───┘ └───┬───┘                  │
│      │          │          │         │                      │
│      │          │          │         ▼                      │
│      │          │          │   ┌──────────┐                  │
│      │          │          │   │ Checkout │                  │
│      │          │          │   │ /payment │                  │
│      │          │          │   └──────────┘                  │
│      │          │          │                                 │
│      ▼          ▼          ▼                                 │
│  ┌─────────────────────────────┐                             │
│  │ DATASETS                    │                             │
│  ├─ leads (105 rows)          │                             │
│  ├─ messages (1518 rows)      │                             │
│  ├─ agents (5 rows)           │                             │
│  ├─ plans (5 rows)            │                             │
│  └─ Evolution API (WhatsApp)  │                             │
│  └─────────────────────────────┘                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

FLOW: Form Submit → n8n → Supabase + Pixel + WhatsApp → Cakto Redirect
```

---

## 8. DESIGN SYSTEM VISUAL

```
COLOR PALETTE
═══════════════════════════════════════════════════════════════════════

PRIMARY (Gold)        BACKGROUND (Dark)      FOREGROUND (White)
███████████████       ░░░░░░░░░░░░░░         ████████████████████
╔═══════════╗          ░░░░░░░░░░░░░░         ████ TEXT ████
║  PRIMARY  ║          ╔═══════════╗          ╔═══════════╗
║           ║          ║  DARK BG  ║          ║  WHITE    ║
║  #FFC000  ║          ║  #0D0D0D  ║          ║  #F2F2F2  ║
╚═══════════╝          ╚═══════════╝          ╚═══════════╝

DESTRUCTIVE (Red)       MUTED (Gray)
▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒
╔═══════════╗          ╔═══════════╗
║  RED      ║          ║  GRAY     ║
║  #7F1D1D  ║          ║  #8A8A8A  ║
╚═══════════╝          ╚═══════════╝

═══════════════════════════════════════════════════════════════════════

TYPOGRAPHY SCALE
═══════════════════════════════════════════════════════════════════════

HERO H1 (72px mobile, 96px desktop)
┌────────────────────────────────────────────┐
│                                            │
│  DEIXE DE SER O BARBEIRO DO ZAP ITALIC    │
│  font-black italic tracking-tighter        │
│                                            │
└────────────────────────────────────────────┘

SECTION HEADING (30px mobile, 48px desktop)
┌─────────────────────────────┐
│                             │
│  O CONTRASTE                │
│  text-3xl font-black italic │
│  uppercase                  │
│                             │
└─────────────────────────────┘

BODY TEXT
┌─────────────────────────────────┐
│                                 │
│ O cliente resolve tudo dentro  │
│ do SEU WhatsApp...             │
│ text-base leading-relaxed       │
│                                 │
└─────────────────────────────────┘

MIC LABEL (badges)
┌──────────────┐
│ OFERTA LI... │  text-[10px] uppercase
└──────────────┘  tracking-widest font-black

BUTTON
┌──────────────────────────────────────────────────┐
│                                                  │
│    QUERO ORGANIZAR MINHA BARBEARIA       ◄       │
│    ↓ gradient amber-500 → orange-500              │
│    px-4 py-3 rounded hover:opacity-90            │
│                                                  │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════

COMPONENT STYLES
═══════════════════════════════════════════════════════════════════════

CARD (ScrollCard)
╔══════════════════════════════════════════════════╗
║                                                  ║
║     ⚡ AGILIDADE                                 ║
║                                                  ║
║  Seus clientes são atendidos na hora             ║
║  sem espera.                                     ║
║                                                  ║
║  bg-card border rounded-[2rem] p-8              ║
║  └─► scales + glows on scroll                   ║
║                                                  ║
╚══════════════════════════════════════════════════╝

PRICING CARD
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║          ┌─────────────────────────────┐             ║
║          │       DE R$ 99,90           │ strikethrough║
║          └─────────────────────────────┘             ║
║                                                       ║
║              R$ 49 ,90  / mês                         ║
║            ┌───────────────────────┐                 ║
║            │    QUERO              │                 ║
║    ╔════════╧═════════════════════╧══════╗          ║
║    ║    PROFISSIONALIZAR MINHA BARBEARIA   ║          ║
║    ╚════════════════════════════════════════╝          ║
║                                                       ║
║  ← gold glow pulse animation                          ║
║  border-4 border-primary rounded-[3rem]               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

SECTION HEADING PATTERN
          ╔═══════════════╗
          ║ ECOCOSSITEMA  ║  text-[10px] badge

              O BARBERZAP É MUITO MAIS
            QUE UMA IA NO WHATSAPP

      Você ganha um centro de comando para
         dominar todos os números da barbearia

═══════════════════════════════════════════════════════════════════════

SPECIAL EFFECTS
═══════════════════════════════════════════════════════════════════════

TEXT GRADIENT GOLD
    ┌───────────────────────────────────────────┐
    │  DEIXE DE SER                              │
    │  O ──▶ gradient yellow-600 → 400 → 600    │
    │     BARBEIRO DO ZAP                       │
    │  ──▶ bg-clip-text text-transparent        │
    └───────────────────────────────────────────┘

GLOW EFFECT (ScrollCard at center peak)
    ╔═════════════════╗
    ║   ◉◉◉ CARD ◉◉◉  ║  ← box-shadow gold
    ║      ◉◉◉   ║       0px 0px 40px rgba(234,179,8,0.25)
    ╚═════════════════╝
           ↑
      (scroll center)

PULSE ANIMATION (Guarantee Badge)
      ╔═══════════╗
      ║           ║  ← 2s infinite
      ║    7      ║     scale: 1 → 1.02
      ║ DIAS DE   ║     opacity: 1 → 0.8 → 1
      ║ TESTE     ║     drop-shadow gold pulse
      ║ GRÁTIS    ║
      ╚═══════════╝

INFINITE MARQUEE (Testimonials Gallery)
    [IMG1] [IMG2] [IMG3] [IMG4] [IMG5] [IMG6] ║
    ◄◄◄◄◄◄ 30s linear infinite  ◄◄◄◄◄◄
    [IMG1] [IMG2] [IMG3] [IMG4] [IMG5] [IMG6] (loop)
     ▲                 ▲
     └───────┴─────────┘
    (duplicated for continuous loop)

═══════════════════════════════════════════════════════════════════════
```

---

## ═══════════════════════════════════════════════════════════════════════

**RESUMO ESTATÍSTICO**

- **Seções da LP:** 14
- **Componentes UI:** 4 reutilizáveis
- **Total Linhas:** ~1,160
- **Animações:** 50+ Framer Motion
- **Icons:** 25+ Lucide React
- **Rotas:** 13 (12 protegidas)
- **Pixel ID:** 1757123869009394
- **Webhook:** /webhook/barberzap

---

**Documentos Complementares:**
- `LANDFRONT_BARBERZAP.md` - Análise textual completa (26KB)
- `README.md` - Visão geral do projeto

**Diagramas Apresentados:** 8 ASCII art diagrams

---

**© 2026 BarberZap - Frontend Analysis**
**Version 1.0 - 2026-02-26**
