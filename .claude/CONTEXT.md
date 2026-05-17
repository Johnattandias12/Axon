# AXON — Contexto rápido (cache de leitura)

> **Propósito:** este arquivo é o **primeiro lugar** a olhar antes de grepar/listar.
> Mantém schema, rotas, libs e padrões num só lugar. Atualize quando mexer em estrutura.

---

## Stack (resumo)

Next.js 15 App Router · TS strict · Tailwind v4 · Supabase (Postgres+RLS+Auth+Storage) · Pagar.me **STANDBY** (usar `buyDemo`) · Resend · Vercel.

---

## Schema (tabelas e colunas-chave)

Todas com **RLS ligada**. Acesse via `createClient()` (com sessão) ou `createAdminClient()` (bypass, server-only).

| Tabela                                            | Colunas críticas                                                                                                                                                            | Notas                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `profiles`                                        | `id` (FK auth.users), `role`, `avatar_url`, `full_name`, `cpf`                                                                                                              | role ∈ admin/organizer/validator/buyer                                 |
| `organizers`                                      | `id`, `display_name`, `cnpj`, `kyc_status`                                                                                                                                  |                                                                        |
| `events`                                          | `id`, `slug`, `organizer_id`, `status`, `starts_at`, `venue_name`, `city`, `state`, `category`, `banner_url`                                                                | status ∈ draft/published/cancelled                                     |
| `ticket_types`                                    | `id`, `event_id`, `name`                                                                                                                                                    | "Pista", "VIP" etc.                                                    |
| `ticket_lots`                                     | `id`, `event_id`, `ticket_type_id`, `name`, `price_cents`, `quantity_total`, `quantity_sold`, `quantity_reserved`, `is_half_price`                                          | estoque calculado: `total − sold − reserved`                           |
| `orders`                                          | `id`, `buyer_id`, `event_id`, `status`, `subtotal_cents`, `service_fee_cents`, `total_cents`, `paid_at`, `payment_method`, `metadata`, `gateway_order_id`, `reserved_until` | status ∈ pending/paid/cancelled/refunded                               |
| `order_items`                                     | `order_id`, `ticket_lot_id`, `quantity`, `unit_price_cents`                                                                                                                 |                                                                        |
| `tickets`                                         | `id`, `order_id`, `ticket_lot_id`, `event_id`, `qr_hash`, `holder_name`, `holder_cpf`, `is_half_price`, `status`, `transfer_token`, `refund_requested_at`                   | status ∈ valid/used/cancelled/refunded/transfer_pending/refund_pending |
| `check_ins`                                       | `ticket_id`, `event_id`, `validator_id`, `scanned_at`, `result`                                                                                                             |                                                                        |
| `event_validators`                                | `event_id`, `user_id`                                                                                                                                                       | porteiros                                                              |
| `cart_items`                                      | `user_id`, `ticket_lot_id`, `quantity`, `added_at`                                                                                                                          | carrinho persistente                                                   |
| `transactions`                                    | `order_id`, `gateway`, `gateway_id`, `status`, `amount_cents`                                                                                                               | Pagar.me                                                               |
| `webhook_events`                                  | `gateway`, `event_id` (idempotência), `processed_at`                                                                                                                        |                                                                        |
| `refunds`, `payouts`, `fraud_flags`, `audit_logs` | —                                                                                                                                                                           |                                                                        |
| `affiliates` _(008)_                              | `id`, `user_id`, `code`, `commission_pct`, `total_referrals`, `total_commission_cents`                                                                                      | tabela nova — exige migration 008 aplicada                             |
| `affiliate_referrals` _(008)_                     | `id`, `affiliate_id`, `order_id`, `event_id`, `commission_cents`, `status`                                                                                                  | status ∈ pending/paid/cancelled                                        |

**Service fee:** 10% sobre subtotal. Calculado em `src/app/checkout/actions.ts:73`.

**Cortesias:** não há enum `courtesy` em `payment_method` — usa `payment_method='pix'` + `metadata.courtesy=true`. Filtrar com `.filter('metadata->>courtesy','eq','true')`.

