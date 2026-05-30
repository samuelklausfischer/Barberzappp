# Especificação Visual Técnica: Landing Page Barberzap

Este documento detalha 100% da estrutura visual, estilos, tipografia e animações da Landing Page atual. O objetivo é fornecer um mapa completo de UI/UX para análise e sugestão de melhorias estéticas.

---

## 1. Identidade Visual e Paleta de Cores (Dark Gold Theme)
O site utiliza um tema **Dark Mode** com foco em tons de ouro e contrastes profundos.

*   **Background Principal:** `HSL(20, 14.3%, 4.1%)` - Um preto levemente aquecido (Off-black).
*   **Cor Primária (Gold):** `HSL(45, 100%, 50%)` - Ouro vibrante, usado em botões, ícones e destaques.
*   **Cor Secundária (Cards):** `HSL(24, 9.8%, 10%)` - Grafite escuro para profundidade.
*   **Acento Destrutivo:** `HSL(0, 62.8%, 30.6%)` - Vermelho profundo usado na seção de "Dores".
*   **Bordas:** `HSL(240, 3.7%, 15.9%)` - Cinza escuro sutil para separação de seções e componentes.
*   **Gradientes:**
    *   `text-gradient-gold`: Gradiente linear do Ouro Escuro (`yellow-600`) para o Ouro Claro (`yellow-400`).
    *   `bg-gradient-radial`: Radiais de luz `primary/10` no fundo para evitar o aspecto "chapado".

---

## 2. Tipografia e Estilos de Texto
O sistema utiliza a fonte padrão `sans-serif` (inter/system), com estilização pesada via classes:

*   **Headlines (H1):** `text-4xl` a `text-8xl`, `font-black` (peso 900), `italic`, `tracking-tighter`, `uppercase`. O objetivo é agressividade e impacto visual.
*   **Subtitles (H2/H3):** `text-3xl` a `text-5xl`, `font-black`, `italic`, `leading-tight`.
*   **Corpo de Texto (P):** `text-lg` a `text-2xl`, `text-muted-foreground` (cinza claro), `font-medium`.
*   **Badges:** Etiquetas pequenas em `uppercase`, `font-bold`, `tracking-[0.2em]`, com fundo `primary/10` e borda sutil.

---

## 3. Componentes e Layout (UI)

### A. Botões (CTA)
*   **Hero/Principal:** Grande (`px-10`, `py-4`), `rounded-lg`, fundo Ouro, sombra projetada (`shadow-2xl`), animação de pulso constante.
*   **Ghost/Outline:** Bordas `primary/20`, texto Ouro, fundo transparente com hover de brilho suave.
*   **Efeito Hover:** Escalonamento suave (`scale-105`) e aumento do brilho da sombra.

### B. Cards e Containers
*   **Arredondamento:** Uso de bordas extremamente arredondadas (`rounded-[2rem]` e `rounded-[3rem]`) para um look moderno e amigável.
*   **Glassmorphism:** Uso de `backdrop-blur-lg` e `bg-background/90` na Navbar e em alguns cards sobrepostos.
*   **Bordas de Destaque:** A seção de oferta usa uma borda mais grossa (`border-4`) em Ouro para isolamento visual total.

### C. Seções Específicas
*   **Navbar:** Fixa, transparente ao topo, torna-se sólida com desfoque de fundo ao rolar o scroll.
*   **Simulador de ROI:** Sliders (`input range`) personalizados com cor Ouro e Vermelho. Cards de resultado com sombras internas.
*   **Infográfico:** Fluxo horizontal no desktop com setas de conexão sutis e ícones centralizados em "caixas de vidro".
*   **Mosaico de Prints:** Grid irregular com efeito de zoom no hover para simular profundidade de interface.

---

## 4. Animações e Micro-interações (Framer Motion)
O site é dinâmico e reage ao comportamento do usuário:

*   **Entrada (On Scroll):** A maioria das seções usa `initial={{ opacity: 0, y: 30 }}` e `whileInView={{ opacity: 1, y: 0 }}` com transições suaves de 0.5s a 0.8s.
*   **Pulso Dourado (`animate-pulse-gold`):** Aplicado nos preços e botões principais para guiar o olho do usuário (foco em conversão).
*   **Bounce Lento:** Aplicado em elementos flutuantes (como o selo de agendamento concluído) para dar sensação de "vida" ao site.
*   **Navbar:** Transição de `py-5` para `py-3` e de transparente para desfocado baseada no `scrollY`.

---

## 5. Responsividade (Mobile First)
*   **Mobile:** Coluna única em 100% dos cards. Fontes de H1 reduzidas para `text-4xl`. Menu hambúrguer com animação lateral.
*   **Desktop:** Grids de 2 a 3 colunas. Uso extensivo de `max-w-6xl` para centralização.
*   **Espaçamento:** Paddings generosos (`py-24`) entre seções para garantir o "respiro" visual.

---

## 6. Sinais de Confiança Visual
*   Ícones da biblioteca `lucide-react` com cores temáticas.
*   Representação de bandeiras de cartão em estilo minimalista (apenas texto em caixas translúcidas).
*   Barra de progresso de vagas com gradiente linear animado.
