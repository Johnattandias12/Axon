# Roteiro do Primeiro Evento AXON

Documento de referência única consolidando tudo que precisa estar pronto
até a primeira venda real, com responsável e prazo. Complementa
`docs/AUDITORIA_PRE_PILOTO.md` (análise técnica) e foca em decisões
financeiras, jurídicas, contábeis e operacionais.

Última atualização: 2026-05-20

---

## 0. Status atual em uma frase

Pagar.me está cadastrado em sandbox, webhook autenticado configurado, banco
de dados com migrations de hardening aplicadas, endpoints LGPD no ar.
Falta: completar KYC do organizador, copiar secret final do webhook Pagar.me,
abrir CNPJ, contratar contador e revisar páginas legais com advogado.

---

## 1. Resumo financeiro

### 1.1 Receita por ingresso vendido

```
Taxa AXON = 8,99% sobre o preço definido pelo organizador  +  R$ 1,00 por ingresso emitido
```

Exemplo prático em um ingresso de R$ 100:

- Subtotal pro organizador: R$ 100,00
- Taxa serviço AXON (8,99% paga pelo comprador): R$ 8,99
- Taxa emissão AXON (R$ 1,00 paga pelo comprador): R$ 1,00
- Total cobrado no Pix: **R$ 109,99**
- **Receita bruta AXON por ingresso: R$ 9,99**

### 1.2 Custos diretos por venda (cenário Pagar.me atual a 1,49% Pix)

| Item                                            | Valor (ingresso de R$ 100) |
| ----------------------------------------------- | -------------------------- |
| Receita bruta AXON                              | R$ 9,99                    |
| Custo Pagar.me Pix (1,49% × R$ 109,99)          | – R$ 1,64                  |
| Antifraude Pagar.me (ClearSale incluso na taxa) | R$ 0                       |
| Resend e-mail (~US$ 0,0004/email × 2 emails)    | – R$ 0,004                 |
| Sentry erro (proporcional)                      | – R$ 0,01                  |
| Supabase/Vercel runtime (proporcional)          | – R$ 0,01                  |
| **Receita líquida por ingresso AXON**           | **R$ 8,33**                |

### 1.3 Custos fixos mensais

| Serviço                            | Plano                        | Custo BRL          |
| ---------------------------------- | ---------------------------- | ------------------ |
| Vercel Pro                         | obrigatório (preview + prod) | ~R$ 110            |
| Supabase Pro                       | obrigatório (RLS + storage)  | ~R$ 135            |
| Resend Pro                         | acima de 3k email/dia        | ~R$ 110            |
| Sentry Team                        | recomendado                  | ~R$ 140            |
| Cloudflare Turnstile               | Free                         | R$ 0               |
| Domínio + SSL (Vercel)             | anual diluído                | ~R$ 5              |
| Contador (Simples Nacional)        | mensal                       | R$ 250 – 450       |
| Backup banco extra (Postgres)      | opcional via Supabase        | R$ 0 (incluso Pro) |
| GitHub Pro (repo privado opcional) | dispensável                  | R$ 0 ou ~R$ 22     |
| **Total estimado**                 |                              | **~R$ 950/mês**    |

### 1.4 Ponto de equilíbrio

- Receita líquida média / ingresso: **R$ 8,33**
- Custo fixo mensal: **R$ 950**
- **Break-even: ~115 ingressos/mês** = ~4/dia
- A 500 ingressos/mês: R$ 4.165 – R$ 950 = **R$ 3.215 lucro**
- A 1.000 ingressos/mês: **R$ 7.380 lucro**
- A 5.000 ingressos/mês: **R$ 40.700 lucro**

### 1.5 Comparativo de gateways (taxa Pix)

| Gateway          | Pix               | Taxa equivalente em R$ 100 | Split nativo |
| ---------------- | ----------------- | -------------------------- | ------------ |
| Pagar.me (atual) | ~0,99-1,49%       | R$ 0,99 – 1,49             | Sim, robusto |
| Mercado Pago     | 0% até R$ 15k/mês | R$ 0                       | Sim          |
| Asaas            | R$ 1,99 fixo      | R$ 1,99 (1,99% efetivo)    | Sim          |
| EFI/Gerencianet  | 0,40-0,75%        | R$ 0,40 – 0,75             | Sim          |
| Stripe BR        | 3,99% + R$ 0,50   | R$ 4,49                    | Não nativo   |

**Decisão sugerida**: ficar com Pagar.me pro piloto (já integrado) e
implementar Asaas como gateway secundário pós-piloto pra A/B test.
A Mercado Pago só vale se você tiver volume baixo (PJ a R$ 0 só até
R$ 15k/mês) — e o ecossistema é restritivo.

### 1.6 Ajustes recomendados de preço

