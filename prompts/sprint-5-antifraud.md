# 🛡️ Sprint 5 — Antifraude, Polimento e Deploy

> Pré-requisito: Sprint 4 fechada.

## Contexto obrigatório

- `CLAUDE.md`
- `docs/06-antifraud.md` ← **leitura prioritária**
- `docs/07-legal-compliance.md` (LGPD)
- `docs/09-environment-setup.md` (deploy)

## Objetivo

Sistema **blindado**, **monitorado** e em **produção**. Evento piloto rodando.

## Entregas

### 1. Antifraude — todas as camadas

#### Camada 1 — Edge

- Configurar Cloudflare na frente do Vercel (DNS apontando).
- Regras WAF Managed (OWASP).
- Rate limit em `/api/orders/*` (10/min por IP).
- Bot Fight Mode ON.

#### Camada 2 — Regras de negócio (completar)

Em `src/lib/antifraud/rules/`, criar/finalizar:

| Arquivo                    | Regra                                        |
| -------------------------- | -------------------------------------------- |
| `max_qty_per_event.ts`     | (Sprint 2)                                   |
| `max_qty_per_lot.ts`       | >10 ingressos do mesmo lote                  |
| `velocity_ip.ts`           | (Sprint 2)                                   |
| `velocity_card.ts`         | mesmo cartão >3 CPFs em 24h                  |
| `disposable_email.ts`      | (Sprint 2)                                   |
| `blacklist_cpf.ts`         | CPF marcado em fraud_flags com deny aprovado |
| `blacklist_ip.ts`          | idem                                         |
| `cpf_invalid.ts`           | (Sprint 2)                                   |
| `mismatch_holder_buyer.ts` | holder_cpf não bate com buyer em >2 tickets  |
| `vpn_datacenter_ip.ts`     | IP de datacenter (lista pública de ASNs)     |

Orquestrador `evaluateOrder(input, ctx)` chama todas e agrega.

#### Camada 3 — Device fingerprint

- Integrar **FingerprintJS** (free tier).
  - Component `<FingerprintProvider />` no layout do checkout.
  - Captura `visitorId` + score + sinais (incognito, bot, tor).
  - Persiste em `orders.fingerprint_id` + `metadata.fingerprint`.

- Sinais comportamentais:
  - Tempo no checkout (< 10s = suspeito).
  - Contagem de mouse moves / touches.
  - Erros de form (bot acerta tudo de primeira).

#### Camada 4 — Gateway

- Garantir `antifraud_enabled: true` em todas as charges de cartão.
- Configurar cutoff de risco no painel Pagar.me (auto-reject > 70).

#### Camada 5 — Monitoramento

- Dashboard em `/admin/antifraude`:
  - KPI cards: taxa de aprovação 24h, chargebacks 30d, pedidos em review.
  - Tabela de regras mais acionadas.
  - Lista de pedidos em `review` pendentes com ação aprovar/negar.
- Alertas:
  - Sentry breadcrumb para cada deny.
  - Webhook Discord/Slack ao receber chargeback.
  - Alerta se taxa de aprovação < 70% em 1h.

### 2. Cloudflare Turnstile

Já parcialmente na Sprint 2. Finalizar:

- Em `/(auth)/entrar`.
- Em `/checkout/[id]` etapa 3.
- Em form de contato.
- Sempre validar server-side com `TURNSTILE_SECRET_KEY` antes de processar.

### 3. Sentry

- Instalar `@sentry/nextjs` + configurar wizard (`pnpm dlx @sentry/wizard@latest -i nextjs`).
- Server + client + edge.
- Source maps upload no CI.
- Release tracking por commit SHA.
- Captura de erros não tratados, breadcrumbs de fluxo crítico (checkout, validação).

### 4. Testes E2E completos

Em `e2e/`, cobrir os fluxos críticos completos:

- `signup-and-buy.spec.ts` — comprador novo → compra Pix → recebe ingresso.
- `organizer-create-event.spec.ts` — onboarding → criar evento → publicar.
- `validation-flow.spec.ts` — comprar → validar QR.
- `refund-flow.spec.ts` — comprar → solicitar reembolso → aprovar.
- `antifraud.spec.ts` — tentar comprar 5 ingressos do mesmo CPF → bloqueado.

