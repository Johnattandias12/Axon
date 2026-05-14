# 06 — Antifraude (5 camadas)

> Em marketplace de ingresso, fraude = chargeback = morte. Cada R$1 de chargeback custa ~R$5 considerando taxas + reputação. Esse documento é prioridade máxima.

## Princípio

**Defense in depth.** Nenhuma camada é suficiente sozinha. Atacante precisa furar todas.

```
┌───────────────────────────────────────────────────┐
│ 1. EDGE (Cloudflare WAF, rate limit, Turnstile)  │
├───────────────────────────────────────────────────┤
│ 2. APLICAÇÃO (regras de negócio, velocity, lista)│
├───────────────────────────────────────────────────┤
│ 3. DEVICE (fingerprint, geo, comportamento)      │
├───────────────────────────────────────────────────┤
│ 4. GATEWAY (Pagar.me + ClearSale + 3DS)          │
├───────────────────────────────────────────────────┤
│ 5. MONITORAMENTO (alertas + revisão manual)      │
└───────────────────────────────────────────────────┘
```

---

## Camada 1 — Edge

**Cloudflare** na frente do Vercel:

- WAF com regras Managed (OWASP).
- Rate limit: 100 req/min por IP em `/api/*`. 10 req/min em `/api/orders/*`.
- Bot Fight Mode ligado.
- Geo-block opcional (configurável; padrão: Brasil + Portugal).

**Cloudflare Turnstile** (captcha invisível):

- Disparado em: criação de pedido, login, formulário de validador.
- Token validado server-side antes de qualquer processamento.

---

## Camada 2 — Regras de negócio

Implementadas em `lib/antifraud/rules/` e executadas pelo orquestrador `evaluateOrder(order, ctx)`.

| Regra                   | Condição                                          | Ação   |
| ----------------------- | ------------------------------------------------- | ------ |
| `max_qty_per_event`     | >4 ingressos por CPF no mesmo evento              | DENY   |
| `max_qty_per_lot`       | >10 ingressos do mesmo lote no pedido             | REVIEW |
| `velocity_ip`           | >5 pedidos do mesmo IP em 1h                      | REVIEW |
| `velocity_card`         | mesmo cartão em >3 CPFs em 24h                    | DENY   |
| `disposable_email`      | domínio em lista (mailinator etc)                 | DENY   |
| `blacklist_cpf`         | CPF em `fraud_flags` com decision='deny' aprovado | DENY   |
| `blacklist_ip`          | idem                                              | DENY   |
| `cpf_invalid`           | DV de CPF não bate                                | DENY   |
| `mismatch_holder_buyer` | holder_cpf != buyer.cpf em >2 tickets             | REVIEW |
| `event_blackout`        | organizador desativou compras temporariamente     | DENY   |
| `vpn_datacenter_ip`     | ASN é datacenter conhecido                        | REVIEW |

Saída do orquestrador:

```ts
{
  score: 0-100,
  decision: 'allow' | 'review' | 'deny',
  reasons: string[]
}
```

- `allow` → segue checkout normal.
- `review` → pedido fica pending com flag; admin revisa em até 30min ou cancela.
- `deny` → pedido é cancelado, comprador vê mensagem genérica ("não foi possível concluir").

---

## Camada 3 — Device / comportamento

**FingerprintJS** (free tier 20k/mês — depois pago, vale a pena):

- Visitor ID estável independente de cookies.
- Detecção de incognito, tor, headless.
- Score de bot.

Salvar em `orders.metadata.fingerprint = { visitorId, score, suspect }`.

**Sinais comportamentais** (capturar no client):

- Tempo total no checkout (<10s = suspeito).
- Quantidade de mouse moves / touches.
- Erros de validação de form (bot raramente erra).
- Mudança de idioma do browser durante a sessão.

---

## Camada 4 — Gateway

**Pagar.me com ClearSale** (anti-fraude do mercado financeiro):

- Score automático na charge.
- `antifraud_enabled: true` em toda cobrança de cartão.
- Configurar regras de cutoff no painel Pagar.me (auto-reject acima de 70 de risco).

**3DS 2.0** obrigatório:

- `authentication.type: 'threed_secure'`.
- Transfere a responsabilidade do chargeback pro emissor.

**Pix** tem fraude menor (saiu do banco do comprador), mas:

- Atenção a Pix de terceiros (comprador X paga, ingresso vai pra Y).
- Mitigação: validar que `holder_cpf` ∈ `order.titulares` ou avisar.

---

## Camada 5 — Monitoramento e resposta

**Dashboards (admin):**

- Taxa de aprovação (24h, 7d).
- Taxa de chargeback.
- Top regras acionadas.
- Pedidos em `review` pendentes.

**Alertas (Discord / e-mail):**

- Chargeback chega → alerta imediato.
- Taxa de aprovação cai abaixo de 70% → alerta.
- Pico de erros 4xx no checkout → alerta.

**Resposta a incidente (playbook):**

1. Identificar padrão (mesmo BIN? mesma origem geo?).
2. Adicionar regra emergencial em `lib/antifraud/rules/` (feature flag pode ativar sem deploy).
3. Cancelar pedidos suspeitos em massa via admin.
4. Comunicar organizadores afetados.
5. Postmortem em 48h.

---

## Anti-scalper (futuro, pós-MVP)

Para shows de alta demanda:

- Fila virtual (`/queue/[event_id]`) com token TTL.
- Captcha visual mais forte na entrada da fila.
- Limite de 2 ingressos por CPF.
- "Ticket nominal não-transferível" como flag do evento (validador exige doc).
- "Revenda oficial" (futuro 2.0): comprador devolve ingresso, sistema revende ao próximo da fila.

---

## Anti-bug (incluso aqui porque bug em checkout é fraude indireta)

- TypeScript strict.
- Validação Zod em tudo.
- E2E Playwright rodando em CI (bloqueia merge se quebrar).
- Smoke tests pós-deploy: bot simula 1 compra em produção a cada 15min, alerta se falhar.
- Sentry com release tracking.
- Feature flags (Vercel Edge Config) pra desligar partes problemáticas sem rollback.
