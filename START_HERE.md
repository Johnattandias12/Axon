# 👋 START HERE — Como o Claude Code deve usar este kit

> Este arquivo é a **porta de entrada**. Leia ele primeiro antes de qualquer outro.

## O que é este projeto?

**AXON** — marketplace brasileiro de ingressos online. Stack Next.js 15 + Supabase + Pagar.me. Owner: Johnattan.

Você (Claude Code) vai **executar a implementação** seguindo os prompts em `prompts/` na ordem.

## Ordem de leitura

1. **`START_HERE.md`** ← você está aqui
2. **`CLAUDE.md`** — regras permanentes (lido automaticamente em toda sessão)
3. **`README.md`** — visão de alto nível
4. **`PROJECT_PLAN.md`** — roadmap em sprints

## Como executar uma sprint

1. Abra o prompt da sprint atual em `prompts/sprint-N-*.md`.
2. Leia o "Contexto obrigatório" listado no topo de cada prompt e abra esses arquivos.
3. Execute as tarefas em ordem.
4. Antes de declarar a sprint pronta, valide o **Definition of Done** ao final do prompt.
5. Rode `pnpm lint && pnpm typecheck && pnpm test:run && pnpm build` antes de qualquer push.

## Sprints disponíveis

| #   | Foco                                   | Arquivo                                                                |
| --- | -------------------------------------- | ---------------------------------------------------------------------- |
| 0   | Setup do repositório                   | [`prompts/sprint-0-setup.md`](./prompts/sprint-0-setup.md)             |
| 1   | Auth, organizador, eventos, listagem   | [`prompts/sprint-1-auth-events.md`](./prompts/sprint-1-auth-events.md) |
| 2   | Checkout, Pix, cartão, webhook         | [`prompts/sprint-2-checkout.md`](./prompts/sprint-2-checkout.md)       |
| 3   | PWA de validação (porteiro)            | [`prompts/sprint-3-validation.md`](./prompts/sprint-3-validation.md)   |
| 4   | Financeiro (split, saques, reembolsos) | [`prompts/sprint-4-financial.md`](./prompts/sprint-4-financial.md)     |
| 5   | Antifraude, polimento, deploy, piloto  | [`prompts/sprint-5-antifraud.md`](./prompts/sprint-5-antifraud.md)     |

## Documentação técnica de referência

Sempre consulte quando uma pergunta surgir:

| Tema                                  | Onde                           |
| ------------------------------------- | ------------------------------ |
| Arquitetura e fluxos                  | `docs/01-architecture.md`      |
| Modelo de dados (16 tabelas)          | `docs/02-data-model.md`        |
| Auth, papéis, RLS                     | `docs/03-auth-roles.md`        |
| Pagar.me, Pix, cartão, split, webhook | `docs/04-payment-flow.md`      |
| QR HMAC, validação, modo offline      | `docs/05-validation-flow.md`   |
| Antifraude (5 camadas)                | `docs/06-antifraud.md`         |
| LGPD, meia-entrada, CDC               | `docs/07-legal-compliance.md`  |
| Design tokens, componentes            | `docs/08-design-system.md`     |
| Variáveis de ambiente, deploy         | `docs/09-environment-setup.md` |

## SQL pronto

`supabase/migrations/` contém 4 migrations executáveis:

- `001_initial_schema.sql` — 16 tabelas, índices, triggers
- `002_rls_policies.sql` — RLS em todas as tabelas + helper functions
- `003_functions.sql` — `reserve_lot`, `confirm_order`, `validate_ticket`, `expire_pending_orders`, trigger meia-entrada
- `004_seed.sql` — template para dev/staging

Aplicar com:

```bash
npx supabase db push
```

E configurar uma vez:

```sql
ALTER DATABASE postgres SET app.qr_secret = '<openssl rand -hex 32>';
ALTER DATABASE postgres SET app.admin_emails = 'johnattan@axon.com.br';
```

## Regras inquebráveis

Resumo das regras de `CLAUDE.md`:

- **RLS sempre ligada.**
- **Webhook idempotente** (chave `event_id` Pagar.me).
- **HMAC do QR só server-side.**
- **Estoque com lock pessimista** (`SELECT FOR UPDATE`).
- **TypeScript strict, zero `any`.**
- **Zod em todo input do cliente.**
- **Política e termos antes do checkout.**
- **40% de meia-entrada obrigatório por lei.**

## Quando pedir confirmação antes de agir

- Trocar gateway de pagamento.
- Adicionar dependência grande nova.
- Mudar RLS já aplicada em produção.
- Mexer em `docs/07-legal-compliance.md`.
- Refatoração tocando >5 arquivos sem ser pedida.

## Para tudo o resto: **execute**.

Boa construção. 🚀
