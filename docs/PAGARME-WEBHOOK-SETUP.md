# Configurar o webhook do Pagar.me (60 segundos)

> A API v5 da Pagar.me NÃO expõe criação de webhook — só pelo dashboard web.
> Isso é uma vez só. Depois disso, PIX começa a funcionar end-to-end.

## Passo 1 — Login no dashboard

Abra: <https://dashboard.pagar.me/>

Entre com o e-mail que recebeu a confirmação de aprovação do cadastro.

## Passo 2 — Garantir que está em SANDBOX

Canto superior direito, ao lado do nome da sua loja, tem um toggle
**Live / Sandbox** (alguns layouts: ícone de tartaruga vs foguete).

**Deixe em SANDBOX**. Nada cobra dinheiro real assim.

## Passo 3 — Ir em Webhooks

No menu lateral esquerdo:

```
Configurações → Webhooks
```

(em alguns painéis está em: **Desenvolvedores → Webhooks** ou
**Apps → Webhooks**)

## Passo 4 — Criar webhook novo

Clique no botão **+ Novo Webhook** (ou **Adicionar URL**).

Preencha:

| Campo      | Valor                                            |
| ---------- | ------------------------------------------------ |
| **Nome**   | `AXON main`                                      |
| **URL**    | `https://axonia.vercel.app/api/webhooks/pagarme` |
| **Status** | Ativo                                            |
| **Versão** | v5 (se perguntar)                                |

### Eventos a marcar (essenciais):

- [x] `order.paid`
- [x] `order.payment_failed`
- [x] `order.canceled`
- [x] `order.expired`
- [x] `charge.paid`
- [x] `charge.refunded`
- [x] `charge.chargedback`

(pode marcar mais se quiser, mas esses 7 são os que a AXON processa)

Clique em **Salvar** / **Criar**.

## Passo 5 — Copiar o Token / Secret

Depois de salvar, a Pagar.me **mostra UMA VEZ** uma chave longa, tipo:

```
whsec_abc123def456...
```

**COPIE ESSE VALOR INTEIRO**. Se você fechar a tela sem copiar, terá que
deletar o webhook e criar de novo.

## Passo 6 — Colar no `.env.local`

Abra `~/Desktop/AXON/AXON/.env.local` e atualize a linha:

```env
PAGARME_WEBHOOK_SECRET="whsec_abc123def456..."
```

(o valor que você copiou no passo 5)

## Passo 7 — Colar também no Vercel

```bash
# No terminal, dentro do projeto:
vercel env add PAGARME_WEBHOOK_SECRET production
# (cole o valor quando pedir)

vercel env add PAGARME_WEBHOOK_SECRET preview
# (cole o mesmo valor)
```

OU manualmente em <https://vercel.com/dashboard> → Projeto AXON →
Settings → Environment Variables → Add →
`PAGARME_WEBHOOK_SECRET` = (valor).

## Passo 8 — Redeploy

```bash
git commit --allow-empty -m "chore: trigger redeploy pra novo PAGARME_WEBHOOK_SECRET"
git push
```

Ou clicar em **Redeploy** no painel da Vercel.

## Passo 9 — Testar PIX em sandbox

Em <https://dashboard.pagar.me/sandbox> existe um **"Simular pagamento"**
em cada pedido pending. Clicar nele dispara o webhook `order.paid` →
nosso `/api/webhooks/pagarme` → confirma a order → gera tickets com QR →
manda email de confirmação.

Você consegue rastrear:

- Lista de webhooks tentados: dashboard Pagar.me → Webhooks → Histórico
- Logs do nosso webhook: `vercel logs https://axonia.vercel.app` ou
  Sentry
- Pedido confirmado: tabela `orders` no Supabase
- Tickets gerados: tabela `tickets`

## Troubleshooting

**Webhook 401 invalid signature** → secret no .env.local diferente do
painel Pagar.me. Confere se copiou o valor inteiro.

**Webhook 500** → vai no Sentry / `vercel logs` ver o stack trace.
Normalmente é problema de dados (CPF inválido, evento sem starts_at, etc).

**Webhook nunca chega** → URL do webhook errada no painel. Confere se
está exatamente `https://axonia.vercel.app/api/webhooks/pagarme`.

**Tudo funcionou em sandbox e quer ir pra produção**:

1. Pegar `sk_live_*` e `pk_live_*` no painel (modo Live)
2. Atualizar `.env.local` e Vercel: PAGARME_API_KEY, NEXT_PUBLIC_PAGARME_PUBLIC_KEY, NEXT_PUBLIC_PAGARME_ENV=production
3. Criar novo webhook no modo **Live** apontando pra mesma URL — vai gerar OUTRO secret
4. Atualizar PAGARME_WEBHOOK_SECRET com o novo
5. Redeploy
