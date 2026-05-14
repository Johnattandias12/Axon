# 02 — Modelo de Dados

> O SQL executável está em `supabase/migrations/`. Este arquivo explica o **porquê** de cada tabela.

## Diagrama de entidades

```
auth.users ─┬─< profiles
            └─< organizers ───< events ───< ticket_types ───< ticket_lots
                                 │                                │
                                 └─< event_validators              │
                                                                   │
profiles ─< orders ───< order_items >─────────────────────────────┘
              │
              └─< tickets ───< check_ins
              └─< transactions
              └─< refunds

organizers ─< payouts
orders ─< fraud_flags
* ─< audit_logs
```

## Tabelas

### `profiles`

Estende `auth.users` (Supabase). 1:1.

| Campo        | Tipo                    | Notas                                                    |
| ------------ | ----------------------- | -------------------------------------------------------- |
| `id`         | uuid PK (FK auth.users) |                                                          |
| `full_name`  | text                    |                                                          |
| `cpf`        | text UNIQUE             | criptografado (pgcrypto) ou hashed                       |
| `phone`      | text                    | E.164                                                    |
| `role`       | text CHECK              | `'buyer'` \| `'organizer'` \| `'validator'` \| `'admin'` |
| `created_at` | timestamptz             |                                                          |

### `organizers`

Quem publica eventos. Vinculado a 1 profile.

| Campo          | Tipo             | Notas                                                 |
| -------------- | ---------------- | ----------------------------------------------------- |
| `id`           | uuid PK          |                                                       |
| `user_id`      | uuid FK profiles |                                                       |
| `kind`         | text             | `'pf'` \| `'pj'`                                      |
| `legal_name`   | text             | razão social ou nome completo                         |
| `trade_name`   | text             | nome fantasia                                         |
| `cnpj_or_cpf`  | text             |                                                       |
| `bank_account` | jsonb            | `{ bank, agency, account, type, holder, holder_doc }` |
| `kyc_status`   | text             | `'pending'` \| `'approved'` \| `'rejected'`           |
| `fee_pct`      | numeric(5,2)     | taxa adicional (padrão 0)                             |
| `created_at`   | timestamptz      |                                                       |

### `events`

| Campo                 | Tipo        | Notas                                                              |
| --------------------- | ----------- | ------------------------------------------------------------------ |
| `id`                  | uuid PK     |                                                                    |
| `organizer_id`        | uuid FK     |                                                                    |
| `slug`                | text UNIQUE | URL-friendly                                                       |
| `title`               | text        |                                                                    |
| `description`         | text        | markdown                                                           |
| `category`            | text        | `'show'` \| `'esporte'` \| `'religioso'` \| `'curso'` \| `'outro'` |
| `banner_url`          | text        | Storage                                                            |
| `venue_name`          | text        |                                                                    |
| `address`             | text        |                                                                    |
| `city`                | text        |                                                                    |
| `state`               | text        | UF                                                                 |
| `lat` `lng`           | numeric     |                                                                    |
| `starts_at` `ends_at` | timestamptz |                                                                    |
| `status`              | text        | `'draft'` \| `'published'` \| `'cancelled'` \| `'finished'`        |
| `capacity`            | int         | soma máx. dos lotes                                                |
| `cover_policy`        | jsonb       | `{ refund_days, partial_refund_pct }`                              |
| `created_at`          | timestamptz |                                                                    |

### `ticket_types`

"VIP", "Pista", "Camarote". Agrupa lotes.

| Campo         | Tipo    | Notas             |
| ------------- | ------- | ----------------- |
| `id`          | uuid PK |                   |
| `event_id`    | uuid FK |                   |
| `name`        | text    |                   |
| `description` | text    |                   |
| `position`    | int     | ordem de exibição |

### `ticket_lots`

1º lote, 2º lote… Onde está o **preço** e o **estoque**.

| Campo                 | Tipo        | Notas                        |
| --------------------- | ----------- | ---------------------------- |
| `id`                  | uuid PK     |                              |
| `ticket_type_id`      | uuid FK     |                              |
| `name`                | text        | "1º lote"                    |
| `price_cents`         | int         | sempre em centavos           |
| `quantity_total`      | int         | estoque inicial              |
| `quantity_sold`       | int         | DEFAULT 0                    |
| `quantity_reserved`   | int         | DEFAULT 0 (reservas pending) |
| `is_half_price`       | bool        | meia-entrada?                |
| `starts_at` `ends_at` | timestamptz | vigência do lote             |
| `position`            | int         | ordem                        |

