# 💰 Sprint 4 — Financeiro (Split + Saldos + Saques)

> Pré-requisito: Sprint 3 fechada.

## Contexto obrigatório

- `CLAUDE.md`
- `docs/04-payment-flow.md` (split, antecipação)
- `docs/02-data-model.md` (payouts, organizer_balance view)
- `docs/07-legal-compliance.md` (tributação)

## Objetivo

Organizador vê **saldo disponível**, **saldo a liberar**, solicita **saque**, recebe na conta bancária via Pagar.me. Reembolso completo do ciclo.

## Entregas

### 1. Recipient Pagar.me automatizado

#### Ao aprovar KYC do organizador

- Server action `approveOrganizerKyc(organizer_id)` (admin only):
  - Cria recipient na Pagar.me via `lib/pagarme/recipients.ts`.
    - Tipo: PF ou PJ.
    - Conta bancária do organizador.
    - `default_bank_account.holder_document` = CPF/CNPJ.
  - Salva `organizers.pagarme_recipient_id`.
  - Marca `kyc_status = 'approved'`.
  - Notifica organizador por e-mail.

#### Atualização de conta bancária

- Em `/organizador/configuracoes/financeiro`:
  - Formulário para alterar conta.
  - Server action atualiza recipient na Pagar.me.
  - Audit log.

### 2. Split aplicado automaticamente

Já parcialmente feito na Sprint 2. Confirmar:

- Toda charge inclui split com `organizer.pagarme_recipient_id` e `PAGARME_RECIPIENT_AXON`.
- Percentual da AXON: `service_fee_cents / total_cents * 100` arredondado.
- `liable: true` no organizador (responsável por chargeback).
- Validar matemática: cálculo de fee em `lib/pricing/`.

### 3. View de saldo

A view `organizer_balance` já existe (migration 003). Refinar:

- `available_cents` — Pix com `paid_at < now() - 1d` E cartão com `paid_at < now() - 30d`.
- `pending_cents` — pagos mas ainda dentro do período de retenção.
- `withdrawn_cents` — somatório de payouts pagos.
- Subtrair reembolsos pagos.

Considerar transformar em view materializada com refresh a cada 5min se ficar lenta.

### 4. Painel financeiro do organizador

#### Rota `/organizador/financeiro`

**Aba "Visão geral":**

- 3 cards: Disponível para saque | A liberar | Sacado no histórico
- Gráfico de receita últimos 30 dias (barras por dia).
- Gráfico de tipo de pagamento (Pix vs cartão).

**Aba "Extrato":**

- Tabela paginada de transações por evento e por data.
- Filtros: período, status, método.
- Exportar CSV.

**Aba "Saques":**

- Histórico de payouts.
- Botão "Solicitar saque" (abre modal com valor + confirmação).
- Status visual: requested → processing → paid.

**Aba "Antecipação":**

- Mostra recebíveis futuros agrupados por data.
- Botão "Antecipar tudo" / "Antecipar lote selecionado".
- Calculo da taxa de antecipação (configurável; default 2,99%).

### 5. Solicitação de saque

#### Server action `requestPayout({ organizer_id, amount_cents })`

1. Verifica `organizers.user_id === auth.uid()`.
2. Verifica `organizer_balance.available_cents >= amount_cents`.
3. Cria `payouts` com `status='requested'` + `bank_snapshot`.
4. Dispara job que chama Pagar.me `transfers.create({ recipient_id, amount })`.
5. Atualiza `gateway_payout_id` e `status='processing'`.
6. Webhook da Pagar.me confirma → marca `status='paid'`.

#### Regras

- Saque mínimo: R$ 20 (configurável).
- Máximo de 1 saque pendente por organizador (UX).
- Conferir limite operacional Pagar.me (saque PIX para 3os é limitado por janela).

### 6. Antecipação de recebíveis

#### Server action `requestAnticipation({ organizer_id, amount_cents })`

- Chama Pagar.me `recipients/{id}/anticipations`.
- Cria registro local em tabela `anticipations` (criar nova migration `005_anticipations.sql`).
- Status: requested → processing → paid.

### 7. Reembolsos completos

#### Comprador solicita

- `/minha-conta/pedidos/[id]` → botão "Solicitar reembolso".
- Modal: motivo (CDC, problema, evento cancelado), observações.
- Cria `refunds` com `status='requested'`.
- Notifica organizador.

#### Organizador aprova/rejeita

- `/organizador/pedidos/[id]/reembolsos`.
- Aprovar → server action chama Pagar.me `charges/{id}/refund` (parcial ou total).
- Webhook confirma → marca `tickets.status='refunded'` + `refunds.status='paid'`.
- Notifica comprador.

#### Reembolso automático em cancelamento

- Quando organizador marca `events.status='cancelled'`:
  - Trigger SQL ou job dispara `refundAllOrders(event_id)`.
  - Cria refund row por order + chama Pagar.me em batch.
  - E-mail em massa para compradores.

### 8. Relatórios

Em `/organizador/relatorios`:

- **Vendas** — CSV com order_id, comprador, evento, lote, qty, valor, status, data.
- **Check-ins** — CSV com ticket_id, titular, horário, gate, validator.
- **Financeiro** — CSV com transação, taxa, líquido, status, data.

Gerar server-side via stream (não carregar tudo em memória).

### 9. Notificações

E-mails:

- KYC aprovado.
- Saque solicitado / pago.
- Reembolso solicitado (organizador) / aprovado (comprador).
- Evento cancelado (compradores).

Template comum em `src/emails/` com header e footer reutilizáveis.

## Testes obrigatórios

### Unitários

- Cálculo de saldo disponível considerando todos os edge cases (Pix recente, cartão antigo, reembolso, antecipação).
- Validação de valor mínimo de saque.
- Split percentual.

### E2E

- Criar venda → aguardar liberação simulada → solicitar saque → ver status muda.
- Pedido pago → solicitar reembolso → aprovado → ticket fica refunded.

## Definition of Done

- [ ] KYC aprovado cria recipient automático
- [ ] Saldo disponível bate com vendas (testar com 3 vendas e 1 reembolso)
- [ ] Saque é solicitado e processado
- [ ] Reembolso parcial e total funcionam
- [ ] Cancelar evento dispara reembolso em massa
- [ ] CSVs exportam corretamente
- [ ] Build prod + deploy

## Próxima sprint

Sprint 5 — Antifraude + polimento + deploy: `prompts/sprint-5-antifraud.md`
