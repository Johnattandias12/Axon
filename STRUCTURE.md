# Estrutura do projeto AXON

Mapa do código + diretivas pra você não se perder. Quando ficar em dúvida onde colocar algo, consulta aqui.

---

## Visão de 30 segundos

```
AXON/
├── src/                  # Todo o código da aplicação Next.js
│   ├── app/              # Páginas e rotas (App Router) — uma pasta = uma URL
│   ├── components/       # Componentes React reutilizáveis
│   ├── lib/              # Lógica de negócio, integrações, helpers
│   ├── hooks/            # React hooks customizados
│   ├── styles/           # Tokens CSS + globals
│   ├── types/            # Types compartilhados (Supabase, próprios)
│   └── proxy.ts          # Middleware Next 16 (sessão Supabase)
│
├── supabase/migrations/  # Schema do banco (cada arquivo = uma alteração)
├── docs/                 # Documentação técnica detalhada
├── prompts/              # Briefings das sprints (1 arquivo por sprint)
├── scripts/              # Utilitários de manutenção (DB, deploy)
├── public/               # Assets estáticos
├── e2e/                  # Testes Playwright
└── .claude/              # Subagents, skills e workspaces de IA
```

---

## `src/app/` — Páginas e rotas

Cada pasta = um segmento de URL. Convenção do Next App Router.

| Pasta                      | URL                                                                                          | Pra quem                            |
| -------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `(public)/`                | `/`, `/eventos`, `/privacidade`, `/termos`                                                   | Não autenticado / qualquer um       |
| `(auth)/entrar`            | `/entrar`                                                                                    | Login / signup / reset senha        |
| `eventos/[slug]`           | `/eventos/show-de-junho`                                                                     | Página pública de cada evento       |
| `carrinho/`                | `/carrinho`                                                                                  | Carrinho do comprador               |
| `checkout/[id]`            | `/checkout/abc-123`                                                                          | Tela de pagamento de um pedido      |
| `minha-conta/`             | `/minha-conta`, `/minha-conta/ingressos`, `/minha-conta/seguranca`, `/minha-conta/afiliados` | Área do comprador logado            |
| `organizador/`             | `/organizador`, `/organizador/eventos`, `/organizador/check-ins`, `/organizador/financeiro`  | Painel do organizador               |
| `admin/`                   | `/admin`, `/admin/usuarios`, `/admin/afiliados`, `/admin/check-ins`, ...                     | Painel admin AXON                   |
| `afiliado/convite/[token]` | `/afiliado/convite/xxx`                                                                      | Página pública pra aceitar convite  |
| `transferir/[token]`       | `/transferir/xxx`                                                                            | Aceite de transferência de ingresso |
| `scan/`                    | `/scan`                                                                                      | PWA do porteiro (validador)         |
| `api/`                     | `/api/...`                                                                                   | Route handlers (REST) e webhooks    |

### Convenções

- Cada rota tem `page.tsx` (UI). Pode ter `layout.tsx`, `loading.tsx`, `error.tsx`.
- **Server Actions** ficam em `actions.ts` ao lado do `page.tsx` que as usa.
- **Client components** específicos da página ficam ao lado (ex: `ProfileForm.tsx`). Se forem reutilizáveis, sobem pra `src/components/`.
- Rotas em `()` (parênteses) são **route groups** — agrupam sem afetar URL.
- O `proxy.ts` (era `middleware.ts` no Next 15) atualiza a sessão Supabase em todo request.

---

## `src/components/` — UI reutilizável

```
components/
├── ui/              # Primitivos shadcn/ui (Button, Input, Dialog...)
├── shared/          # Componentes usados em várias áreas (SiteHeader, PageHeader)
├── event/           # Tudo relacionado a evento (EventCard, PremiumTicketCard, EventCountdown)
├── cart/            # Carrinho e mini-cart drawer
└── check-ins/       # Dashboard de check-ins (admin e organizador)
```

### Diretiva

- Componente usado em mais de uma rota → vai pra `src/components/<área>/`
- Componente específico de uma página → fica ao lado do `page.tsx`
- Primitivo shadcn → `src/components/ui/` (não mexer mão, usar CLI)

---

## `src/lib/` — Lógica e integrações

Onde mora o **cérebro** da aplicação — sem JSX, sem React.

```
lib/
├── supabase/        # Clientes Supabase (server, client, admin, middleware)
├── payments/        # 💰 Tudo de dinheiro entrando/saindo
│   └── pagarme/     # Integração Pagar.me v5
├── affiliates/      # Programa de afiliados (invites, tokens)
├── check-ins/       # Queries e stats dos logs de validação
├── qr/              # HMAC do QR Code (gerar + verificar)
├── email/           # Resend (envio transacional)
├── utils/           # Helpers genéricos (formatters, validators, cn)
└── validators/      # Schemas Zod reutilizáveis (auth, ...)
```