- Manter 8,99% + R$ 1,00 — está alinhado com Sympla (10%) e Eventbrite
- Aumentar saque mínimo de R$ 50 → R$ 100 (sem prejuízo na percepção)
- Manter taxa de saque R$ 6,50 (ajustar pra R$ 3,50 quando migrar pra Asaas)
- Cortesias R$ 1,00 por ingresso — manter
- **Roadmap pós-piloto**:
  - Antecipação de saldo a 2,99%/mês (mercado padrão)
  - Plano "Pro Organizer" a R$ 99/mês com Pix grátis (para >500 ingressos/mês)

---

## 2. Resumo jurídico

### 2.1 Pendências críticas antes da primeira venda

1. **Abrir CNPJ** — MEI não comporta (limite R$ 81k/ano + CNAE vedado).
   Recomendado: **Empresário Individual (EI)** ou **LTDA Unipessoal** no
   regime **Simples Nacional, Anexo III**. CNAE principal sugerido:
   - 7990-2/00 (serviços de reservas e outros serviços de turismo)
   - ou 6311-9/00 (tratamento de dados, provedores de aplicações)
     Procurar contador antes de definir.

2. **Termos de uso** revisar:
   - Política de cancelamento por parte do comprador (CDC art. 49 — 7 dias)
   - Política de cancelamento por parte do organizador (reembolso 30 dias)
   - Política de transferência (não pode ser comercializada — venda no terceiro mercado)
   - Cláusula de meia-entrada (Lei 12.933/2013, 40% mínimo)
   - Foro de eleição e legislação aplicável
   - Limitação de responsabilidade da AXON (intermediadora, não promotora)

3. **Política de privacidade** revisar e datar:
   - Encarregado de dados (DPO) — hoje aponta pra `privacidade@axonia.com.br`
   - Bases legais de tratamento (LGPD art. 7)
   - Endpoints `/api/lgpd/export` e `/api/lgpd/delete` agora existem (commit `2e7487a`)
   - Tempo de retenção: fiscal 5 anos, marketing 2 anos, log de acesso 6 meses

4. **Contrato com organizador** padrão deve incluir:
   - Repasse D+2 (Pix) e D+17 (Cartão)
   - Responsabilidade do organizador por NFe e ICMS
   - Solidariedade legal pelo evento (Procon vai sempre cair na AXON também)
   - Cláusula de chargeback (organizador devolve em caso de fraude)
   - KYC obrigatório antes da publicação do primeiro evento

5. **Cookie banner** com consentimento — não vi implementado. Vercel Analytics
   exige consentimento; Sentry captura IP e user agent.

### 2.2 Riscos e mitigações

| Risco                                 | Quem responde        | Mitigação                                                                              |
| ------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| Comprador pede reembolso CDC 7 dias   | AXON solidariamente  | Botão de reembolso em até 7 dias antes do evento                                       |
| Organizador some com dinheiro         | AXON na cara         | Split nativo na Pagar.me + KYC obrigatório                                             |
| Evento cancelado, comprador no Procon | AXON e organizador   | Refund automático no contrato + status "canceled" propaga pros tickets (migration 019) |
| Vazamento de CPF                      | AXON                 | RLS, HTTPS, audit_logs, criptografia em rest do Postgres                               |
| Fraude com cartão                     | AXON sem Antifraude  | Pagar.me + ClearSale + Turnstile + limit de quantidade no checkout                     |
| Pirataria de QR Code                  | Comprador / falsário | HMAC server-side + "used_at" único + foto do titular opcional                          |

---

## 3. Resumo contábil

### 3.1 Regime sugerido

**Simples Nacional Anexo III** (CNAE 7990-2/00 ou 6311-9/00):

- Faturamento até R$ 4,8M/ano
- Alíquota inicial 6% (até R$ 180k/ano)
- Sem ICMS na operação AXON (intermediadora)
- DAS unificado, declaração simples mensal

### 3.2 Documentos a emitir

| Quem emite  | Quando       | Para quem       | Documento                             |
| ----------- | ------------ | --------------- | ------------------------------------- |
| AXON        | A cada venda | Organizador     | NFS-e da taxa AXON (8,99% + R$ 1)     |
| Organizador | A cada venda | Comprador       | NF-e do ingresso (ICMS dele)          |
| AXON        | A cada saque | Sistema interno | Comprovante de transferência bancária |
| AXON        | Mensal       | Contador        | Relatório de vendas + receita líquida |

A AXON **NÃO emite** NF do ingresso. A AXON emite NFS-e **apenas da
sua taxa**. O organizador é responsável pela NF do produto/serviço
"ingresso para evento".

### 3.3 Contador — o que pedir