**Afiliados:** tabelas só existem após `supabase/migrations/008_affiliates.sql` ser aplicada e `npx supabase gen types` regenerar `src/types/supabase.ts`. Até lá, acessar via helper `src/lib/supabase/affiliates-admin.ts` que encapsula casts.

---

## Mapa de rotas

### Público

- `/` → `(public)/page.tsx` — hero + carrosséis + cta organizador
- `/eventos` — listagem com filtros
- `/eventos/[slug]` — detalhe + compra (botão `buyDemo`)
- `/entrar` — magic link (Supabase Auth)
- `/termos`, `/privacidade` — legal
- `/transferir/[token]` + `/sucesso` — aceite de transferência

### Comprador

- `/carrinho` — checkout demo multi-item
- `/minha-conta` — dashboard + ingressos (tabs Próximos/Histórico/Sugestões/Dados)
- `/minha-conta/ingressos/[orderId]` — detalhe do pedido (admin client; RLS bypassada com filtro manual `buyer_id`)
- `/minha-conta/afiliados` — programa de afiliados (precisa migration 008)
- `/termos`, `/privacidade` — legais (LGPD, CDC, Lei 12.933)

### Organizador (role=organizer|admin)

- `/organizador` — overview
- `/organizador/comecar` — onboarding KYC
- `/organizador/eventos` + `/novo` + `/[id]` + `/editar` + `/lotes` + `/equipe` + `/cortesia`
- `/organizador/eventos/[id]` — agora inclui card `EventAnalyticsCard` (receita, vendidos, ticket médio, check-in, barras por tipo)
- `/organizador/financeiro`

### Admin (role=admin)

- `/admin`, `/admin/usuarios`, `/admin/organizadores`, `/admin/eventos`, `/admin/eventos/[id]`

### Operacional

- `/scan` — PWA porteiro (câmera + HMAC verify)

### API

- `/api/auth/callback` (Supabase OAuth)
- `/api/auth/logout`
- `/api/cart` — sync de carrinho
- `/api/organizador/convidar-validador`
- `/api/organizador/eventos/[id]/export?type=sales|checkins|courtesy` — CSV
- `/api/admin/seed`, `/api/admin/setup`

---

## Libs (paths exatos)

```
src/lib/
├── supabase/
│   ├── client.ts        # createClient() — browser
│   ├── server.ts        # createClient() async — RSC/server actions (com sessão)
│   ├── admin.ts         # createAdminClient() — service_role, BYPASSA RLS
│   └── middleware.ts    # refresh de sessão
├── qr/hmac.ts           # generateQrPayload(ticketId, eventId) + verifyQrPayload()
├── email/
│   ├── send.ts          # sendTicketConfirmation() etc (Resend, silencioso sem key)
│   └── templates.ts
├── validators/          # Zod (auth, event, ticket-holder, common)
└── utils/
    ├── formatters.ts    # centsToBRL, formatDate
    └── validators.ts    # cpf, cnpj, email
```

`@/` aliasa `src/`.

---

## Server actions

