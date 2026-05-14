# 04 — Fluxo de Pagamento

## Gateway

**Pagar.me** (Stone). Motivos:

- Split nativo entre AXON e organizador.
- ClearSale (antifraude) embutido em cartão.
- Pix com webhook em tempo real (geralmente <5s).
- 3DS 2.0 nativo.
- Boa documentação em português.

Secundário (futuro): **Mercado Pago** como fallback se aprovação cair.

## Conceitos da Pagar.me usados

- **Customer** — cadastro do comprador (criamos no checkout).
- **Order** — pedido, contém charges.
- **Charge** — cobrança individual (uma por método).
- **Split rules** — `recipients` na charge, define quem recebe quanto.
- **Recipient** — beneficiário (organizador) com `id` Pagar.me. Criado no onboarding.

## Fluxo Pix

```
[Cliente]                   [Servidor]              [Pagar.me]      [Webhook]
   │                            │                       │                │
   │ POST /checkout/finalize    │                       │                │
   ├───────────────────────────►│                       │                │
   │                            │ create order (split)  │                │
   │                            ├──────────────────────►│                │
   │                            │  { qr_code, copia... }│                │
   │                            │◄──────────────────────┤                │
   │ { qr, polling realtime }   │                       │                │
   │◄───────────────────────────┤                       │                │
   │                            │                       │                │
   │ (Cliente paga)             │                       │                │
   │                            │                       │  POST webhook  │
   │                            │                       │   order.paid   │
   │                            │◄──────────────────────────────────────┤
   │                            │ valida HMAC + idemp.  │                │
   │                            │ confirm_order(id)     │                │
   │                            │ (gera tickets)        │                │
   │                            │ trigger Realtime      │                │
   │ ← Realtime: paid           │                       │                │
   │◄───────────────────────────┤                       │                │
   │ redirect /minha-conta      │                       │                │
```

## Fluxo Cartão

```
1. Frontend: tokeniza cartão direto na Pagar.me (PCI scope-out)
   → recebe card_token (não tocamos no PAN)

2. Server action createCreditCardOrder(orderId, cardToken):
   - Cria order na Pagar.me com:
     - charge.payment_method = 'credit_card'
     - 3DS habilitado (authentication.type = 'threed_secure')
     - antifraud_enabled = true (ClearSale)
     - split.rules definidas
   - Recebe { status, redirect_url? }

3. Se requer 3DS → redireciona para redirect_url → cliente autentica → callback
   Senão → status já é 'paid' ou 'failed'

4. Webhook confirma definitivamente (mesmo se já temos 'paid' na resposta síncrona)
```

## Split

Em todas as charges, enviamos `split.rules`:

```json
{
  "split": {
    "rules": [
      {
        "recipient_id": "<recipient_organizador>",
        "percentage": 90,
        "type": "percentage",
        "options": {
          "charge_processing_fee": true,
          "charge_remainder_fee": true,
          "liable": true
        }
      },
      {
        "recipient_id": "<recipient_axon>",
        "percentage": 10,
        "type": "percentage"
      }
    ]
  }
}
```

> Os percentuais aqui são exemplificativos. O `service_fee_cents` da `order` é a referência.

## Webhook

Endpoint: `POST /api/webhooks/pagarme`

```ts
// pseudocódigo
1. Verificar header X-Hub-Signature (HMAC-SHA256 com secret)
2. Idempotência: SELECT FROM webhook_events WHERE event_id = body.id
   - Se já processado: return 200
3. Parse evento:
   - order.paid     → confirm_order(order_id) → gera tickets + email
   - order.payment_failed → mark order failed → free reservation
   - charge.refunded → process refund (criar refund row + update tickets)
   - charge.chargedback → flag fraud + bloqueia comprador
4. INSERT INTO webhook_events (id, processed_at)
5. return 200
```

**Boas práticas:**

- Responder 200 rapidamente. Processamento pesado → enfileirar (Supabase Edge Function async).
- Retry da Pagar.me é exponencial. Manter idempotência férrea.
- Em ambiente local, usar `ngrok` ou `cloudflared` pra testar.

## Geração de QR pós-pagamento

Função SQL `confirm_order(order_id uuid)`:

```sql
1. SELECT FROM orders WHERE id = $1 FOR UPDATE;
2. IF status != 'pending' THEN RAISE notice 'already processed'; RETURN; END IF;
3. UPDATE orders SET status='paid', paid_at=now();
4. FOR each order_item:
     FOR i in 1..quantity:
       INSERT INTO tickets (
         order_id, ticket_lot_id, event_id,
         qr_hash = encode(hmac(id::text, '<server_secret>', 'sha256'), 'hex'),
         holder_name, holder_cpf,
         is_half_price = (SELECT is_half_price FROM ticket_lots WHERE ...),
         status='valid'
       );
     END LOOP;
   END LOOP;
5. UPDATE ticket_lots SET quantity_sold = quantity_sold + N, quantity_reserved = quantity_reserved - N;
6. NOTIFY realtime channel;
```

> O **secret** está em `app.qr_secret` (GUC) ou em ENV `QR_HMAC_SECRET`. Edge Function lê do env.

## Reembolsos

Casos:

- **CDC 7 dias** — automático até 7d antes do evento, total. Após 7d, depende de política do organizador.
- **Evento cancelado** — automático, total, para todos.
- **Decisão do organizador** — manual.
- **Chargeback** — sistema cancela ingresso + bloqueia comprador.

Fluxo:

```
1. Comprador em /minha-conta clica "Solicitar reembolso"
2. Insere refunds row com status='requested'
3. Organizador aprova/rejeita em /organizador/pedidos/[id]
4. Se aprovado: POST /pagarme/refund → success → update refund + tickets='refunded'
```

## Antecipação de recebíveis

Padrão Pagar.me: D+30 no cartão. Pix: D+1.

Oferecer ao organizador: antecipar saldo D+30 mediante taxa (ex: 2,99%). Usa endpoint `recipients/{id}/anticipation`.

## Testes

- **Sandbox Pagar.me** com cartões de teste documentados.
- Cenários obrigatórios em E2E:
  - ✅ Pix pago dentro do prazo → ticket gerado
  - ✅ Pix expirado → reserva liberada
  - ✅ Cartão aprovado direto (sem 3DS)
  - ✅ Cartão com 3DS exigido
  - ✅ Cartão recusado por antifraude
  - ✅ Webhook duplicado (idempotência)
  - ✅ Reembolso parcial
  - ✅ Chargeback simulado
