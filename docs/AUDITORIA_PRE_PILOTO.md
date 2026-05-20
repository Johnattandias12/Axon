# Auditoria pré-piloto AXON · 2026-05-20

Revisão 360° executada antes da primeira venda real (teste de MVP em evento).
Cobre segurança, pagamento, e-mail, tema, código morto, modelagem financeira,
compliance, organização de menus e plano de teste em campo.

Quem fez: Claude Code (Opus 4.7) com supervisão de Johnattan.
Branch base: `main` (commit anterior `95fc8b2`).

---

## 1. O que já foi corrigido neste branch

| #   | Categoria | Mudança                                                                                                                                            | Arquivo                                                   |
| --- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Segurança | Headers HTTP: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy                                                   | `next.config.ts`                                          |
| 2   | Pagamento | Webhook Pagar.me rejeita request sem auth em produção (antes ele permitia em dev e prod silenciosamente)                                           | `src/app/api/webhooks/pagarme/route.ts`                   |
| 3   | Pagamento | Timeout de 15s no client da Pagar.me (antes podia travar a função sem limite)                                                                      | `src/lib/payments/pagarme/client.ts`                      |
| 4   | E-mail    | Removido redirect hardcoded de `admin@axon.com.br → francisco.johnattan.103@ufrn.edu.br`. Agora via env `EMAIL_REDIRECT_MAP="from1:to1,from2:to2"` | `src/lib/email/send.ts`                                   |
| 5   | DB        | `organizer_balance` agora subtrai saques pagos/em-processo (antes saldo "fantasma" depois de saque)                                                | `supabase/migrations/018_balance_and_quota_hardening.sql` |
| 6   | DB        | Trigger meia-entrada (Lei 12.933/2013) também roda em INSERT/UPDATE/DELETE de `ticket_lots` em evento já publicado (antes só ao publicar)          | `supabase/migrations/018_balance_and_quota_hardening.sql` |
| 7   | DB        | Índices novos: `orders(event_id,status,paid_at)`, `tickets(event_id,status)`, `check_ins(event_id,created_at)`                                     | `supabase/migrations/018_balance_and_quota_hardening.sql` |
| 8   | Cleanup   | `confirm_order(uuid)` marcada como deprecated via COMMENT (webhook em Node já faz o trabalho com idempotência)                                     | mesma migration                                           |
| 9   | Cleanup   | `test-email.ts` / `test-all-emails.ts` movidos da raiz para `scripts/` (não pertenciam à raiz do projeto)                                          | `scripts/`                                                |
| 10  | Cleanup   | `src/components/organizer/EventAnalyticsCard.tsx` consolidado em `src/components/organizador/` (duas pastas eram débito)                           | mesmo                                                     |
| 11  | Cleanup   | Removido `console.log` de debug em CSV export                                                                                                      | `src/app/api/organizador/eventos/[id]/export/route.ts`    |
| 12  | Lint      | `.claude/worktrees/**`, `scripts/**`, `e2e/**` adicionados ao ignore (antes vinham 21 erros falsos do `.next` do worktree)                         | `eslint.config.mjs`                                       |
| 13  | Tema      | Checkout PIX: removido `bg-gray-800`, `bg-gray-900`, `text-gray-400`, `text-white` por tokens (quebravam no tema claro)                            | `src/app/checkout/[id]/CheckoutClient.tsx`                |
| 14  | Tema      | Aviso PIX usa `--success-soft` / `--warning-soft` (antes `green-500/10` que não respeita o token)                                                  | mesmo                                                     |
| 15  | Lint      | Removido import não usado `Banknote` em precos                                                                                                     | `src/app/(public)/precos/page.tsx`                        |

---

## 2. O que precisa ser feito ANTES da primeira venda

### 2.1 BLOQUEADORES (não vender sem isso resolvido)

1. **Configurar webhook Pagar.me em produção com `PAGARME_WEBHOOK_USER` + `PAGARME_WEBHOOK_PASSWORD`** (ou `PAGARME_WEBHOOK_SECRET`).
   Agora o código rejeita em produção sem auth, então sem isso configurado o webhook devolve 401 e o pedido nunca vira "paid" automaticamente.

2. **`QR_HMAC_SECRET` setado em produção (32+ hex chars)**. Em produção o app _já_ explode se o secret estiver ausente ou curto demais (linha 8 de `hmac.ts`), então rodar `vercel env pull` e validar antes de tudo.