### Diretiva: onde colocar coisa nova

| Funcionalidade nova                      | Pasta                                                          |
| ---------------------------------------- | -------------------------------------------------------------- |
| Integração com novo gateway de pagamento | `lib/payments/<nome>/`                                         |
| Integração com novo serviço externo      | `lib/<serviço>/`                                               |
| Função pura de formatação ou validação   | `lib/utils/` ou `lib/validators/`                              |
| Helper que toca Supabase                 | `lib/supabase/` ou submódulo (ex: `lib/affiliates/invites.ts`) |

---

## `src/lib/payments/` — Pagamentos (centro financeiro)

Toda movimentação de dinheiro mora aqui. Leia o `README.md` desta pasta antes de mexer.

```
payments/
├── pagarme/           # Integração Pagar.me v5
│   ├── client.ts      # Wrapper fetch + Basic Auth
│   ├── types.ts       # Schemas Zod (webhook events, order, charge)
│   ├── webhook-verify.ts  # HMAC-SHA256 timing-safe
│   └── orders.ts      # createPagarmePixOrder, get, cancel, linkOrderToGateway
└── README.md          # Guia passo-a-passo pra ativar Pagar.me
```

Integrações relacionadas (fora de `payments/` porque são consumers):

- `src/app/api/webhooks/pagarme/route.ts` — handler do webhook
- `src/app/checkout/pagarme-actions.ts` — `createPixChargeAction` (server action)
- `src/app/checkout/actions.ts` — `buyDemo` (modo demo, sem gateway)
- `supabase/migrations/003_functions.sql` — `confirm_order`, `reserve_lot`, `release_lot`

---

## `src/hooks/` — React hooks

Hooks customizados (`useXxx`). Adicione aqui só se for reutilizável entre componentes.

---

## `src/styles/` e `src/app/globals.css`

- `src/styles/tokens.css` — cores, espaçamento, sombras do brand (variáveis CSS)
- `src/app/globals.css` — reset + base + animações globais

Não usar hex hardcoded. Sempre usar `var(--ink)`, `var(--pulse)`, etc.

---

## `src/types/`

```
types/
├── supabase.ts      # Gerado por pnpm db:types (parcialmente manual hoje)
└── ...
```

Quando uma migration nova adicionar tabela: rodar `pnpm db:types` pra regenerar.

---

## `supabase/migrations/` — Banco de dados

Cada arquivo é uma alteração de schema, aplicada em ordem.

| Arquivo                              | O que adiciona                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `001_initial_schema.sql`             | Tabelas centrais: profiles, organizers, events, orders, tickets, check_ins...                                      |
| `002_rls_policies.sql`               | Row Level Security em todas as tabelas                                                                             |
| `003_functions.sql`                  | `confirm_order`, `reserve_lot`, `release_lot`, `validate_ticket`, `generate_qr_hash`, `expire_pending_orders`      |
| `004_seed.sql`                       | Dados de exemplo (dev)                                                                                             |
| `005_cart_and_avatar.sql`            | `cart_items`, avatar_url em profiles                                                                               |
| `006_event_banners.sql`              | `banner_url` em events                                                                                             |
| `007_ticket_transfer_and_refund.sql` | `transfer_token`, `transfer_expires_at`, refund tracking                                                           |
| `008_affiliates.sql`                 | `affiliates`, `affiliate_referrals` + RLS + função `generate_affiliate_code`                                       |
| `009_affiliates_invite_credit.sql`   | Programa por convite: `affiliate_invites`, `affiliates.status`, `profiles.wallet_credit_cents`, trigger de crédito |

### Diretivas

- **Nunca editar migration antiga** depois de aplicada. Crie uma nova `NNN_descricao.sql`.
- Aplicar: `pnpm db:push` (precisa Supabase CLI) ou `node --env-file=.env.local scripts/apply-008-009.mjs` (template — copie e ajuste).
- Atualizar types depois: `pnpm db:types`.

---

## `docs/` — Documentação detalhada

| Arquivo                   | Conteúdo                                                      |
| ------------------------- | ------------------------------------------------------------- |
| `01-architecture.md`      | Visão geral, fluxos principais                                |
| `02-data-model.md`        | Tabelas, relacionamentos, RLS                                 |
| `03-auth-roles.md`        | Auth Supabase + 4 papéis (buyer, organizer, validator, admin) |
| `04-payment-flow.md`      | Fluxos Pix e cartão, split, webhook                           |
| `05-validation-flow.md`   | QR Code, validação na porta, modo offline                     |
| `06-antifraud.md`         | 5 camadas de antifraude                                       |
| `07-legal-compliance.md`  | LGPD, meia-entrada (Lei 12.933), CDC                          |
| `08-design-system.md`     | Tokens, voice da marca                                        |
| `09-environment-setup.md` | Variáveis de ambiente                                         |
| `voice-brand.md`          | Pegada de copy (axônio + 7 pecados)                           |

