# 📋 Plano de Projeto — AXON

## Visão

Marketplace de ingressos brasileiro com diferencial em **Pix instantâneo**, **antifraude em camadas** e **PWA de validação offline-first**. Modelo de negócio: taxa de 8–10% sobre o ingresso (paga pelo comprador) + opcional split do organizador.

## Princípios

1. **Output sobre processo** — entregue valor ponta a ponta a cada sprint.
2. **Segurança não é fase final** — RLS, validação e antifraude desde a sprint 1.
3. **Mobile-first** — comprador típico está no celular.
4. **Funciona offline na porta** — porteiro não tem 4G estável.
5. **Bug zero no checkout** — testes E2E rodam em CI.

## Roadmap

### Sprint 0 — Setup (1 semana)

**Objetivo:** repositório pronto, Supabase configurado, design system aplicado, deploy automático no Vercel.

Entregas:

- [ ] Repositório Next.js 15 + TypeScript strict + Tailwind v4 + shadcn/ui
- [ ] Supabase local + remoto provisionados
- [ ] `.env.example` completo
- [ ] CI no GitHub Actions (lint, typecheck, build)
- [ ] Deploy automático Vercel (preview + produção)
- [ ] Design tokens em `tailwind.config.ts`
- [ ] Layout base (header, footer, container)
- [ ] Página `/` com hero + listagem mock de eventos

---

### Sprint 1 — Auth + Eventos (2 semanas)

**Objetivo:** organizador consegue se cadastrar, criar evento, publicar; comprador vê o evento.

Entregas:

- [ ] Schema completo (migrations 001–003 aplicadas)
- [ ] RLS em todas as tabelas
- [ ] Auth com magic link (Supabase Auth)
- [ ] Onboarding do organizador (PJ ou PF, dados bancários, KYC básico)
- [ ] CRUD de evento (cover, descrição rich text, local com mapa)
- [ ] CRUD de tipos de ingresso + lotes
- [ ] Validação automática de meia-entrada (40%)
- [ ] Página pública `/eventos/[slug]` com SEO
- [ ] Listagem `/` com busca e filtros (cidade, categoria, data)

---

### Sprint 2 — Checkout (2 semanas)

**Objetivo:** comprador finaliza compra com Pix ou cartão e recebe ingresso por e-mail.

Entregas:

- [ ] Página de carrinho com timer de 15min
- [ ] Formulário de titulares (nome + CPF obrigatórios para meia)
- [ ] Integração Pagar.me (Pix + cartão tokenizado + 3DS)
- [ ] Webhook idempotente
- [ ] Geração de ingresso com `qr_hash` HMAC
- [ ] PDF do ingresso (lib `@react-pdf/renderer`)
- [ ] E-mail transacional via Resend
- [ ] Polling de status Pix via Supabase Realtime
- [ ] Cron para liberar estoque de pedidos expirados

---

### Sprint 3 — Validação (1 semana)

**Objetivo:** porteiro escaneia QR, sistema valida em <300ms, funciona sem internet.

Entregas:

- [ ] Rota `/scan` (PWA com manifest + service worker)
- [ ] Login de validador (magic link com escopo por evento)
- [ ] Scanner de câmera
- [ ] Edge Function `validate_ticket` (lock pessimista)
- [ ] Modo offline: pré-download dos hashes do evento + fila de sincronização
- [ ] Feedback visual em tela cheia (✅/❌ com cor + som)
- [ ] Painel do organizador: contagem de check-ins ao vivo (Realtime)

---

### Sprint 4 — Financeiro (1 semana)

**Objetivo:** organizador vê saldo, solicita saque, recebe automaticamente.

Entregas:

- [ ] Split de pagamento (taxa fica na AXON, líquido vai pro organizador)
- [ ] Painel de saldo (disponível / a liberar / sacado)
- [ ] Extrato de transações
- [ ] Solicitação de saque (validação de conta bancária)
- [ ] Antecipação de recebíveis (opcional, com taxa)
- [ ] Relatórios CSV (vendas, check-ins, financeiro)

---

### Sprint 5 — Antifraude + Polimento + Deploy (1 semana)

**Objetivo:** sistema blindado, monitorado, em produção.

Entregas:

- [ ] Cloudflare Turnstile no checkout
- [ ] Regras de negócio (máx CPF/IP/lote)
- [ ] FingerprintJS no client + dashboard de fraude no admin
- [ ] Sentry configurado (server + client)
- [ ] Testes E2E Playwright do fluxo completo de checkout
- [ ] Teste de carga k6 (1000 compras simultâneas)
- [ ] Política de privacidade + termos
- [ ] Endpoints LGPD (export/delete)
- [ ] Domínio configurado + SSL + Cloudflare na frente
- [ ] **Evento piloto** rodado (sugerido: campeonato de futsal local)

---

## Métricas de sucesso (3 primeiros meses pós-MVP)

| Métrica                                         | Meta    |
| ----------------------------------------------- | ------- |
| Tempo médio de checkout (entrada → confirmação) | < 90s   |
| Taxa de aprovação de cartão                     | > 80%   |
| Taxa de chargeback                              | < 0,5%  |
| Tempo médio de validação de QR                  | < 300ms |
| Uptime                                          | > 99,5% |
| GMV (Gross Merchandise Value) acumulado         | R$ 100k |
| Organizadores ativos                            | 10      |

---

## Decisões em aberto

- [ ] Confirmar nome definitivo (AXON / Lotação / Embarka / outro)
- [ ] Decidir gateway secundário (Mercado Pago vs Stripe BR vs Asaas)
- [ ] Decidir política de cancelamento padrão (organizador pode customizar?)
- [ ] Decidir se haverá app nativo no futuro ou se PWA basta