3. **`SUPABASE_SERVICE_ROLE_KEY` separada por ambiente**. Conferir que a key em produção é diferente da de dev. Se for a mesma, qualquer leak local toca produção.

4. **Aplicar migration 018** (`pnpm db:push`) e regenerar types (`pnpm db:types`).

5. **Verificar quota de meia-entrada nos eventos do piloto**. Com o trigger novo, o organizador _não consegue mais_ adicionar lotes que violem 40%. Se você já tem eventos com lotes em proporção errada e tentar editar, vai falhar. Resolver antes.

6. **Política de privacidade publicada com data atualizada** em `/privacidade`. CDC + LGPD exigem versão visível antes do checkout.

7. **Termos de uso explicitando**: cancelamento, reembolso, transferência, taxa de serviço, prazo de repasse. Hoje `/termos` existe — confirmar conteúdo atualizado.

### 2.2 ALTO IMPACTO (resolver em dias)

8. **Split na Pagar.me NÃO está sendo aplicado em `pagarme-actions.ts`**. Hoje TODO o valor cai na conta AXON e você precisa repassar manualmente. Pra split automático: passar `split: [{ recipient_id: ORG_RECIPIENT, amount: subtotal, type: "flat", options: { liable: true, charge_processing_fee: true, charge_remainder_fee: true }}, { recipient_id: PAGARME_RECIPIENT_AXON, amount: fee, type: "flat" }]`. Sem isso, dificuldade fiscal e maior risco de chargeback.

9. **Reconciliação automática de orders pendentes** com Pagar.me. Hoje `expire_pending_orders` cron expira em 15min, mas se Pagar.me confirmar e webhook falhar, o pedido fica preso. Sugestão: adicionar job de reconciliação que chama `GET /orders/:id` na Pagar.me a cada 5min pros pendentes nos últimos 30 minutos.

10. **CSP (Content Security Policy)**. CLAUDE.md diz "CSP estrito sem unsafe-inline em produção". Hoje não há. Sugestão de policy:

    ```
    default-src 'self';
    img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com;
    style-src 'self' 'unsafe-inline';
    script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
    frame-src 'self' https://challenges.cloudflare.com;
    connect-src 'self' https://*.supabase.co https://api.pagar.me https://api.resend.com;
    font-src 'self' data:;
    ```

    Em Next.js 16 com Turbopack vai bater conflito por causa de inline scripts/styles do framework — vale habilitar primeiro em report-only.

11. **Backup do banco**. Supabase já faz backup automático, mas confirme: Dashboard → Database → Backups → daily ativo. Pré-piloto, faça um `pg_dump` manual também.

12. **Sentry NÃO está sendo importado em lugar nenhum** (busca `import * as Sentry` retorna vazio). `NEXT_PUBLIC_SENTRY_DSN` está no .env.example mas não há wrapper em `instrumentation.ts`. Instalar `@sentry/nextjs` e capturar erros em produção é crítico pra piloto.

13. **9 erros de `@typescript-eslint/no-explicit-any` em rotas críticas** (afiliado track, minha-conta/afiliados, organizador/financeiro). Não são bug imediato mas mascaram tipos do Supabase — débito a tipar após regenerar types da migration 018.

### 2.3 MÉDIO IMPACTO (resolver em 1-2 semanas)

14. **Tema claro/escuro tem inconsistências em ~30 arquivos** usando `text-white`, `bg-gray-800`, etc. Os mais importantes (checkout) já foram corrigidos. Os restantes:
    - `src/app/admin/suporte/SupportConsoleClient.tsx` — visual de "console hacker", proposital ser sempre dark; documentar
    - `src/components/event/PremiumTicketCard.tsx` — `text-white` é sobre banner com foto, OK
    - `src/components/cart/CartDrawer.tsx`, `src/app/minha-conta/page.tsx`, `src/app/scan/page.tsx` — auditar e tokenizar
    - Padrão correto: `style={{ color: "var(--ink)" }}` ou via Tailwind v4 `text-ink` (já mapeado em `globals.css`)

15. **Menus: usar `text-ink`/`text-mute` Tailwind v4 em vez de inline styles**. Hoje boa parte do nav usa `style={{color: "var(--mute)"}}` — verboso. Tailwind v4 já tem o token mapeado, dá pra usar `className="text-muted"`.