1. Abertura de CNPJ EI ou LTDA
2. Enquadramento no Simples Nacional Anexo III
3. Inscrição municipal pra emitir NFS-e em Natal/RN
4. Sistema de NF-e integrado (preferência: focusnfe.com.br via API)
5. DAS mensal automatizado
6. Declaração trimestral SPED (se obrigatória)
7. **Conta PJ separada** (Inter, Sicoob, Stark Bank) — não misturar com PF

Custo estimado: **R$ 250-450/mês**. Procurar contador com cliente em
SaaS / marketplace digital (perguntar: "você atende cliente Stripe-like
no Brasil?").

### 3.4 Conta bancária e Pagar.me recipient

1. Abrir conta PJ
2. Solicitar recipient Pagar.me com CNPJ da AXON
3. Atualizar `PAGARME_RECIPIENT_AXON` na Vercel
4. Para cada organizador: ele tem que solicitar próprio recipient na Pagar.me
   (ou seguir sem split = repasse manual)

---

## 4. Resumo técnico (o que está pronto)

### 4.1 Infraestrutura

| Componente           | Status             | Observação                                             |
| -------------------- | ------------------ | ------------------------------------------------------ |
| Vercel               | ✅ Configurado     | projeto `axon` deployando automático no push em `main` |
| Supabase             | ✅ Configurado     | RLS ativo, 19 migrations aplicadas em prod             |
| Pagar.me             | 🟡 Sandbox         | precisa copiar secret final do webhook (painel)        |
| Resend               | ✅ Configurado     | API_KEY, FROM, REPLY_TO setados                        |
| Cloudflare Turnstile | ❌ Não configurado | precisa criar site no Cloudflare e setar 2 envs        |
| Sentry               | ❌ Não instalado   | docs/AUDITORIA_PRE_PILOTO.md seção 2.2 #12             |
| Domínio próprio      | ❌ Não conectado   | hoje em axonia.vercel.app                              |

### 4.2 Envs configuradas na Vercel (após esta sessão)

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SUPABASE_PROJECT_REF
✅ NEXT_PUBLIC_APP_URL
✅ NEXT_PUBLIC_APP_NAME
✅ QR_HMAC_SECRET
✅ ADMIN_EMAILS
✅ RESEND_API_KEY
✅ RESEND_FROM_EMAIL
✅ RESEND_REPLY_TO
✅ PAGARME_API_KEY (sandbox)
✅ NEXT_PUBLIC_PAGARME_PUBLIC_KEY
✅ PAGARME_RECIPIENT_AXON (precisa atualizar pro CNPJ real depois)
✅ NEXT_PUBLIC_PAGARME_ENV=sandbox  ← mudar pra "live" quando passar pra prod
✅ PAGARME_WEBHOOK_USER (gerado agora)
✅ PAGARME_WEBHOOK_PASSWORD (gerado agora)
🟡 PAGARME_WEBHOOK_SECRET (stub gerado, precisa substituir pelo do painel)
✅ SUPPORT_EMAIL
✅ EMAIL_REDIRECT_MAP (só em preview e dev)
❌ NEXT_PUBLIC_TURNSTILE_SITE_KEY
❌ TURNSTILE_SECRET_KEY
❌ NEXT_PUBLIC_SENTRY_DSN
❌ SENTRY_AUTH_TOKEN
```

### 4.3 Banco de dados — migrations aplicadas em produção

```
001 initial_schema           ✅ aplicada
002 rls_policies             ✅ aplicada
003 functions                ✅ aplicada
004 seed                     ✅ aplicada
005 cart_and_avatar          ✅ aplicada
006 event_banners            ✅ aplicada
007 ticket_transfer_refund   ✅ aplicada
008 affiliates               ✅ aplicada
009 affiliates_invite_credit ✅ aplicada
010 add_birth_date           ✅ aplicada
010 payment_methods          ✅ aplicada (conflito de numeração — débito)
011 sync_profile_emails      ✅ aplicada
012 affiliate_clicks         ✅ aplicada
013 email_logs               ✅ aplicada
014 qr_secret_setup          ✅ aplicada
015 event_scanners           ✅ aplicada
016 wallet_apply             ✅ aplicada
017 system_settings          ✅ aplicada
018 balance_and_quota_hardening   ✅ aplicada AGORA
019 auto_refund_tickets           ✅ aplicada AGORA
```

### 4.4 Endpoints relevantes

```
✅ /api/webhooks/pagarme          (Basic Auth + HMAC fallback)
✅ /api/cart                      (CRUD carrinho)
✅ /api/checkout/[id]/status      (polling Pix)
✅ /api/auth/callback             (Supabase auth)
✅ /api/auth/logout               (signOut)
✅ /api/auth/magic-link           (Resend magic link)
✅ /api/auth/reset-password
✅ /api/auth/login-notification   (e-mail de novo login)
✅ /api/organizador/convidar-validador
✅ /api/organizador/eventos/[id]/export  (CSV)
✅ /api/affiliate/track            (atribui click do convite)
✅ /api/admin/ai-support           (diagnostic)
✅ /api/admin/seed
✅ /api/admin/setup
✅ /api/cron                       (cron Vercel chama expire_pending_orders)
✅ /api/lgpd/export                ← NOVO neste commit
✅ /api/lgpd/delete                ← NOVO neste commit
```

---

## 5. Checklist final — o que VOCÊ precisa fazer

### 5.1 Esta semana

- [ ] **Abrir CNPJ** EI ou LTDA. Procurar contador Natal/RN com cliente SaaS.
- [ ] **Contratar contador** mensal R$ 250-450 c/ NF-e integrada
- [ ] **Conta bancária PJ** (Inter PJ, Stark, Sicoob)
- [ ] **Painel Pagar.me sandbox** → encontrar webhook `hook_wj27aAYcE9FP7Qan` →
      copiar Secret → rodar:
      `     node ~/AppData/Local/Temp/axon-env-uploader.mjs PAGARME_WEBHOOK_SECRET "<valor>" production,preview,development
    `
- [ ] **Cloudflare Turnstile**: criar site em https://dash.cloudflare.com/?to=/:account/turnstile
      e configurar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` na Vercel
- [ ] **Sentry**: criar projeto em sentry.io, rodar `npx @sentry/wizard@latest -i nextjs`
- [ ] **Advogado**: revisar `/termos`, `/privacidade`, `/reembolso` antes de vender
- [ ] **Conferir páginas legais publicadas** com data atualizada

### 5.2 Antes do primeiro evento (D-7)

- [ ] Mudar `NEXT_PUBLIC_PAGARME_ENV` para `live` na Vercel
- [ ] Atualizar `PAGARME_API_KEY` para chave `sk_live_*` (não sandbox)
- [ ] Atualizar `NEXT_PUBLIC_PAGARME_PUBLIC_KEY` para `pk_live_*`
- [ ] Atualizar `PAGARME_RECIPIENT_AXON` com recipient real (CNPJ aprovado pela Pagar.me)
- [ ] Re-cadastrar webhook em prod com a chave live (rodar `node scripts/setup-pagarme-webhook.mjs` com env real)
- [ ] Solicitar recipient na Pagar.me pra o organizador piloto, atualizar `organizers.pagarme_recipient_id`
- [ ] Aprovar `organizers.kyc_status = 'approved'` no banco
- [ ] Domínio próprio: comprar `axon.app` ou similar, conectar no Vercel
- [ ] Treinar validadores em PWA `/scan`
- [ ] Backup `pg_dump` manual antes do evento
- [ ] Smoke test E2E: criar order R$ 1, pagar Pix, validar QR

### 5.3 Pós-evento

- [ ] Conciliar Pagar.me dashboard vs orders.status='paid'
- [ ] Solicitar saque do organizador (via painel `/organizador/financeiro`)
- [ ] Coletar feedback NPS (já automatizado via `eventFeedbackEmail`)
- [ ] Documentar bugs e gaps em `docs/RETROSPECTIVA_PILOTO.md`
- [ ] Avaliar migração pra Asaas (taxa Pix fixa R$ 1,99 vs Pagar.me 1,49%)

---

## 6. O que NÃO foi implementado (decisão sua)

1. **Sentry**: precisa criar projeto, gerar DSN e auth token. Comando para instalar:
   `npx @sentry/wizard@latest -i nextjs`. Manualmente porque exige login interativo.

2. **CSP rigoroso**: skill `vercel:routing-middleware` cobre. Recomendado fazer em
   report-only primeiro pra não quebrar nada com Turbopack.

3. **Domínio próprio (axon.app)**: você precisa comprar e conectar via Vercel CLI ou painel.

4. **Cookie banner LGPD**: precisa um componente client + provider de consentimento.
   Sugestão: usar `@radix-ui/react-toast` ou `vaul` (já no projeto).

5. **Refactor de menus por papel**: documentado em AUDITORIA_PRE_PILOTO seção 7,
   mas exige sua aprovação visual.

6. **Plano "Pro Organizer"**: decisão de pricing — Pix grátis a R$ 99/mês.

7. **Antecipação de saldo**: feature pós-piloto, gera receita extra 2,99%/mês.

---

## 7. Links rápidos

- Repo: https://github.com/Johnattandias12/Axon
- Vercel deploy atual: https://axonia.vercel.app
- Webhook Pagar.me sandbox cadastrado: `hook_wj27aAYcE9FP7Qan`
- Análise técnica completa: `docs/AUDITORIA_PRE_PILOTO.md`
- Scripts de migration: `scripts/apply-*.mjs`
- Env uploader Vercel: `~/AppData/Local/Temp/axon-env-uploader.mjs`

Tudo no commit `2e7487a` em diante.
