# CLAUDE.md — Instruções permanentes para o Claude Code

> Este arquivo é lido automaticamente pelo Claude Code em toda sessão.
> NÃO remova nem ignore as regras abaixo.

---

## 1. Sobre o projeto

**AXON** é um marketplace brasileiro de venda de ingressos online (multi-organizador, multi-categoria). Stack: Next.js 15 (App Router) + TypeScript + Supabase + Vercel + Pagar.me. Mercado-alvo: shows, esportes (incluindo futsal), eventos religiosos e genéricos.

Owner: Johnattan (Currais Novos / Natal — RN).

---

## 2. Stack obrigatória (NÃO troque sem pedir)

| Camada           | Tecnologia                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Frontend         | Next.js 15 (App Router) + TypeScript **strict**                       |
| UI               | shadcn/ui + Tailwind CSS v4                                           |
| Backend          | Supabase (Postgres + Auth + Storage + Realtime + Edge Functions Deno) |
| Pagamentos       | Pagar.me (primário) — split nativo, ClearSale, Pix + cartão           |
| Email            | Resend                                                                |
| Antifraude extra | Cloudflare Turnstile + regras próprias                                |
| Monitoramento    | Sentry + Vercel Analytics                                             |
| Testes           | Playwright (E2E) + Vitest (unit)                                      |
| Validações       | Zod                                                                   |
| Forms            | react-hook-form                                                       |
| State server     | TanStack Query                                                        |
| Datas            | date-fns                                                              |

---

## 3. Estrutura de pastas (siga rigorosamente)

```
src/
├── app/                          # App Router
│   ├── (public)/                 # Rotas públicas (eventos, busca)
│   ├── (auth)/                   # Login / cadastro
│   ├── checkout/                 # Fluxo de compra
│   ├── minha-conta/              # Área do comprador
│   ├── organizador/              # Painel do organizador
│   ├── admin/                    # Painel admin
│   ├── scan/                     # PWA do porteiro
│   └── api/                      # Webhooks e endpoints
│       └── webhooks/pagarme/
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── checkout/
│   ├── event/
│   └── shared/
├── lib/
│   ├── supabase/                 # clients (server, client, admin)
│   ├── pagarme/                  # SDK wrapper
│   ├── qr/                       # geração e validação HMAC
│   ├── antifraud/                # regras de negócio
│   └── utils/
├── hooks/
├── types/                        # tipos gerados do Supabase + zods
└── styles/
```

---

## 4. Regras inquebráveis

### 4.1 Segurança

- **TODA tabela do Supabase tem RLS ligada.** Sem exceção.
- **NUNCA** confiar em dados do cliente para autorização. Validar role e ownership no servidor (server actions / route handlers / edge functions).
- **NUNCA** expor `service_role` key no client. Usar só em server-side.
- `qr_hash` é gerado por HMAC-SHA256 server-side. **Nunca** gerado no client.
- CSP estrito, sem `unsafe-inline` em produção.

### 4.2 Pagamentos

- Idempotência obrigatória em webhook do Pagar.me (chave: `event_id` da Pagar.me).
- Lock pessimista (`SELECT ... FOR UPDATE`) ao decrementar estoque de lote.
- Reserva de estoque expira em 15 minutos para pedidos `pending`.
- Webhook só confia em payload com assinatura válida (HMAC do header `X-Hub-Signature`).

### 4.3 LGPD

- Logar acessos a CPF / dados sensíveis (`audit_logs`).
- Endpoint `/api/lgpd/export` e `/api/lgpd/delete` para titular dos dados.
- Política de privacidade obrigatória antes do checkout.

### 4.4 Meia-entrada (Lei 12.933/2013)

- 40% do total de ingressos de cada evento devem ser meia-entrada.
- Validar no banco (constraint + trigger): organizador não consegue criar lote que viole a regra.
- Validador na porta pede documento se `tickets.is_half_price = true`.

---

## 5. Convenções de código

- **TypeScript strict** sempre. Sem `any`. Use `unknown` + narrowing.
- Componentes: PascalCase. Hooks: `useCamelCase`. Server actions: `verboNoun`.
- Cores e tokens: `tailwind.config.ts` + CSS variables. **Não** hardcodar hex.
- Mensagens em **português brasileiro**. Strings de UI em arquivo de i18n desde o início (mesmo só com pt-BR).
- Validação de input: **Zod** em TUDO que vem do cliente (forms, params, webhooks).
- Toda função pública tem JSDoc curto.
- Erros: nunca engolir. Sempre logar no Sentry + retornar mensagem amigável.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`...).

---

## 6. Workflow de desenvolvimento

1. **Antes de codar:** leia o arquivo da sprint atual em `prompts/sprint-N-*.md`.
2. **Antes de criar tabela:** atualize `supabase/migrations/` com migration nova (NÃO edite migration antiga já aplicada).
3. **Depois de mexer no schema:** rode `npx supabase gen types typescript --local > src/types/supabase.ts`.
4. **Antes de PR:** `pnpm lint && pnpm typecheck && pnpm test`.
5. **Antes de deploy:** rode os testes E2E do checkout em staging.

---

## 7. Onde buscar contexto

| Pergunta                      | Arquivo                        |
| ----------------------------- | ------------------------------ |
| Arquitetura, fluxo geral      | `docs/01-architecture.md`      |
| Tabelas, RLS, relacionamentos | `docs/02-data-model.md`        |
| Auth e papéis                 | `docs/03-auth-roles.md`        |
| Pagar.me, Pix, cartão, split  | `docs/04-payment-flow.md`      |
| QR Code, validação, offline   | `docs/05-validation-flow.md`   |
| Antifraude (5 camadas)        | `docs/06-antifraud.md`         |
| LGPD, meia-entrada, CDC       | `docs/07-legal-compliance.md`  |
| Design tokens, componentes    | `docs/08-design-system.md`     |
| Variáveis de ambiente         | `docs/09-environment-setup.md` |
| Roadmap e sprints             | `PROJECT_PLAN.md`              |

---

## 8. Comandos úteis

```bash
pnpm dev                    # Next.js dev
pnpm build                  # build de produção
pnpm lint                   # ESLint
pnpm typecheck              # tsc --noEmit
pnpm test                   # Vitest
pnpm test:e2e               # Playwright

npx supabase start          # Supabase local
npx supabase db push        # aplicar migrations
npx supabase gen types ...  # gerar types
```

---

## 9. Quando perguntar antes de agir

- Adicionar dependência nova (sempre justifique).
- Trocar gateway de pagamento.
- Alterar política de RLS já existente.
- Refatoração que toque >5 arquivos sem ser solicitada.
- Qualquer mudança em `docs/07-legal-compliance.md`.

Para o resto, **execute**.