16. **Hierarquia de navegação por papel** está OK mas pode ser mais simples:
    - **Comprador**: Eventos · Meus ingressos · Carrinho · Conta
    - **Organizador**: Eventos meus · Financeiro · Equipe · Voltar à loja
    - **Validador**: Scanner (página única, sem dashboard)
    - **Admin**: Dashboard · Eventos · Usuários · Organizadores · Suporte · Check-ins · Afiliados

    Hoje o header e o sidebar mostram tudo misturado. Sugestão: dropdown menu com header dinâmico mostrando só o que o papel atual precisa, e botão "trocar contexto" para admins/organizadores. Não foi implementado pra não quebrar UX sem teste com você.

17. **Reembolso automático**. Atualmente `handleChargeRefund` marca order como refunded mas não faz nada com tickets. Tickets refunded continuam ativos no QR scan. Sugestão: trigger SQL que ao mudar order pra `refunded`, atualiza `tickets.status = 'refunded'`.

18. **Wallet credit edge cases**: `buyDemo` debita crédito antes de criar a order. Se a order falha depois, faz rollback. OK. Mas não há lock no debit — duas compras concorrentes podem ambas debitar o mesmo crédito. Adicionar `SELECT ... FOR UPDATE` na função `debit_wallet_credit`.

19. **`reserve_lot(p_lot_id, p_quantity, p_order_id)` — `p_order_id` nunca é usado** dentro da função. Hoje `buy-action.ts` passa um `crypto.randomUUID()` como sentinel. Limpar a assinatura ou usar pra tracking de quem reservou.

20. **Política de cancelamento de evento pelo organizador**. Hoje não há UI clara. Quando organizador clica em "cancelar evento", o que acontece com tickets já vendidos? Deve disparar refund automático em todos.

---

## 3. Engenharia financeira

### 3.1 Estrutura atual

- **Receita AXON** = `8,99%` sobre o subtotal **+ R$ 1,00 por ingresso emitido**.
- **Repasse organizador** = 100% do subtotal (taxa paga pelo comprador, embutida).
- **Saque** = R$ 50 mínimo, R$ 6,50 fixo por saque.
- **Modos de pagamento** = Pix (única opção real hoje), cartão em "em breve".

### 3.2 Custos a deduzir da receita AXON

| Custo                                        | Valor (estimado)                                    | Frequência                  |
| -------------------------------------------- | --------------------------------------------------- | --------------------------- |
| Pagar.me — Pix recebido                      | 0,99% a 1,49% sobre o total (negociável por volume) | Por transação               |
| Pagar.me — Transferência (saque organizador) | R$ 0,50 a R$ 3,50 por TED/Pix                       | Por saque                   |
| Supabase Pro                                 | US$ 25 (~R$ 135)                                    | Mensal                      |
| Vercel Pro                                   | US$ 20 (~R$ 110)                                    | Mensal por seat             |
| Resend (até 50k emails/mês)                  | US$ 20 (~R$ 110)                                    | Mensal (free até 3k/dia)    |
| Cloudflare Turnstile                         | Gratuito                                            | —                           |
| Sentry (até 5k erros/mês)                    | US$ 26 (~R$ 140)                                    | Mensal (free até 5k events) |
| Domínio + SSL                                | ~R$ 60                                              | Anual                       |
| Contabilidade MEI/SimplesNacional            | R$ 250-450                                          | Mensal                      |
| **Custo fixo mensal estimado**               | **~R$ 800-1.000**                                   | —                           |

### 3.3 Ponto de equilíbrio (com Pagar.me a 1,49% Pix)

Ingresso médio R$ 80, fee AXON ~R$ 8,19 (= 7,19 + 1):

- Pagar.me deduz: 80 × 1,49% = R$ 1,19 sobre o total cobrado (R$ 88,19) → ~R$ 1,31
- **Lucro líquido por ingresso AXON** ≈ R$ 8,19 – R$ 1,31 = **R$ 6,88**

Pra cobrir R$ 1.000/mês de custo fixo:

- **~145 ingressos/mês** = ~5/dia (sem contar contabilidade).
- Com 1.000 ingressos/mês: R$ 6.880 receita líquida; descontando R$ 1.000 fixo → **R$ 5.880 lucro/mês**.
- Com 5.000 ingressos/mês: ~R$ 32.000 lucro/mês.

### 3.4 Comparativo de gateways

Pesquisado em 2026-05. Valores podem variar com volume negociado.

