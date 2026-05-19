# AXON — Guia do Projeto

Documento vivo. Mantenha aberto enquanto trabalha. Use a seção **"Próximas alterações"** no fim pra anotar o que quer mudar — o Claude lê isso na próxima sessão.

---

## 1. O que é a AXON

Marketplace brasileiro de ingressos online. Multi-organizador, multi-categoria (shows, esportes, religiosos, cursos, outros). Owner: Johnattan (Currais Novos/Natal — RN).

**Modelo de negócio:**

- Comprador paga 10% de taxa de serviço sobre o ingresso
- Organizador recebe 100% do valor do ingresso
- Afiliado ganha 5% sobre vendas pelo link único (programa por convite, comissão da AXON)
- Sem mensalidade pra ninguém

**Stack:**

- Next.js 15 (App Router) + TypeScript strict
- Tailwind v4 + shadcn/ui
- Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- Pagar.me v5 (Pix + cartão) — _cabeado, aguardando aprovação da conta_
- Resend (email transacional)
- Vercel (deploy)

---

## 2. Regras inquebráveis

Detalhes em `CLAUDE.md`. Resumo:

1. **RLS ligada** em TODA tabela Supabase
2. **`service_role` key NUNCA** no client
3. **`qr_hash` gerado server-side** via HMAC-SHA256
4. **Webhook Pagar.me**: HMAC verify + idempotência por event_id
5. **Lock pessimístico** (`FOR UPDATE`) ao decrementar estoque
6. **Reserva de pedido pending** expira em 15min
7. **Meia-entrada (Lei 12.933)**: 40% obrigatório no banco
8. **LGPD**: audit_logs pra CPF, `/api/lgpd/export` e `/delete`

---

## 3. Voz da marca

Doc completo em `docs/voice-brand.md`. Resumo:

AXON vem de **axônio** (filamento neuronal). Plataforma = caminho pro impulso humano até o evento.
**Pegada**: Canva sexy + 7 pecados capitais como combustível + vontade de viver.

**Tom**: curto, imperativo, segunda pessoa, sensorial.

**Proibido**:

- Travessão (`—`)
- "Não X, mas Y"
- "vamos/podemos"
- "simplesmente/basta"
- "incrível/revolucionar"
- Emoji em copy de venda
- CAPSLOCK pra ênfase

**Exemplos prontos:**

- CTA: "Vai. Viva." / "Quero ir" / "Bora ver"
- Confirmação: "Pronto. Te vejo lá."
- Empty: "Carrinho leve. Noite vazia."
- Validação verde: "Entra. Aproveita."

---

## 4. Estrutura de pastas

Mapa completo em `STRUCTURE.md`. Resumo:

```
src/
├── app/                          # Páginas (App Router, 1 pasta = 1 URL)
│   ├── (public)/                 # Rotas públicas
│   ├── (auth)/                   # Login
│   ├── checkout/                 # Compra
│   ├── carrinho/                 # Carrinho
│   ├── minha-conta/              # Área do comprador
│   ├── organizador/              # Painel do organizador
│   ├── admin/                    # Painel admin AXON
│   ├── afiliado/convite/[token]  # Aceite de convite afiliado
│   ├── transferir/[token]/       # Aceite de transferência ingresso
│   ├── scan/                     # PWA do porteiro
│   └── api/                      # Endpoints e webhooks
├── components/
│   ├── ui/                       # Primitivos shadcn
│   ├── shared/                   # SiteHeader, PageHeader, AvatarUploader...
│   ├── event/                    # EventCard, PremiumTicketCard, BuyTicketForm...
│   ├── cart/                     # CartDrawer, CheckoutForm...
│   └── check-ins/                # Dashboard de validações
├── lib/
│   ├── supabase/                 # clients (server, client, admin, middleware)
│   ├── payments/pagarme/         # 💰 Integração Pagar.me v5
│   ├── affiliates/               # Programa de afiliados (invites)
│   ├── check-ins/                # Queries de log de validação
│   ├── qr/                       # HMAC do QR Code
│   ├── email/                    # Resend (send + templates)
│   ├── utils/                    # Helpers (validators, formatters, cn)
│   └── validators/               # Schemas Zod
├── hooks/                        # React hooks
├── styles/                       # tokens.css
└── types/                        # supabase.ts (gerado)
```

