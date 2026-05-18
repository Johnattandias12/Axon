# `src/lib/payments`

Tudo relacionado a **dinheiro** que entra ou sai da AXON mora aqui.

## Estrutura

```
payments/
├── pagarme/              # Integração Pagar.me v5 (Pix + cartão + split)
│   ├── client.ts         # Wrapper fetch da API Pagar.me (Basic Auth)
│   ├── types.ts          # Schemas Zod dos payloads e webhook events
│   ├── webhook-verify.ts # HMAC-SHA256 timing-safe verify
│   └── orders.ts         # createPagarmePixOrder, cancel, get, linkOrderToGateway
└── README.md             # Este arquivo
```

Arquivos relacionados (fora desta pasta):

| Arquivo                                 | Função                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `src/app/api/webhooks/pagarme/route.ts` | Recebe webhooks Pagar.me (HMAC + idempotência)                         |
| `src/app/checkout/pagarme-actions.ts`   | `createPixChargeAction` — cria order Pagar.me Pix                      |
| `src/app/checkout/actions.ts`           | `buyDemo` — fluxo demo sem gateway                                     |
| `supabase/migrations/003_functions.sql` | `confirm_order`, `reserve_lot`, `release_lot`, `expire_pending_orders` |

## Como ativar Pagar.me real (passo a passo)

### 1. Conseguir as chaves

- Conta criada em https://pagar.me + KYC AXON aprovado
- Dashboard → API Keys → copiar **secret key** (`sk_...`) e **public key** (`pk_...`)
- Criar webhook em Dashboard → Webhooks → copiar o **HMAC secret**

### 2. Configurar env vars

No `.env.local` (dev) e nas Project Settings do Vercel (prod):

```env
PAGARME_API_KEY="sk_test_xxxxxxxxxxxxxxxx"     # secret, server-side
NEXT_PUBLIC_PAGARME_PUBLIC_KEY="pk_test_xxxxx" # OK no client
PAGARME_WEBHOOK_SECRET="xxxxxxxxxxxxxxxxxxx"
PAGARME_RECIPIENT_AXON="rp_xxxxxxxxxxxx"       # recipient da AXON pra split
NEXT_PUBLIC_PAGARME_ENV="sandbox"              # "production" quando subir
```

### 3. Configurar webhook URL no painel Pagar.me

```
URL: https://axonia.vercel.app/api/webhooks/pagarme
Eventos: order.paid, order.payment_failed, order.canceled, order.expired,
         charge.refunded, charge.chargedback
HMAC: PAGARME_WEBHOOK_SECRET (mesmo valor do env)
```

### 4. Configurar app.qr_secret no Postgres (pra `confirm_order` SQL gerar QR)

No Supabase SQL Editor (logado como dono do projeto):

```sql
ALTER DATABASE postgres SET app.qr_secret = 'COLE_O_QR_HMAC_SECRET_DO_ENV_LOCAL';
```

> Sem isso, a função `confirm_order` falha quando o webhook chega.

### 5. Ativar pg_cron pra expire_pending_orders

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('expire-orders', '* * * * *', 'SELECT public.expire_pending_orders();');
```

> Sem isso, pedidos pending nunca expiram e estoque fica preso.

### 6. Cadastrar AXON como recipient

Uma vez só, via curl ou painel Pagar.me. Salvar o `recipient_id` em `PAGARME_RECIPIENT_AXON`.

Pra cada organizador: criar recipient próprio e salvar em `organizers.pagarme_recipient_id` (coluna já existe).

### 7. Testar localmente com ngrok

```bash
ngrok http 3000
# Copiar URL https://xxx.ngrok-free.app
# Setar no painel Pagar.me como webhook URL
pnpm dev
```

### 8. Comprar um Pix de teste

Em sandbox o Pagar.me oferece "simulate payment" — clicar marca como paid e dispara webhook. Comprar via `/eventos/[slug]` → checkoutDemo é trocado por `createPixChargeAction`.

> **Pra trocar buyDemo→Pagar.me real no front**, importar `createPixChargeAction` ao invés de `buyDemo` em `src/components/event/BuyTicketForm.tsx`.

### 9. Promover pra produção

- Trocar chaves `sk_test_` → `sk_live_`
- Trocar `NEXT_PUBLIC_PAGARME_ENV=production`
- Webhook URL apontando pro domínio final
- Rodar k6 de carga (1000 compras simultâneas)

## Regras inquebráveis (do CLAUDE.md)

- ✅ **Idempotência obrigatória** no webhook (chave: `event.id` Pagar.me) — já implementado via `webhook_events.id` UNIQUE
- ✅ **HMAC-SHA256** verify no webhook — já implementado em `webhook-verify.ts` com `timingSafeEqual`
- ✅ **Lock pessimista** em `reserve_lot` — já existe no SQL
- ✅ **Reserva 15 min** — `reserved_until` em orders + cron expire
- ❌ **NUNCA logar dados de cartão** (PAN, CVV) — atentar quando implementar cartão

## Roadmap deste módulo

- [x] Pix end-to-end (criar order → QR → webhook → confirm)
- [ ] Cartão com tokenização JS + 3DS
- [ ] Split com recipient por organizador
- [ ] Refunds (server action + UI)
- [ ] Payout pra organizadores (saque)
- [ ] Anticipação de recebíveis
- [ ] Dashboard financeiro do organizador (parcial em `/organizador/financeiro`)

## Por que não usar o SDK oficial `@pagarme/pagarme-nodejs-sdk`?

1. Pesado (>3MB) pra serverless
2. API REST direta com `fetch` é mais previsível
3. Type safety via Zod local nos payloads que efetivamente usamos

Se quiser trocar pelo SDK no futuro, é só substituir `client.ts` e re-implementar `orders.ts` com chamadas do SDK — os schemas em `types.ts` continuam válidos.