| Gateway                  | Pix                                          | Cartão à vista       | Split nativo                                                | Antifraude          | Onboarding                        |
| ------------------------ | -------------------------------------------- | -------------------- | ----------------------------------------------------------- | ------------------- | --------------------------------- |
| **Pagar.me** (atual)     | ~0,99-1,49% (negociável)                     | 3,79-4,99%           | Sim (recipients)                                            | ClearSale incluso   | Médio (CNPJ obrigatório, análise) |
| **Stripe BR**            | 3,99% + R$ 0,50                              | 3,99-4,99% + R$ 0,50 | Não tem split nativo "marketplace" no Brasil — usar Connect | Stripe Radar        | Rápido (sandbox+prod fácil)       |
| **Mercado Pago**         | 0% (PJ <R$15k/mês) a 0,49% (acima)           | 4,98%                | Sim, modelo de marketplace integrado                        | Próprio + adicional | Muito rápido (PF aceita)          |
| **Asaas**                | R$ 1,99 fixo (R$ 0,99 nos 3 primeiros meses) | 2,99% + R$ 0,49      | Sim, com split nativo simples e doc completa                | Próprio + AlloyBank | Rápido, PF/PJ                     |
| **EFI (ex-Gerencianet)** | 0,75% (negociável até 0,40%)                 | 2,99-3,99%           | Sim                                                         | Próprio             | Médio                             |
| **PagSeguro/PagBank**    | 0,69-1,49%                                   | 4,99%                | Sim (limitado)                                              | Próprio             | Médio                             |

**Recomendação ranqueada para AXON**:

1. 🥇 **Asaas** — Pix fixo R$ 1,99 fica muito barato em ingresso de R$ 100+ (≈ 1,99% efetivo). Split robusto, doc clara em português, suporta marketplace. Menor barreira PF→PJ. Migrar daria liberdade contratual e taxa menor pra ingresso médio.

2. 🥈 **Pagar.me** (manter) — Já integrado, ClearSale antifraude embutido. Bom volume médio/alto, mas onboarding pesado. Negociar Pix para 0,99% se demonstrar volume.

3. 🥉 **Mercado Pago** — Pix grátis (até R$15k/mês PJ) é imbatível pra começar. Risco: ecossistema muito MP, lock-in. UX de split mais limitada que Asaas.

4. **EFI/PagBank** — alternativa se quiser margem maior, integração mais "low-level".

**Plano sugerido**:

- Curto prazo (piloto): seguir com Pagar.me já integrada.
- Após o piloto: implementar Asaas como gateway secundário e A/B testar com 10% do tráfego. Se confirmar economia, migrar primário.

### 3.5 Ajustes recomendados de preço

O preço atual está competitivo, mas alguns ajustes melhoram percepção e margem:

- **Manter 8,99% + R$ 1,00 por ingresso** — está alinhado com Sympla (10%) e Eventbrite (8,7% + R$ 0,79).
- **Saque mínimo R$ 50** — pode subir para R$ 100 sem prejuízo (média de saque será maior).
- **Taxa de saque R$ 6,50** — está OK; quando migrar pra Asaas/Pix gratuito reduzir pra R$ 3,50.
- **Cortesias R$ 1,00 cada** — manter. Cobrir custo de emissão.
- **Antecipação de saldo (em breve)** — Sugestão de taxa: **2,99% ao mês** sobre o valor antecipado (ROI excelente, comum no mercado). Implementar pós-piloto.
- **Plano Pro p/ organizadores** — Avaliar pós-piloto: R$ 99/mês fixo com Pix grátis (sem taxa por ingresso) pra eventos grandes (>500 ingressos/mês). Mantém escala.

---

## 4. Compliance — Jurídico + Contábil

### 4.1 CNPJ e regime

- Hoje você é PF (sugerido por `REGULARIZACAO_CNPJ_MEI.md` no desktop). **MEI não comporta marketplace de ingressos** (faturamento limitado R$ 81k/ano + atividade vetada).
- **Recomendação**: abrir **EI ou LTDA Simples Nacional** com CNAE principal `7990-2/00` (serviços de reservas de outras atividades) ou `9329-8/99` (eventos). Limite Simples R$ 4,8M/ano.
- Procurar contador especializado em SaaS / marketplace digital para enquadrar Simples Anexo III (alíquota inicial 6%).

### 4.2 LGPD

- ✅ `audit_logs` table existe (migration 001) — bom pra rastrear acesso a CPF.
- ❌ Endpoints `/api/lgpd/export` e `/api/lgpd/delete` mencionados no CLAUDE.md **NÃO EXISTEM**. Implementar antes de venda real (multa ANPD pesada).
- ❌ Aviso de privacidade do checkout precisa ser visível ANTES do submit (lei). Verificar em `BuyTicketForm`.
- ✅ CPF coletado só pra meia-entrada (Lei 12.933 obriga) — uso compatível.
- 🟡 Cookie banner não vi no projeto. Se você usa Vercel Analytics ou Sentry, precisa de consentimento.

