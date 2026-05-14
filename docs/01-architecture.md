# 01 — Arquitetura

## Visão geral

```
┌─────────────────────────────────────────────────────────────┐
│  USUÁRIOS                                                    │
│  Comprador | Organizador | Validador (porteiro) | Admin     │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   Cloudflare    │  ← WAF, rate limit, Turnstile
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │     Vercel      │  ← Next.js 15 (App Router)
              │  - SSR/RSC      │
              │  - Server       │
              │    Actions      │
              │  - API Routes   │
              └────────┬────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
   ┌───▼────┐    ┌─────▼─────┐    ┌────▼────┐
   │Supabase│    │ Pagar.me  │    │ Resend  │
   │        │    │  - Pix    │    │ - Email │
   │ - PG   │    │  - Cartão │    │   trans │
   │ - Auth │    │  - Split  │    └─────────┘
   │ - RT   │    │  - 3DS    │
   │ - Edge │    │  - CSale  │
   │   Func │    └───────────┘
   │ - Stor │
   └────────┘
```

## Camadas

### 1. Apresentação (Next.js)

- **Server Components** por padrão; Client Components só quando necessário (formulários, scanner, realtime).
- **Server Actions** para mutações simples (criar evento, atualizar perfil).
- **Route Handlers** (`app/api/`) só para webhooks e integrações externas.
- **Streaming** + `Suspense` em listagens.

### 2. Domínio (`lib/`)

- `lib/supabase/` — 3 clients:
  - `server.ts` — server actions e RSC, usa cookies
  - `client.ts` — client components
  - `admin.ts` — service_role, só server-side em fluxos críticos (webhook)
- `lib/pagarme/` — wrapper do SDK, idempotência, retry, parse de webhook
- `lib/qr/` — `generateHmac`, `verifyHmac`, `buildPayload`
- `lib/antifraud/` — `evaluateOrder(order, context)` → `{ score, decision, reasons[] }`
- `lib/email/` — templates React do Resend

### 3. Persistência (Supabase)

- Postgres com RLS em todas as tabelas.
- Functions SQL para operações com lock (decrementar estoque, validar ticket).
- Realtime para Pix pending → paid e contagem de check-ins.
- Storage para banners de evento.
- Edge Functions (Deno) para:
  - `validate_ticket` (chamada do PWA com lock)
  - `pagarme_webhook` (idempotência + processamento assíncrono)
  - `expire_pending_orders` (cron a cada minuto)

## Fluxos principais

### Fluxo 1 — Criação de evento

```
Organizador → /organizador/eventos/novo
  → server action createEvent(data)
    → Zod valida
    → Supabase insert (RLS valida ownership)
    → Storage upload do banner
  → redirect /organizador/eventos/[id]
```

### Fluxo 2 — Compra com Pix

```
Comprador → /eventos/[slug]
  → seleciona ingressos → POST /api/orders/reserve (estoque +15min)
  → /checkout/[id] → preenche titulares
  → server action createPixOrder(orderId)
    → cria charge no Pagar.me
    → salva tx pending
  → exibe QR + copia-cola
  → Realtime subscription em orders.id
  → webhook recebe order.paid
    → emite tickets com HMAC
    → dispara email + push realtime
  → cliente vê confirmação automaticamente
```

### Fluxo 3 — Validação na porta (offline)

```
[Antes do evento]
Porteiro abre PWA conectado → baixa lista de qr_hash válidos do evento
SW cacheia em IndexedDB

[Na porta]
Scaneia QR → app extrai (ticket_id, hmac)
  → online?
     SIM: POST /api/scan/validate (lock SELECT FOR UPDATE)
          → marca used → 200 OK
     NÃO: valida HMAC localmente
          → marca em fila offline
          → mostra ✅ (warning sync pendente)

[Quando voltar online]
SW dispara sync da fila → POST batch → resolve conflitos (duplicatas)
```

## Decisões de arquitetura (ADRs resumidos)

| #   | Decisão                                | Razão                                              |
| --- | -------------------------------------- | -------------------------------------------------- |
| 1   | Next.js App Router (não Pages)         | RSC, streaming, server actions                     |
| 2   | Supabase (não Firebase/PlanetScale)    | Postgres + RLS + Realtime no mesmo lugar           |
| 3   | Pagar.me (não Stripe BR)               | Split nativo, ClearSale incluído, Pix maduro       |
| 4   | PWA (não app nativo)                   | Velocidade de iteração, distribuição sem app store |
| 5   | HMAC em QR (não JWT)                   | Payload menor cabe em QR de leitura rápida         |
| 6   | Edge Functions só para fluxos críticos | Latência menor, isolamento                         |
| 7   | Estoque com lock SQL (não Redis)       | Simplicidade, transação ACID com o pedido          |

## Anti-patterns que vamos evitar

- ❌ Lógica de autorização no client (Tailwind escondendo botão não é segurança).
- ❌ Webhook sem verificação de assinatura.
- ❌ Geração de QR no client.
- ❌ Estoque baseado em contador externo (Redis) sem source of truth no Postgres.
- ❌ Migrar dados via script ad-hoc — sempre via migration versionada.
