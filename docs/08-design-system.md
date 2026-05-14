# 08 — Design System (AXON v1.0)

> Identidade visual completa renderizada em `public/brand/brand-book.html` (abra no navegador).
> Tokens prontos em `public/brand/tokens.css` e `public/brand/tokens.json`.

## Filosofia

**Minimalismo técnico com personalidade biológica.**

- **Mobile-first.** 80% dos compradores no celular.
- **Preto + papel + 1 acento único.** Sem competição cromática.
- **Velocidade.** Animações <200ms, transições com easing `out`.
- **Confiável e direto.** Sem fofura corporativa, sem urgência fabricada.

## Paleta

### Acento único — Pulse

| Token          | Hex       | Uso                                   |
| -------------- | --------- | ------------------------------------- |
| `--pulse`      | `#C8FF00` | CTAs, foco, marca, validação positiva |
| `--pulse-deep` | `#A2D900` | hover/active de `--pulse`             |
| `--pulse-soft` | `#ECFFA8` | backgrounds sutis, badges             |
| `--pulse-ink`  | `#0A0A0B` | texto sobre `--pulse`                 |

> **Pulse é o único acento da marca.** Cor de osciloscópio, monitor cardíaco, sinal vital. Usar com economia — quando aparece, manda.

### Ink & Paper

| Token           | Hex       | Uso                                     |
| --------------- | --------- | --------------------------------------- |
| `--ink`         | `#0A0A0B` | texto principal, surface dark           |
| `--ink-2`       | `#16161A` | surface elevada (dark)                  |
| `--ink-3`       | `#2A2A2F` | texto secundário                        |
| `--ink-4`       | `#4A4A52` | texto terciário, ícones                 |
| `--paper`       | `#FAFAF7` | background principal (off-white quente) |
| `--paper-pure`  | `#FFFFFF` | cards                                   |
| `--paper-soft`  | `#F4F4EE` | surfaces alternadas                     |
| `--mute`        | `#6B6B70` | texto mute                              |
| `--mute-2`      | `#9C9CA3` | placeholder, disabled                   |
| `--rule`        | `#E5E5E0` | divisores, bordas                       |
| `--rule-strong` | `#C9C9C0` | bordas marcadas                         |

### Semânticas (sóbrias, não competem com pulse)

| Token       | Hex       | Uso                              |
| ----------- | --------- | -------------------------------- |
| `--success` | `#00B96B` | pagamento ok, check-in válido    |
| `--warning` | `#E89400` | meia-entrada, documento pendente |
| `--danger`  | `#E5342B` | erro, fraude, indisponível       |
| `--info`    | `#2D7AF6` | informações neutras              |

Cada um tem variante `-soft` para backgrounds.

## Tipografia

| Família            | Uso                                      | Pesos                        |
| ------------------ | ---------------------------------------- | ---------------------------- |
| **Geist**          | Display + UI + Body                      | 400, 500, 600, 700, 800, 900 |
| **JetBrains Mono** | IDs, códigos, números técnicos, métricas | 400, 500, 700                |

**Proibido:** Inter, Roboto, Arial, Open Sans, system fonts genéricas.

### Escala

```
Display  88px / 0.95 / -5% tracking / 800
H1       48px / 1.05 / -4% tracking / 700
H2       32px / 1.15 / -3% tracking / 700
H3       22px / 1.25 / -2% tracking / 600
Body-lg  18px / 1.55 / normal       / 400
Body     16px / 1.55 / normal       / 400
Body-sm  14px / 1.5  / normal       / 400
Small    13px / 1.5  / normal       / 400 (mute)
Caption  12px / 1.5  / +0.1em       / 500 (uppercase)
Mono     14px / 1.5  / +0.02em      / 500
```

### Tracking

- Headings grandes: negative tracking (`-3%` a `-5%`).
- Body: normal.
- Mono e captions: leve positive (`+0.02em` a `+0.12em`).
- Uppercase eyebrow: `0.12em`.

## Espaçamento

Escala 4px Tailwind padrão.

- Touch target mínimo: **44×44px**.
- Padding de cards: 24–32px.
- Espaço entre seções: `64–96px` em desktop, `40–64px` em mobile.

## Radii

| Token           | Valor  | Uso               |
| --------------- | ------ | ----------------- |
| `--radius-sm`   | 4px    | inputs, tags      |
| `--radius-md`   | 8px    | botões            |
| `--radius-lg`   | 12px   | cards pequenos    |
| `--radius-xl`   | 16px   | cards principais  |
| `--radius-2xl`  | 24px   | seções destacadas |
| `--radius-full` | 9999px | pills, avatares   |

## Sombras