---

## 5. Estado atual do sistema (2026-05-18)

### O que está pronto e rodando

| Funcionalidade                    | Status | Onde                                                     |
| --------------------------------- | ------ | -------------------------------------------------------- |
| Auth (email/senha + magic link)   | ✅     | `/entrar`                                                |
| CRUD de evento + lotes            | ✅     | `/organizador/eventos`                                   |
| Carrinho com mini-drawer          | ✅     | `/carrinho`, `CartDrawer`                                |
| Checkout demo (sem pagamento)     | ✅     | `/checkout/[id]`                                         |
| Geração QR HMAC                   | ✅     | `lib/qr/hmac.ts`                                         |
| Validação na porta (modo claro)   | ✅     | `/scan`                                                  |
| Lista de convidados + export CSV  | ✅     | `/organizador/eventos/[id]/convidados`                   |
| IDs únicos visíveis e copiáveis   | ✅     | GuestsListClient (ticket_id, order_id, paid_at completo) |
| Cortesias/lista VIP               | ✅     | `/organizador/eventos/[id]/cortesia`                     |
| Equipe/validadores                | ✅     | `/organizador/eventos/[id]/equipe`                       |
| Dashboard de check-ins            | ✅     | `/admin/check-ins`, `/organizador/check-ins`             |
| Programa afiliados (convite)      | ✅     | `/admin/afiliados`, `/afiliado/convite/[token]`          |
| Wallet do afiliado                | ✅     | `/minha-conta/afiliados`                                 |
| Página de preços competitiva      | ✅     | `/precos`                                                |
| Área premium de ingressos         | ✅     | `/minha-conta/ingressos` (cards boarding pass)           |
| Trocar senha logado               | ✅     | `/minha-conta/seguranca`                                 |
| Programa de afiliados visível     | ✅     | Banner discreto no admin se migration faltar             |
| Sidebar consistente nos 3 painéis | ✅     | admin/organizador/minha-conta com active state           |
| Voz AXON nas copys principais     | ✅     | Carrinho, BuyTicketForm, CTAs                            |

### O que está cabeado mas inativo

| Funcionalidade                 | Status | Falta pra ativar                                                                                        |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------- |
| Pagar.me Pix end-to-end        | 🟡     | Conta aprovada + chaves no `.env` + trocar `buyDemo` por `createPixChargeAction` em `BuyTicketForm.tsx` |
| Webhook Pagar.me               | 🟡     | URL no painel Pagar.me + `PAGARME_WEBHOOK_SECRET`                                                       |
| Config de pagamento por evento | 🟡     | UI já existe; backend espera Pagar.me ativa                                                             |
| Email confirmação de ingresso  | 🟡     | `RESEND_API_KEY` no env (template pronto)                                                               |
| Email de transferência         | 🟡     | idem                                                                                                    |
| Email de reembolso             | 🟡     | idem                                                                                                    |

### O que ainda não existe

| Funcionalidade                                      | Por quê não tem                                          | Prioridade                      |
| --------------------------------------------------- | -------------------------------------------------------- | ------------------------------- |
| Pagamento cartão (tokenização + 3DS)                | Complexo, requer Pagar.me.js no client                   | Média (depois do Pix funcionar) |
| Email de boas-vindas                                | Não foi pedido                                           | Baixa                           |
| Email lembrete pré-evento                           | Não foi pedido (precisa cron)                            | Média                           |
| Email pós-evento ("como foi")                       | Não foi pedido                                           | Baixa                           |
| Email convite de afiliado (Resend)                  | Por agora admin copia link manual                        | Baixa                           |
| Antifraude (Turnstile + FingerprintJS + rate-limit) | Sprint 5 não implementada                                | **Alta antes do piloto real**   |
| Sentry configurado                                  | Não plugado                                              | **Alta antes do piloto**        |
| Cobertura E2E Playwright real                       | Existe `playwright.config.ts` mas sem testes do checkout | Média                           |
| `pg_cron` pra expire_pending_orders                 | SQL existe comentado em 003                              | **Alta quando Pagar.me ativar** |
| App nativo (iOS/Android)                            | PWA atende                                               | Baixa                           |
| Modo offline do `/scan`                             | Service worker não foi implementado                      | Média (pré-piloto seria bom)    |
| LGPD endpoints (export/delete)                      | Não implementado                                         | Média (regulatório)             |
| Audit_logs em CPF                                   | Não implementado                                         | Média (LGPD)                    |

