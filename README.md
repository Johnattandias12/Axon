# 🎟️ AXON

> Marketplace brasileiro de ingressos online — Pix, cartão, antifraude em camadas, repasse rápido.

## Status

🚧 **Em construção** — Sprint 0 (Setup).

## Stack

- **Next.js 15** (App Router) + TypeScript strict
- **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Pagar.me** (Pix + cartão, split nativo, ClearSale)
- **Tailwind v4** + **shadcn/ui**
- **Vercel** (deploy)
- **Resend** (e-mail transacional)
- **Sentry** + Vercel Analytics

## Como começar

1. Clone o repo.
2. Copie `.env.example` para `.env.local` e preencha as variáveis (ver `docs/09-environment-setup.md`).
3. Instale dependências:
   ```bash
   pnpm install
   ```
4. Suba o Supabase local:
   ```bash
   npx supabase start
   npx supabase db push
   ```
5. Rode o dev server:
   ```bash
   pnpm dev
   ```

## Estrutura do projeto

- [`CLAUDE.md`](./CLAUDE.md) — instruções permanentes para o Claude Code.
- [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) — roadmap completo em sprints.
- [`docs/`](./docs) — especificações técnicas detalhadas.
- [`supabase/migrations/`](./supabase/migrations) — schema SQL versionado.
- [`prompts/`](./prompts) — prompts prontos para colar no Claude Code, sprint por sprint.

## Sprints

| Sprint | Foco                            | Duração   | Prompt                                                                 |
| ------ | ------------------------------- | --------- | ---------------------------------------------------------------------- |
| 0      | Setup, design system, Supabase  | 1 semana  | [`prompts/sprint-0-setup.md`](./prompts/sprint-0-setup.md)             |
| 1      | Auth + Eventos + Organizador    | 2 semanas | [`prompts/sprint-1-auth-events.md`](./prompts/sprint-1-auth-events.md) |
| 2      | Checkout + Pix + Cartão         | 2 semanas | [`prompts/sprint-2-checkout.md`](./prompts/sprint-2-checkout.md)       |
| 3      | PWA de validação (porteiro)     | 1 semana  | [`prompts/sprint-3-validation.md`](./prompts/sprint-3-validation.md)   |
| 4      | Financeiro (split, saques)      | 1 semana  | [`prompts/sprint-4-financial.md`](./prompts/sprint-4-financial.md)     |
| 5      | Antifraude + polimento + deploy | 1 semana  | [`prompts/sprint-5-antifraud.md`](./prompts/sprint-5-antifraud.md)     |

## Licença

Proprietário. Todos os direitos reservados.
