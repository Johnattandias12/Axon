# 💳 Sprint 2 — Checkout (Pix + Cartão)

> Pré-requisito: Sprint 1 fechada.

## Contexto obrigatório

Leia:

- `CLAUDE.md`
- `docs/02-data-model.md` (orders, transactions, tickets)
- `docs/04-payment-flow.md` ← **leitura prioritária**
- `docs/05-validation-flow.md` (geração do QR)
- `docs/06-antifraud.md` (regras básicas já nessa sprint)
- `docs/07-legal-compliance.md` (CDC, meia-entrada)

## Objetivo

Comprador finaliza compra com **Pix** ou **cartão**, recebe ingresso com QR válido no e-mail e no painel. Webhook idempotente. Reserva de estoque com timer.

## Entregas

### 1. Carrinho / reserva de estoque

#### Rota: `/eventos/[slug]` → ação "Continuar"

- Server action `reserveOrder({ event_id, items: [{lot_id, quantity}] })`:
  1. Valida que cada lote tem estoque (chama `reserve_lot()` em transação).
  2. Cria `orders` com `status='pending'`, `reserved_until = now() + 15 minutos`.
  3. Cria `order_items`.
  4. Retorna `{ order_id }`.
- Redireciona para `/checkout/[order_id]`.

#### Timer

- `<ReservationTimer />` Client Component conta os 15 minutos.
- Quando expira: chama action `cancelOrder(id)` → libera estoque → redireciona para evento.

### 2. Página de checkout — `/checkout/[id]`

3 etapas com `<Tabs />` ou progresso linear:

#### Etapa 1 — Identificação dos titulares

- 1 form por ingresso (se evento `is_nominal`).
- Campos: nome completo, CPF.
- Se ingresso `is_half_price`: campo "Categoria" + upload de documento (Storage `half-price-docs/`).
- Validação Zod com mensagens claras.

#### Etapa 2 — Método de pagamento

- Cards visuais: **Pix** (recomendado, sem juros, aprovação na hora) | **Cartão de crédito**.
- Cartão: campos número, validade, CVV, nome, parcelamento (até 12x sem juros até 5x; após, com juros do organizador) — **tokenizar via SDK JS da Pagar.me no client** (PAN nunca toca nosso server).
- Pix: só botão "Gerar Pix".

#### Etapa 3 — Confirmação

- Resumo do pedido (itens, taxa, total).
- Aceite explícito de "Política de privacidade" e "Termos de compra".
- **Cloudflare Turnstile** invisível.
- Botão "Finalizar".

### 3. Integração Pagar.me

#### Wrapper em `src/lib/pagarme/`

- `client.ts` — instância do SDK com `PAGARME_API_KEY`.
- `orders.ts` — `createPixOrder(order)`, `createCreditCardOrder(order, cardToken)`.
- `webhook.ts` — `verifySignature(rawBody, header)`, `parseEvent(payload)`.
- `recipients.ts` — `createRecipient(organizer)` (usado no onboarding KYC aprovado).
- `types.ts` — tipos Zod do payload da Pagar.me.

#### Split rules

Toda charge inclui:

```ts
split: {
  rules: [
    {
      recipient_id: organizer.pagarme_recipient_id,
      percentage: 100 - feePct,
      type: "percentage",
      options: { liable: true, charge_processing_fee: true, charge_remainder_fee: true },
    },
    { recipient_id: process.env.PAGARME_RECIPIENT_AXON!, percentage: feePct, type: "percentage" },
  ]
}
```

> `feePct` = porcentagem da AXON sobre o valor total. Default 10. Configurável por organizador (Sprint 4).

#### Server actions

- `createPixOrder(orderId)`:
  - Carrega order + items + organizer.
  - Cria customer na Pagar.me (idempotente — usar CPF como `external_reference`).
  - Cria order Pagar.me com `payments: [{ payment_method: 'pix', pix: { expires_in: 900 } }]`.
  - Salva `transactions` row + `orders.gateway_order_id`.
  - Retorna `{ qr_code, qr_code_url, copia_cola, expires_at }`.

- `createCreditCardOrder(orderId, cardToken)`:
  - Similar, mas `payment_method: 'credit_card'` com `installments`, `authentication: { type: 'threed_secure', threed_secure: { mpi: 'pagarme' } }`, `antifraud_enabled: true`.
  - Resposta pode incluir `redirect_url` para 3DS.