| Path                                                 | Função                | O que faz                                                                                            |
| ---------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/app/checkout/actions.ts`                        | `buyDemo`             | Cria pedido + tickets sem pagamento, com QR HMAC, redireciona pra `/minha-conta/ingressos/[orderId]` |
| `src/app/carrinho/actions.ts`                        | (várias)              | Add/remove/checkout do carrinho                                                                      |
| `src/app/minha-conta/actions.ts`                     | (perfil)              | Update profile, avatar                                                                               |
| `src/app/transferir/[token]/actions.ts`              | aceitar transferência | troca holder e marca status                                                                          |
| `src/app/scan/actions.ts`                            | `checkInTicket`       | Valida QR HMAC + cria check_in                                                                       |
| `src/app/minha-conta/ingressos/[orderId]/actions.ts` | refund, transfer      | Solicita reembolso ou gera token                                                                     |
| `src/app/organizador/eventos/[id]/editar/actions.ts` | edit event            |                                                                                                      |

---

## Componentes-chave (sem precisar grepar)

```
src/components/
├── cart/CartDrawer.tsx          # bottom sheet com vaul, otimizado mobile (botões 40px, safe-area)
├── event/
│   ├── EventCard.tsx, TicketCard.tsx, TicketActions.tsx, TicketPdfButton.tsx, EventCountdown.tsx
│   └── BuyDemoForm.tsx          # form do checkout demo
├── shared/
│   ├── SiteHeader.tsx           # com backdrop-blur (cria stacking context!)
│   ├── SiteMobileNav.tsx        # DRAWER PORTALIZADO (createPortal → document.body) por causa do header
│   ├── NeuronAnimation.tsx      # SVG com animateMotion (impulso elétrico nos axônios)
│   ├── CelebrateOnMount.tsx     # confete pós-compra (canvas-confetti)
│   ├── PageHeader.tsx           # eyebrow + title + description (não "subtitle")
│   ├── EventsCarousel.tsx, CategoriesCarousel.tsx
│   ├── AxonLogo.tsx, ThemeToggle.tsx, ThemeProvider.tsx
│   ├── LoginForm.tsx, MagicLinkForm.tsx
│   ├── QrCameraScanner.tsx, AvatarUploader.tsx, BackButton.tsx
└── ui/ (shadcn)
```

---

## Design tokens (CSS vars)

`var(--ink)` `var(--ink-3)` `var(--ink-4)` `var(--paper)` `var(--paper-pure)` `var(--rule)` `var(--mute)` `var(--mute-2)`
`var(--pulse)` `var(--pulse-deep)` `var(--pulse-soft)` `var(--pulse-ink)` — lime/AXON
`var(--success)` `var(--info)` `var(--warning)` `var(--danger)` (+ `-soft` cada)

**Sem hex hardcoded.** Sem emoji em copy de venda. Sem travessões (—).

---

## Padrões críticos (decisões já tomadas)

1. **RLS sempre ligada.** Se SELECT precisa de bypass intencional (ex.: detail de pedido logo após insert), use `createAdminClient()` + filtro manual `buyer_id`/`organizer_id`.
2. **`qr_hash` server-only.** `generateQrPayload` em `src/lib/qr/hmac.ts` — nunca chamar do client.
3. **Pagar.me em STANDBY.** Não tentar wire de pagamento real. Usar `buyDemo`.
4. **Header tem `backdrop-blur-md`** → cria stacking context. Qualquer `fixed` child fica preso. Solução: `createPortal` pra `document.body` (ver `SiteMobileNav.tsx`).
5. **Idempotência webhook:** chave = `event_id` da Pagar.me. Tabela `webhook_events`.
6. **Estoque:** lock pessimista (`SELECT ... FOR UPDATE`) em `ticket_lots` ao decrementar. Reserva expira em 15 min (`orders.reserved_until`).
7. **Meia-entrada:** 40% obrigatório por evento. Validado em trigger DB.
8. **HMAC do scan:** verifica HMAC antes de qualquer query. Sem HMAC válido = scan rejeitado.
9. **Confete:** dispara só se `paid_at` < 2 min atrás (em `minha-conta/ingressos/[orderId]/page.tsx:52`).
10. **`createAdminClient` nunca no client.** Importar só em files `"use server"` ou route handlers.

---

## Comandos diários

```bash
# Sempre prefira RTK na frente
rtk node ./node_modules/typescript/bin/tsc --noEmit   # typecheck
rtk pnpm lint
rtk pnpm dev                                          # dev server (porta 3000)
rtk pnpm build                                        # build prod
rtk git status / log / diff
rtk gain                                              # economia de tokens
```

**Push:** `git push` direto em `main`. Pre-commit hook formata com Prettier — deixe rodar.

---

## Não fazer

- Não criar pasta `docs/` nova nem README — já existe estrutura em `docs/01-architecture.md` etc.
- Não trocar shadcn/Tailwind v4/Supabase/Pagar.me sem pedir.
- Não rodar `git add .` cego — preferir adicionar files específicos.
- Não usar emoji em copy de venda (CTA, hero, badges de evento).
- Não bypassar pre-commit (`--no-verify`) sem pedido.

---

## Quando perder o contexto, leia nesta ordem

1. Este arquivo (`.claude/CONTEXT.md`)
2. `CLAUDE.md` (regras de operação)
3. `MEMORY.md` (em `~/.claude/projects/.../memory/`)
4. `docs/02-data-model.md` se precisar de schema completo