```css
--shadow-sm: 0 1px 2px rgba(10, 10, 11, 0.06);
--shadow-md: 0 4px 12px rgba(10, 10, 11, 0.08);
--shadow-lg: 0 12px 32px rgba(10, 10, 11, 0.12);
--shadow-glow: 0 0 0 4px rgba(200, 255, 0, 0.25);
```

Sombras são discretas. Para destaque, prefira borda ou pulse-glow.

## Motion

| Token               | Valor                            | Uso               |
| ------------------- | -------------------------------- | ----------------- |
| `--duration-fast`   | 120ms                            | hover, foco       |
| `--duration-normal` | 200ms                            | transições padrão |
| `--duration-slow`   | 400ms                            | reveals, modals   |
| `--ease-out`        | `cubic-bezier(0.16, 1, 0.3, 1)`  | entrada           |
| `--ease-in-out`     | `cubic-bezier(0.65, 0, 0.35, 1)` | bidirecional      |

`prefers-reduced-motion` sempre respeitado.

## Componentes

### shadcn/ui (base)

```bash
pnpm dlx shadcn@latest add button card input label dialog drawer dropdown-menu form select tabs toast badge separator skeleton avatar sonner
```

### Customizados em `src/components/`

| Componente               | Função                               |
| ------------------------ | ------------------------------------ |
| `<EventCard />`          | card de evento na listagem           |
| `<TicketTypeSelector />` | seletor tipo + lote + quantidade     |
| `<PixDisplay />`         | QR + copia-cola + timer regressivo   |
| `<TicketPdf />`          | template PDF do ingresso             |
| `<QrScanner />`          | câmera com leitura                   |
| `<ValidationResult />`   | tela cheia de feedback do scan       |
| `<HalfPriceBadge />`     | selo de meia (warning)               |
| `<StatusPill />`         | pill por status                      |
| `<PulseBeacon />`        | indicador animado pulse (Live, sync) |
| `<MonoCode />`           | bloco mono para IDs                  |

## Marca

### Símbolo

Triângulo monolítico (o "A") com pulso elétrico interno terminando em nodo sináptico.

```
SVG primário: public/brand/symbol-axon.svg
Wordmark:     public/brand/logo-axon.svg
Favicon:      public/brand/favicon.svg
```

### Regras

- Tamanho mínimo digital: **24px**
- Tamanho mínimo print: **10mm**
- Área de proteção: altura do "A"
- Proibido: distorcer, girar, sobre fundo caótico, recolorir o acento

## Iconografia

**Lucide React.** Único icon set.

- Tamanho padrão: 20px (UI), 16px (compacto), 24px (destaque).
- Stroke 1.75 (default Lucide).

## Acessibilidade (WCAG 2.1 AA)

- Contraste ≥ 4.5:1 (texto), ≥ 3:1 (UI).
- Foco visível com `--focus-ring` (3px pulse).
- Navegação por teclado completa.
- Forms com `<label>` associado.
- Erros anunciados via `aria-live`.
- Alt em todas as imagens.
- `prefers-reduced-motion` e `prefers-color-scheme` respeitados.

## Modo escuro

Toggle no header. Persistido em `localStorage` + respeita `prefers-color-scheme`.
No dark mode, `--ink` e `--paper` se invertem; `--pulse` permanece igual.

## E-mail transacional

Templates React via `@react-email/components`:

- Header: monogram + nome.
- Corpo: tipografia limpa, sem ornamento.
- CTA: button preto com texto pulse.
- Footer: contato + LGPD + unsubscribe (quando aplicável).

Preview text bem escrito.

## PDF do ingresso

- Tamanho A6 portrait para impressão fácil.
- QR centralizado, ≥ 30% da área.
- Wordmark AXON no topo.
- Logo do organizador no rodapé.
- Título do evento, data, local, tipo, titular, nº.
- Aviso: "Não compartilhe seu QR. O primeiro a entrar usa o ingresso."

## Voz e tom

Direto. Técnico. Honesto. Confiante.

| Yes                                                         | No                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| "Pix confirmado. Seu ingresso está no e-mail."              | "Estamos super felizes em confirmar seu pagamento! 🎉"  |
| "Pagamento recusado pelo banco. Tente outro cartão ou Pix." | "Algo inesperado aconteceu. Por favor tente novamente." |
| "Seu QR é único e assinado. Compartilhar = perder a vez."   | "Atenção: seu código de acesso é especial! 🚨"          |
| "Confirme seu CPF para validar a meia-entrada."             | "Você poderia, por favor, informar seu CPF?"            |

Verbos no presente. Frases curtas. Sem floreio. Sem "por favor" em fluxos normais.

## Referência visual

Para inspiração e referência das aplicações reais (ingresso digital, painel do organizador, PWA do porteiro, e-mail, social): **abrir `public/brand/brand-book.html` no navegador**.