### 4. Exibição do Pix

Componente `<PixDisplay />`:

- QR code (renderizado de `qr_code_url` ou via lib `qrcode.react`).
- Botão "Copiar código" com `navigator.clipboard`.
- Timer regressivo até expirar.
- Subscription Realtime em `orders.id` filtrado por `status`.
- Quando `status = 'paid'` → animação ✅ → redirect para `/minha-conta/pedidos/[id]`.

### 5. Cartão com 3DS

- Após `createCreditCardOrder`, se vier `redirect_url`: `window.location.href = redirect_url`.
- Após autenticação, Pagar.me redireciona para nosso `success_url` (`/checkout/[id]/processando`).
- Página `processando` faz polling/Realtime aguardando webhook.

### 6. Webhook idempotente

#### Rota: `POST /api/webhooks/pagarme`

```ts
1. Ler raw body (sem JSON.parse antes).
2. Verificar header X-Hub-Signature com PAGARME_WEBHOOK_SECRET.
3. Parse JSON.
4. INSERT INTO webhook_events (id, gateway, type, payload) ON CONFLICT (id) DO NOTHING.
   - Se afetou 0 rows → retorna 200 (já processado).
5. Switch event.type:
   - 'order.paid'          → confirm_order(order_id) → email + push realtime
   - 'order.payment_failed'→ cancelOrder + libera estoque
   - 'charge.refunded'     → process_refund(charge_id)
   - 'charge.chargedback'  → flag fraud + cancel tickets
6. Retorna 200.
```

Wrapper em `src/lib/pagarme/webhook.ts` com tipos Zod.

### 7. Confirmação e ingresso

#### Após `confirm_order` (SQL function da migration 003)

- Tickets criados com `qr_hash` gerado por HMAC server-side.
- Job (Edge Function ou inline) dispara:
  - E-mail via Resend (template React em `src/emails/TicketEmail.tsx`).
  - PDF de cada ingresso anexado (gerado via `@react-pdf/renderer`).
- Realtime publica evento `'order_paid'` no channel `order:<id>`.

#### Página `/minha-conta/pedidos/[id]`

- Lista ingressos com QR exibido grande.
- Botão "Baixar PDF".
- Botão "Compartilhar" (Web Share API).

### 8. Polling/Realtime no client

Hook `usePixPaymentStatus(orderId)`:

- Subscribe via `supabase.channel('order:'+id)` em update de `orders`.
- Fallback: polling a cada 5s no `GET /api/orders/[id]/status`.

### 9. Cron de expiração

Configurar `pg_cron` (ou Edge Function via Vercel Cron) a cada minuto:

```sql
SELECT public.expire_pending_orders();
```

### 10. Antifraude — camada mínima nesta sprint

Em `src/lib/antifraud/rules/`:

- `max_qty_per_event.ts` — bloqueia >4 ingressos por CPF no mesmo evento.
- `velocity_ip.ts` — >5 pedidos do mesmo IP em 1h.
- `disposable_email.ts` — lista de domínios.
- `cpf_invalid.ts` — validação de DV.

Orquestrador `evaluateOrder(orderInput, context)` retorna `{ decision, score, reasons[] }`. Chamar **antes** de criar a order. Se `deny` → erro 403 ao comprador.

## Testes obrigatórios

### Unitários

- Validação de cartão (Luhn).
- HMAC do webhook.
- Cálculo de split.
- Idempotência do webhook (mesmo event_id 2x).
- Cada regra antifraude em isolamento.

### E2E (Playwright)

- Fluxo Pix completo (mock do webhook chegando após delay).
- Fluxo cartão sem 3DS (cartão de teste Pagar.me).
- Fluxo cartão recusado.
- Reserva expira → estoque volta.
- Não consegue comprar >4 do mesmo evento.

## Definition of Done

- [ ] Comprador finaliza Pix → recebe e-mail + vê QR no painel
- [ ] Comprador finaliza cartão (com e sem 3DS)
- [ ] Webhook duplicado não processa 2x
- [ ] Reserva expira em 15min e libera estoque
- [ ] Antifraude bloqueia >4 ingressos por CPF
- [ ] Turnstile validado server-side
- [ ] E-mail com PDF chega na caixa
- [ ] Testes E2E passando
- [ ] Build prod sem erros

## Próxima sprint

Sprint 3 — Validação: `prompts/sprint-3-validation.md`