---

## 6. Migrations aplicadas no banco

| Nº  | Conteúdo                                                                                                     | Aplicada                 |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------ |
| 001 | Schema inicial: profiles, events, orders, tickets, check_ins, audit_logs...                                  | ✅                       |
| 002 | RLS policies em todas as tabelas                                                                             | ✅                       |
| 003 | Functions: confirm_order, reserve_lot, release_lot, validate_ticket, generate_qr_hash, expire_pending_orders | ✅                       |
| 004 | Seed de dev                                                                                                  | ✅                       |
| 005 | cart_items + avatar_url                                                                                      | ✅                       |
| 006 | banner_url em events                                                                                         | ✅                       |
| 007 | Transfer token + refund                                                                                      | ✅                       |
| 008 | Affiliates + referrals + códigos                                                                             | ✅ aplicada nesta sessão |
| 009 | Afiliados por convite + status + wallet_credit_cents em profiles + trigger                                   | ✅ aplicada nesta sessão |
| 010 | payment_methods jsonb em events + get_payment_fees function                                                  | ✅ aplicada nesta sessão |

### GUCs pendentes no Postgres (precisa logar como `jdchefe@gmail.com` no Supabase Studio → SQL Editor)

```sql
-- Necessário pra confirm_order gerar QR via SQL function (fluxo real Pagar.me)
ALTER DATABASE postgres SET app.qr_secret = '<copiar QR_HMAC_SECRET do .env.local>';

-- Necessário pra is_admin() function reconhecer admins via email
ALTER DATABASE postgres SET app.admin_emails = 'admin@axon.com.br,johnattan.dias@gmail.com,jdchefe@gmail.com';

-- Necessário pra expirar reservas pending automaticamente
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('expire-orders', '* * * * *', 'SELECT public.expire_pending_orders();');
```

---

## 7. Emails — estado atual

Implementação: `src/lib/email/send.ts` (Resend via fetch) + `src/lib/email/templates.ts` (3 templates).

| Email                             | Trigger                                            | Template                         | Status                         |
| --------------------------------- | -------------------------------------------------- | -------------------------------- | ------------------------------ |
| Confirmação de compra             | `buyDemo` / `createPixChargeAction` após pagamento | ✅ pronto                        | Inativo (sem `RESEND_API_KEY`) |
| Transferência de ingresso         | server action de transfer                          | ✅ pronto                        | Inativo                        |
| Reembolso processado              | admin marca refund                                 | ✅ pronto                        | Inativo                        |
| Confirmação de email pós-cadastro | Supabase Auth nativo                               | (Supabase)                       | Ativo via Supabase             |
| Convite de afiliado               | admin gera convite                                 | ❌ não existe (link manual hoje) | Pendente                       |
| Lembrete pré-evento               | cron                                               | ❌ não existe                    | Pendente                       |

### Pra ativar emails transacionais

1. Conta Resend criada + domínio `axon.app` verificado (DKIM/SPF)
2. `RESEND_API_KEY` e `RESEND_FROM_EMAIL` no `.env.local` e na Vercel
3. Testar com `node` script que importa `sendTicketConfirmation` direto

Sem isso, `send.ts` apenas faz `console.warn` e retorna `{sent: false, error: 'no_api_key'}` — não quebra, mas não envia.

---

## 8. Verificações de identidade

| Verificação                        | Onde                                        | Status                                           |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------------ |
| Email do user (confirmar cadastro) | Supabase Auth                               | ✅ Ativo (link no email enviado pelo Supabase)   |
| CPF (validação dígitos)            | `lib/utils/validators.ts:validateCPF`       | ✅ Usado em todos os 3 fluxos de compra/transfer |
| Senha forte (mín 8 chars)          | `SecurityForm` em `/minha-conta/seguranca`  | ✅                                               |
| 2FA                                | —                                           | ❌ não implementado                              |
| KYC pra organizador                | `organizers.kyc_status` ('pending' default) | 🟡 campo existe, sem fluxo de upload de docs     |
| Verificação de telefone (SMS)      | —                                           | ❌ não implementado                              |