> **Constraint:** soma de `quantity_total` onde `is_half_price = true` deve ser >= 40% do total do evento.

### `orders`

Pedido = N tickets.

| Campo               | Tipo             | Notas                                                                   |
| ------------------- | ---------------- | ----------------------------------------------------------------------- |
| `id`                | uuid PK          |                                                                         |
| `buyer_id`          | uuid FK profiles |                                                                         |
| `event_id`          | uuid FK          | desnormalizado p/ queries                                               |
| `status`            | text             | `'pending'` \| `'paid'` \| `'cancelled'` \| `'refunded'` \| `'expired'` |
| `subtotal_cents`    | int              | soma dos itens                                                          |
| `service_fee_cents` | int              | taxa AXON (~10%)                                                        |
| `total_cents`       | int              | subtotal + taxa                                                         |
| `payment_method`    | text             | `'pix'` \| `'credit_card'`                                              |
| `gateway_order_id`  | text             | id na Pagar.me                                                          |
| `reserved_until`    | timestamptz      | expira em 15min                                                         |
| `paid_at`           | timestamptz      |                                                                         |
| `metadata`          | jsonb            | UTM, fingerprint, IP                                                    |
| `created_at`        | timestamptz      |                                                                         |

### `order_items`

| Campo              | Tipo    | Notas             |
| ------------------ | ------- | ----------------- |
| `id`               | uuid PK |                   |
| `order_id`         | uuid FK |                   |
| `ticket_lot_id`    | uuid FK |                   |
| `quantity`         | int     |                   |
| `unit_price_cents` | int     | snapshot do preço |

### `tickets`

Ingresso individual. 1 order_item de quantity 3 = 3 rows aqui.

| Campo                 | Tipo        | Notas                                                          |
| --------------------- | ----------- | -------------------------------------------------------------- |
| `id`                  | uuid PK     |                                                                |
| `order_id`            | uuid FK     |                                                                |
| `ticket_lot_id`       | uuid FK     |                                                                |
| `event_id`            | uuid FK     | desnormalizado                                                 |
| `qr_hash`             | text UNIQUE | HMAC-SHA256 (server-only secret)                               |
| `holder_name`         | text        | nome do titular                                                |
| `holder_cpf`          | text        | CPF do titular                                                 |
| `is_half_price`       | bool        | herda do lot                                                   |
| `half_price_doc_type` | text        | `'estudante'` \| `'idoso'` \| `'pcd'` \| `'jovem_baixa_renda'` |
| `status`              | text        | `'valid'` \| `'used'` \| `'cancelled'` \| `'refunded'`         |
| `used_at`             | timestamptz |                                                                |
| `used_by`             | uuid FK     | id do validator                                                |
| `gate`                | text        | "Portão A"                                                     |
| `created_at`          | timestamptz |                                                                |

### `transactions`

Histórico de tentativas de pagamento.

| Campo          | Tipo        | Notas                                                                   |
| -------------- | ----------- | ----------------------------------------------------------------------- |
| `id`           | uuid PK     |                                                                         |
| `order_id`     | uuid FK     |                                                                         |
| `gateway`      | text        | `'pagarme'` \| `'mercadopago'`                                          |
| `gateway_id`   | text        |                                                                         |
| `method`       | text        | `'pix'` \| `'credit_card'`                                              |
| `amount_cents` | int         |                                                                         |
| `status`       | text        | `'pending'` \| `'paid'` \| `'failed'` \| `'refunded'` \| `'chargeback'` |
| `raw_response` | jsonb       | payload completo do gateway                                             |
| `created_at`   | timestamptz |                                                                         |

### `payouts`

Saques solicitados pelo organizador.

| Campo                    | Tipo        | Notas                                                     |
| ------------------------ | ----------- | --------------------------------------------------------- |
| `id`                     | uuid PK     |                                                           |
| `organizer_id`           | uuid FK     |                                                           |
| `amount_cents`           | int         |                                                           |
| `status`                 | text        | `'requested'` \| `'processing'` \| `'paid'` \| `'failed'` |
| `bank_snapshot`          | jsonb       | conta no momento da solicitação                           |
| `requested_at` `paid_at` | timestamptz |                                                           |