---

## `prompts/` — Sprints

Cada sprint tem um arquivo com objetivo + entregas obrigatórias. Lê antes de codar.

```
prompts/
├── sprint-0-setup.md
├── sprint-1-auth-events.md
├── sprint-2-checkout.md     # ← Pagar.me real
├── sprint-3-validation.md
├── sprint-4-financial.md
└── sprint-5-antifraud.md
```

---

## `scripts/` — Utilitários de manutenção

| Arquivo                       | Pra que serve                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `apply-migrations.mjs`        | Aplica todas as migrations (via pooler)                                             |
| `apply-008-009.mjs`           | Aplica migrations 008+009 (via conexão direta — fallback quando pooler não resolve) |
| `wipe-my-orders.mjs` + `.sql` | Zera pedidos demo do owner pra reteste limpo                                        |
| `check-db.mjs`                | Inspeciona o estado do banco (tabelas, triggers, users)                             |
| `setup-supabase.mjs`          | Setup inicial do projeto Supabase                                                   |
| `set-vercel-env-api.mjs`      | Sincroniza env vars com a Vercel                                                    |

---

## `.claude/` — Subagents e workspaces de IA

```
.claude/
├── agents/          # Subagents especializados (por setor)
│   ├── frontend/    # ui-ux-designer
│   ├── backend/     # supabase-architect
│   ├── security/    # axon-rls-auditor, security-reviewer
│   ├── payments/    # axon-pagarme-expert, axon-checkout-guardian
│   ├── compliance/  # axon-compliance
│   ├── qa/          # bug-hunter
│   ├── research/    # market-researcher
│   ├── product/     # event-day-planner
│   └── brand/       # axon-voice-copy
└── worktrees/       # Branches isoladas pra trabalhos paralelos (geradas pelo Claude Code)
```

---

## Fluxo: como adicionar uma feature nova

### 1. Página nova

1. Cria `src/app/<rota>/page.tsx`
2. Se for autenticada: `redirect("/entrar")` se `user` for null
3. Se precisar de actions: cria `actions.ts` ao lado com `"use server"`
4. Componentes específicos: ao lado do `page.tsx`

### 2. Nova tabela / coluna

1. Cria `supabase/migrations/NNN_descricao.sql` (não edita as antigas)
2. Aplica: `pnpm db:push` ou via script Node
3. Regenera types: `pnpm db:types`
4. Cria helpers em `src/lib/<area>/`

### 3. Nova integração externa (gateway, CRM, etc)

1. Cria pasta `src/lib/<integracao>/`
2. `client.ts` com wrapper, `types.ts` com Zod schemas, `webhook-verify.ts` se receber webhook
3. Server action consumidora em `src/app/<onde-usa>/actions.ts`
4. Env vars em `.env.example` e `.env.local`
5. Doc rápida em `<lib>/README.md`

### 4. Nova rota admin

1. Cria `src/app/admin/<área>/page.tsx`
2. Adiciona item no `src/app/admin/AdminSidebarNav.tsx`
3. RLS no banco já garante via `is_admin()` SQL function

### 5. Bug fix ou refactor

1. Sempre conventional commit: `fix(<scope>): ...` ou `refactor(<scope>): ...`
2. Antes do PR: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

---

## Comandos úteis

```bash
# Dev
pnpm dev                  # next dev
pnpm build                # next build
pnpm lint                 # eslint
pnpm typecheck            # tsc --noEmit
pnpm test:run             # vitest
pnpm test:e2e             # playwright

# Supabase
pnpm db:push              # aplica migrations
pnpm db:types             # regenera src/types/supabase.ts
pnpm db:reset             # reset local + reseed
node --env-file=.env.local scripts/check-db.mjs    # inspeciona DB remoto
```

---

## Regras inquebráveis (não negociar)

Detalhes em `CLAUDE.md`. Resumo:

1. **RLS ligada em TODA tabela Supabase.**
2. **`service_role` key NUNCA no client.**
3. **`qr_hash` gerado server-side via HMAC.**
4. **Webhook Pagar.me: HMAC verify obrigatório + idempotência por event_id.**
5. **Lock pessimístico (FOR UPDATE) ao decrementar estoque.**
6. **Reserva de pedido pending expira em 15 min.**
7. **Meia-entrada (Lei 12.933): 40% obrigatório validado no banco.**
8. **LGPD: audit_logs pra acesso a CPF; endpoints `/api/lgpd/export` e `/delete`.**

---

## Quando estiver perdido

1. Procura aqui (`STRUCTURE.md`)
2. Procura no `CLAUDE.md` (regras + workflow)
3. Procura no `docs/` (detalhes técnicos)
4. Procura no `prompts/sprint-N-*.md` (objetivo da sprint atual)
5. Pergunta pro Claude — ele lê esse arquivo