---

## 9. Bugs conhecidos e correções aplicadas nesta sessão

### Corrigidos (na branch `worktree-hardening-pre-piloto`)

- ✅ Race condition de estoque (UPDATE condicional)
- ✅ Erros silenciosos em `buyDemo` e `checkoutDemo` (rollback completo)
- ✅ Race em `claimTransfer` (filtro extra no UPDATE)
- ✅ CPF aceitando "abc" (agora valida algoritmo)
- ✅ QR HMAC com fallback secret em produção (erro explícito)
- ✅ `verifyQrPayload` com `timingSafeEqual` (timing attack)
- ✅ `middleware.ts` → `proxy.ts` (Next 16)
- ✅ pnpm-workspace.yaml com allowBuilds preenchido
- ✅ Mobile: overflow-x global no html/body
- ✅ Mobile: countdown unidades responsivas
- ✅ Mobile: PremiumTicketCard com truncate/min-w-0
- ✅ Mobile: drawer 280px max-w-[80vw]
- ✅ Mobile: hero blur escalado
- ✅ Toaster z-index 1100 (fica acima de drawer)
- ✅ Badge com `max-w-full truncate`
- ✅ WhatsApp flutuante respeita `safe-area-inset-bottom`
- ✅ Logging em catch silencioso de afiliado + loop release_lot
- ✅ types/supabase.ts inclui payment_methods (sem mais `as any`)

### Pendentes (não críticos)

- Cart drawer altura em tablet landscape
- Inputs sem `min-h-[44px]` (tap target)
- Event banner sem skeleton placeholder durante load
- Carousel sem scroll snap

---

## 10. Comandos úteis

```bash
# Dev
pnpm dev                              # localhost:3000
pnpm build                            # produção
pnpm lint && pnpm typecheck && pnpm test  # antes de PR

# Supabase
node --env-file=.env.local scripts/check-db.mjs        # inspeciona DB remoto
node --env-file=.env.local scripts/apply-008-009.mjs   # aplica 008+009
node --env-file=.env.local scripts/apply-010.mjs       # aplica 010
node --env-file=.env.local scripts/wipe-my-orders.mjs  # limpa pedidos demo do owner

# Git
git checkout worktree-hardening-pre-piloto    # branch principal de trabalho
git pull                                       # antes de codar
```

---

## 11. URLs importantes

- Site produção: https://axonia.vercel.app (rodando `main`)
- Site preview da branch: https://axonia-git-worktree-hardening-pre-piloto-johnattans-projects.vercel.app (rodando `worktree-hardening-pre-piloto`) — confirmar URL real no painel Vercel
- Repo: https://github.com/Johnattandias12/Axon
- Supabase Studio: https://supabase.com/dashboard/project/qirogiafdyyvsuxspepq (login: `jdchefe@gmail.com`)

---

## 12. Checklist pré-piloto

Marcar conforme for fazendo:

- [ ] Pagar.me aprovou conta sandbox
- [ ] `PAGARME_API_KEY`, `PAGARME_WEBHOOK_SECRET`, `PAGARME_RECIPIENT_AXON` setados em `.env.local` e Vercel
- [ ] Webhook URL configurada no painel Pagar.me
- [ ] `app.qr_secret` ativado no Supabase via SQL Editor
- [ ] `app.admin_emails` ativado no Supabase
- [ ] `pg_cron` ativado pra expire_pending_orders
- [ ] `RESEND_API_KEY` ativada
- [ ] Domínio `axon.app` verificado no Resend (DKIM/SPF)
- [ ] Sentry plugado (dev + prod)
- [ ] Turnstile no checkout
- [ ] Rate limit por CPF/IP no checkout
- [ ] Testes E2E Playwright do fluxo de Pix completo
- [ ] Teste de carga (k6) com 1000 compras simultâneas
- [ ] `/scan` testado offline com pré-cache de hashes
- [ ] Mergear `worktree-hardening-pre-piloto` → `main`

---

## 13. Próximas alterações

> Anote aqui o que você quer mudar. O Claude lê esta seção quando você pedir pra continuar.

### Pedidos pendentes

- (preencha)

### Bugs que você notou

- (preencha)

### Ideias pra depois

- (preencha)