Roda no CI a cada PR.

### 5. Teste de carga

Em `loadtest/`:

- Script **k6** simulando:
  - 1000 usuários simultâneos abrindo página do evento.
  - 200 compras simultâneas em 10 segundos.
- Cenários: estoque baixo (corrida pelo último ingresso), webhook em massa.
- Métricas: p95 < 1s, taxa de erro < 0.5%, sem ingresso duplicado.

Rodar antes do evento piloto. Aprender bottlenecks e otimizar índices/queries.

### 6. Política de privacidade + Termos

- `/privacidade` — markdown renderizado.
- `/termos` — idem.
- `/termos-organizador` — idem.
- Banner de cookies (opt-in granular).

Conteúdo: usar template Filgueira V9 (skill `skill-juridico-filgueira`).

### 7. Endpoints LGPD

#### `/api/lgpd/export` (POST)

- Auth required.
- Job gera ZIP com:
  - `profile.json`
  - `orders.json` (próprios)
  - `tickets.json` (próprios)
  - `audit_logs.json` (filtrado pelo actor)
- Envia link por e-mail (Storage com TTL de 24h).

#### `/api/lgpd/delete` (POST)

- Auth required + double-opt-in (link no e-mail).
- Anonimiza dados pessoais em `profiles`, `orders`, `tickets`:
  - `full_name → 'Titular anonimizado'`
  - `cpf → hash`
  - `email → null`
- Mantém registros para fiscal.
- Audit log.

#### `/api/lgpd/rectify` (POST)

- Atualiza dado específico.

### 8. SEO + performance

- Lighthouse score >= 90 em mobile.
- Otimizar imagens (next/image + AVIF).
- Lazy load de mapas, players, recharts.
- Headers: HSTS, X-Content-Type-Options, X-Frame-Options DENY.
- Open Graph e Twitter Cards.
- Sitemap.xml e robots.txt.
- Schema.org/Event nas páginas de evento.

### 9. Deploy produção

- Domínio `axon.com.br` (ou definitivo) apontando para Vercel via Cloudflare.
- SSL ativo.
- Variáveis de ambiente de produção no Vercel.
- Supabase Cloud em projeto de produção separado do de desenvolvimento.
- Pagar.me em chave **production** (após KYC aprovado).
- Resend domínio verificado.
- Backup diário ativo.
- Health check `/api/health` retornando 200 + versão.

### 10. Documentação final

- `OPERATIONS.md` — runbook de incidentes.
- `LAUNCH_CHECKLIST.md` — checklist de pré-evento.
- README atualizado com badges (CI, Vercel, Sentry).

### 11. Evento piloto

Rodar com **um evento real**, baixo risco:

- Sugestão: campeonato de futsal social no interior do RN (rede do owner).
- 50–200 ingressos.
- Acompanhar in loco: validador na porta, monitoramento em tempo real.
- Pós-evento: postmortem documentado.

## Definition of Done

- [ ] Todas as regras antifraude rodando
- [ ] Turnstile + Sentry + FingerprintJS ativos
- [ ] Dashboard de antifraude funcional
- [ ] LGPD: export, delete, rectify endpoints
- [ ] Política de privacidade + termos publicados
- [ ] Lighthouse >= 90 mobile
- [ ] Domínio em produção com SSL
- [ ] Pagar.me em modo production
- [ ] Backups ativos
- [ ] Teste de carga k6 com p95 < 1s e 0 ingresso duplicado
- [ ] **Evento piloto rodado com sucesso**

## Pós-MVP (futuras sprints sugeridas)

- Sprint 6: Anti-scalper (fila virtual, ticket nominal não-transferível, revenda oficial)
- Sprint 7: White-label (subdomínios por organizador)
- Sprint 8: App nativo (React Native ou Capacitor)
- Sprint 9: Programa de afiliados / cupons
- Sprint 10: Multi-idioma (en/es)