### 4.3 Lei do consumidor

- **Arrependimento 7 dias (CDC art. 49)** se aplica a compra online. Ingressos têm exceção (`art. 49 § único` permite "salvo se o produto for de uso imediato"), mas para **eventos com mais de 7 dias de antecedência**, o reembolso integral é direito. Implementar política clara.
- **Cancelamento de evento pelo organizador** = obrigação de reembolso integral em até 30 dias (Procon-SP). Hoje não há fluxo automatizado.

### 4.4 Meia-entrada (Lei 12.933/2013)

- ✅ Trigger SQL agora valida 40% em INSERT/UPDATE de lotes (com migration 018).
- ✅ `tickets.is_half_price` registrado.
- ❌ Validação de documento na porta ainda é manual (validator confere RG estudante). Verificar UX no scan.
- 🟡 Tipos de meia: estudante, idoso (60+), PCD, jovem baixa renda. Hoje só registra `is_half_price`. Adicionar `half_doc_type` enum se cadastra-se direito a fiscalizar.

### 4.5 Tributação

Para a AXON (intermediadora):

- **Nota fiscal de serviço** para o organizador pela taxa AXON (8,99% + R$1) — emissão própria.
- **ICMS sobre ingresso**: responsabilidade do organizador, não da AXON.
- **PIS/Cofins/IRPJ/CSLL** se Simples Nacional, recolhido por DAS unificado.

---

## 5. Lista de assinaturas e custos (consolidado)

| Serviço                 | Plano         | Custo mensal           | Obrigatório?                        |
| ----------------------- | ------------- | ---------------------- | ----------------------------------- |
| Vercel                  | Pro           | US$ 20 (~R$ 110)       | Sim — preview/prod                  |
| Supabase                | Pro           | US$ 25 (~R$ 135)       | Sim — RLS + DB                      |
| Resend                  | Pro           | US$ 20 (~R$ 110)       | Sim acima de 3k email/dia           |
| Sentry                  | Team          | US$ 26 (~R$ 140)       | Recomendado                         |
| Cloudflare Turnstile    | Free          | R$ 0                   | Já configurado                      |
| Pagar.me                | Por transação | (não fixo)             | Atual gateway                       |
| Asaas                   | Por transação | (não fixo)             | Recomendado avaliar                 |
| Domínio axon.app        | Anual         | ~R$ 60/ano (~R$ 5/mês) | Sim                                 |
| Contador                | Mensal        | R$ 250-450             | Sim, pós-CNPJ                       |
| GitHub (privacidade)    | Pro           | US$ 4 (~R$ 22)         | Opcional (free dá pra repo privado) |
| Claude Code             | Pro/Max       | já paga                | —                                   |
| **Total fixo estimado** |               | **~R$ 1.000/mês**      |                                     |

---

## 6. Plano de teste em evento real (MVP em campo)

### 6.1 Cenários de risco

| Risco                                          | Probabilidade | Impacto                 | Mitigação                                                                   |
| ---------------------------------------------- | ------------- | ----------------------- | --------------------------------------------------------------------------- |
| Rede 4G ruim na porta                          | Alta          | Bloqueia validação      | PWA com cache offline e fila de check-ins; sincroniza ao reconectar         |
| Pix demora a confirmar                         | Média         | Cliente reclama na fila | Tela de "aguardando" com polling a cada 3s + fallback "mostrar comprovante" |
| QR Code quebra (sol direto, screen brightness) | Média         | Não escaneia            | Usar `qrcode` com `errorCorrectionLevel: 'H'` (atual está `default = M`)    |
| Cliente perdeu acesso ao e-mail                | Alta          | Não acessa ingresso     | Login por magic link + acesso por CPF + telefone                            |
| Organizador esqueceu de publicar evento        | Baixa         | Sem vendas              | Checklist de pré-aprovação no painel                                        |
| Pagar.me cair durante venda                    | Baixa         | Bloqueia compra         | Fallback: aceitar reserva sem pagamento, pagar no local (configurável)      |
| Validador rejeita ingresso correto             | Média         | Briga na porta          | Tela mostra erro claro + log no `check_ins` com motivo                      |
| Ingresso transferido sem aviso                 | Média         | Confusão na porta       | E-mail e push pro novo titular (já existe)                                  |
| Browser do validador sem permissão de câmera   | Alta          | Não scaneia             | Tela com instrução clara + botão "entrar com código" como fallback          |
| Dispositivo do validador descarrega            | Alta          | Para a porta            | Treinar com 2+ validadores rotacionando                                     |