### `refunds`

| Campo          | Tipo         | Notas                                                                        |
| -------------- | ------------ | ---------------------------------------------------------------------------- |
| `id`           | uuid PK      |                                                                              |
| `order_id`     | uuid FK      |                                                                              |
| `ticket_id`    | uuid FK NULL | se reembolso parcial                                                         |
| `reason`       | text         | `'cdc_7_days'` \| `'event_cancelled'` \| `'fraud'` \| `'organizer_decision'` |
| `amount_cents` | int          |                                                                              |
| `status`       | text         | `'requested'` \| `'approved'` \| `'rejected'` \| `'paid'`                    |
| `created_at`   | timestamptz  |                                                                              |

### `check_ins`

Auditoria de cada scan (mesmo se rejeitado).

| Campo            | Tipo             | Notas                                                              |
| ---------------- | ---------------- | ------------------------------------------------------------------ |
| `id`             | uuid PK          |                                                                    |
| `ticket_id`      | uuid FK NULL     | NULL se QR inválido                                                |
| `event_id`       | uuid FK          |                                                                    |
| `validator_id`   | uuid FK profiles |                                                                    |
| `result`         | text             | `'valid'` \| `'already_used'` \| `'invalid_hmac'` \| `'cancelled'` |
| `scanned_at`     | timestamptz      |                                                                    |
| `gate`           | text             |                                                                    |
| `offline_synced` | bool             | true se veio da fila offline                                       |

### `event_validators`

Quem pode validar QR em qual evento.

| Campo      | Tipo                | Notas                 |
| ---------- | ------------------- | --------------------- |
| `event_id` | uuid FK             |                       |
| `user_id`  | uuid FK profiles    |                       |
| `gate`     | text NULL           | restringe a um portão |
| PK         | (event_id, user_id) |                       |

### `fraud_flags`

| Campo         | Tipo             | Notas                                       |
| ------------- | ---------------- | ------------------------------------------- |
| `id`          | uuid PK          |                                             |
| `order_id`    | uuid FK          |                                             |
| `rule`        | text             | `'max_cpf_per_event'`, `'velocity_ip'`, etc |
| `score`       | int              | 0–100                                       |
| `decision`    | text             | `'allow'` \| `'review'` \| `'deny'`         |
| `reviewed_by` | uuid FK NULL     |                                             |
| `reviewed_at` | timestamptz NULL |                                             |

### `audit_logs`

LGPD + segurança.

| Campo          | Tipo         | Notas                                    |
| -------------- | ------------ | ---------------------------------------- |
| `id`           | uuid PK      |                                          |
| `actor_id`     | uuid FK NULL |                                          |
| `action`       | text         | `'pii_access'`, `'event_published'`, etc |
| `target_table` | text         |                                          |
| `target_id`    | uuid         |                                          |
| `metadata`     | jsonb        |                                          |
| `ip`           | inet         |                                          |
| `user_agent`   | text         |                                          |
| `created_at`   | timestamptz  |                                          |

## Índices críticos

```sql
CREATE INDEX idx_events_status_starts ON events(status, starts_at) WHERE status='published';
CREATE INDEX idx_events_city ON events(city) WHERE status='published';
CREATE INDEX idx_tickets_qr_hash ON tickets(qr_hash);
CREATE INDEX idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX idx_orders_event ON orders(event_id, status);
CREATE INDEX idx_check_ins_event ON check_ins(event_id, scanned_at);
CREATE UNIQUE INDEX idx_tx_gateway_id ON transactions(gateway, gateway_id);
```

## Functions SQL principais

| Função                                         | Onde               | Faz                                             |
| ---------------------------------------------- | ------------------ | ----------------------------------------------- |
| `reserve_lot(lot_id, qty, order_id)`           | migration 003      | lock + decrementa `quantity_reserved`           |
| `confirm_order(order_id)`                      | webhook            | reservado → vendido, gera tickets com `qr_hash` |
| `expire_orders()`                              | cron               | libera reservas vencidas                        |
| `validate_ticket(qr_hash, validator_id, gate)` | edge function      | lock + marca used + audit                       |
| `compute_organizer_balance(organizer_id)`      | view materializada | saldo disponível/a liberar                      |