### 6.2 Checklist pré-evento (D-7)

- [ ] Migration 018 aplicada em produção
- [ ] `vercel env pull` confirma todas as envs
- [ ] `QR_HMAC_SECRET` setado, mesmo valor em app + `ALTER DATABASE postgres SET app.qr_secret`
- [ ] Webhook Pagar.me cadastrado e testado com `setup-pagarme-webhook.mjs`
- [ ] DNS do `axon.app` apontando pra Vercel
- [ ] Resend domain verificado (SPF + DKIM)
- [ ] Sentry instalado e capturando erros em prod
- [ ] Backup do banco feito antes do evento
- [ ] Organizador convidado, evento publicado, lotes batem com a regra de meia-entrada
- [ ] Validadores convidados via `/organizador/scanners`
- [ ] Política de privacidade e termos de uso revisados pelo advogado
- [ ] Página `/precos` reflete realidade

### 6.3 Checklist pré-evento (D-1)

- [ ] Smoke test: criar order de R$ 1 em sandbox, pagar, validar QR
- [ ] Cron `expire_pending_orders` ativo (pg_cron)
- [ ] PWA de scan instalada em 2+ celulares (Android + iPhone) dos validadores
- [ ] WhatsApp de plantão definido (suporte rápido)
- [ ] Bateria carregada nos dispositivos da porta
- [ ] Roteador 4G de backup na portaria

### 6.4 Durante o evento

- [ ] Validador na porta com QR scanner ativo
- [ ] Monitorar `/admin/check-ins` em tempo real
- [ ] Monitorar Sentry pra erros 5xx
- [ ] Ter contato direto do produtor disponível

### 6.5 Pós-evento (D+1)

- [ ] Exportar CSV de ingressos vendidos via `/api/organizador/eventos/[id]/export`
- [ ] Conferir total recebido na Pagar.me vs total `paid` no nosso banco
- [ ] Solicitar saque do organizador
- [ ] Coletar feedback (já existe `eventFeedbackEmail`)
- [ ] Auditar `audit_logs` por acessos a CPF
- [ ] Documentar bugs e gaps identificados

---

## 7. Reorganização de menus (proposta, não aplicada)

Hoje há sobreposição entre dropdown de perfil, sidebar do admin e sidebar do organizador. Proposta:

**Header (sempre):** Logo · Eventos · Preços · [Ações por papel]

**Comprador autenticado:** Carrinho (ícone) · Avatar dropdown com [Minha conta, Meus ingressos, Segurança, Sair]

**Organizador:** mesma base + botão "Painel" no header + sidebar interna do `/organizador` com [Início, Eventos, Financeiro, Equipe, Configurações]

**Admin:** mesma base + botão "Admin" destacado (vermelho atual ok) + sidebar interna do `/admin` com [Dashboard, Eventos, Organizadores, Usuários, Check-ins, Suporte, Afiliados, Sistema]

**Validador:** UI minimalista. Só `/scan` em fullscreen. Sem header padrão (overlay com info do evento).

**Princípio:** Cada papel vê só o que precisa. "Trocar contexto" só pra admin/organizador via avatar dropdown.

---

## 8. Próximos passos sugeridos (ordem de impacto)

1. **Hoje**: revisar este doc, validar fixes neste branch.
2. **Esta semana**: aplicar migration 018 em prod, configurar Sentry, criar endpoints LGPD.
3. **Próximos 7 dias**: implementar split na Pagar.me, fluxo de cancelamento de evento, política refund.
4. **Antes do piloto**: rodar checklist completo da seção 6.
5. **Pós-piloto**: avaliar migração Asaas (A/B test 10%), antecipação de saldo, plano Pro pra organizador grande.

---

## 9. O que NÃO foi implementado (por exigir decisão sua)

- Migração para Asaas — exige tu decidir e abrir conta PJ
- Refactor completo de menus — exige sua aprovação visual antes
- CSP estrito — exige teste com seus assets reais (Stripe, GA, etc.)
- Plano Pro p/ organizador — decisão de pricing
- Endpoints LGPD `/api/lgpd/export|delete` — decidir formato (JSON, CSV, PDF)

Tudo isto está documentado neste relatório e pode ser implementado em sprint dedicado.
