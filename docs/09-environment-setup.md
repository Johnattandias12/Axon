# 09 — Setup de Ambiente

## Pré-requisitos

- **Node.js** 20+ LTS
- **pnpm** 9+
- **Docker** (pro Supabase local)
- **Supabase CLI** (`npm i -g supabase`)
- **Conta no Pagar.me** (sandbox primeiro)
- **Conta no Vercel**
- **Conta no Resend**
- **Conta no Cloudflare** (Turnstile + WAF)
- **Conta no Sentry**

## Variáveis de ambiente

`.env.local` (NÃO commitar — `.env.example` é o template).

```bash
# ─── Supabase ────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."                  # SECRET! só server
SUPABASE_JWT_SECRET="..."                        # para validar webhook signatures

# ─── App ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="AXON"
NODE_ENV="development"

# ─── QR Secret (HMAC) ────────────────────────────────
# Gere com: openssl rand -hex 32
QR_HMAC_SECRET="..."                             # SECRET! NUNCA expor

# ─── Pagar.me ────────────────────────────────────────
PAGARME_API_KEY="ak_test_..."                    # SECRET
PAGARME_PUBLIC_KEY="pk_test_..."                 # client-side OK (tokenização)
PAGARME_WEBHOOK_SECRET="..."                     # SECRET
PAGARME_RECIPIENT_AXON="rp_..."                 # recipient da AXON (recebedor principal)
NEXT_PUBLIC_PAGARME_ENV="sandbox"                # sandbox | production

# ─── Resend (e-mail) ─────────────────────────────────
RESEND_API_KEY="re_..."                          # SECRET
RESEND_FROM_EMAIL="AXON <noreply@axon.com.br>"
RESEND_REPLY_TO="suporte@axon.com.br"

# ─── Cloudflare Turnstile ────────────────────────────
NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x..."
TURNSTILE_SECRET_KEY="0x..."                     # SECRET

# ─── Sentry ──────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="..."                          # SECRET (sourcemap upload)
SENTRY_ORG="axon"
SENTRY_PROJECT="axon-web"

# ─── FingerprintJS ───────────────────────────────────
NEXT_PUBLIC_FPJS_PUBLIC_API_KEY="..."

# ─── Outros ──────────────────────────────────────────
ADMIN_EMAILS="johnattan@axon.com.br"            # CSV de emails que viram admin no signup
SUPPORT_EMAIL="suporte@axon.com.br"
```

## Setup passo a passo

### 1. Clone e instale

```bash
git clone <repo>
cd axon
pnpm install
cp .env.example .env.local
# Preencher .env.local
```

### 2. Supabase local

```bash
supabase init                  # se ainda não inicializado
supabase start                 # sobe Postgres, Auth, Storage local
supabase db push               # aplica migrations
supabase gen types typescript --local > src/types/supabase.ts
```

URLs locais (default):

- API: `http://localhost:54321`
- DB: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio: `http://localhost:54323`
- Inbucket (capturador de e-mails): `http://localhost:54324`

### 3. Pagar.me sandbox

1. Criar conta em https://pagar.me
2. Pegar chaves de teste em Dashboard → Configurações → API Keys
3. Criar recipient para AXON (sandbox tem assistente)
4. Configurar webhook URL: `https://<ngrok-url>/api/webhooks/pagarme` durante dev

### 4. ngrok para webhook em dev

```bash
ngrok http 3000
# Use a URL https://xxxx.ngrok.io no painel Pagar.me
```

### 5. Resend

- Verificar domínio `axon.com.br` (DNS) em produção.
- Em dev, usar `onboarding@resend.dev` ou Inbucket do Supabase local.

### 6. Cloudflare Turnstile

- Criar site key em https://www.cloudflare.com/products/turnstile/
- Adicionar `localhost` aos hostnames permitidos.

### 7. Rodar

```bash
pnpm dev
```

Acesse `http://localhost:3000`.

## Scripts úteis

```bash
pnpm dev                  # dev server
pnpm build                # produção
pnpm start                # rodar produção localmente
pnpm lint                 # ESLint
pnpm lint:fix             # autocorrige
pnpm typecheck            # tsc --noEmit
pnpm test                 # Vitest watch
pnpm test:run             # Vitest single run
pnpm test:e2e             # Playwright
pnpm test:e2e:ui          # Playwright modo UI

# Supabase
pnpm db:start             # supabase start
pnpm db:stop              # supabase stop
pnpm db:reset             # supabase db reset (atenção: apaga dados locais)
pnpm db:push              # supabase db push
pnpm db:types             # gera types

# Utilidades
pnpm gen:qr-secret        # gera novo QR_HMAC_SECRET
```

## CI/CD (GitHub Actions)

Arquivo `.github/workflows/ci.yml`:

- Trigger: push, PR.
- Jobs: lint, typecheck, test, build.
- Falha bloqueia merge.

Arquivo `.github/workflows/e2e.yml`:

- Trigger: nightly + manual.
- Roda Playwright contra preview do Vercel.

## Deploy

- **Web**: Vercel (Git integration). Preview por PR, produção em `main`.
- **DB**: Supabase Cloud. Migrations aplicadas via `supabase db push` no CI (job protegido).
- **Edge Functions**: `supabase functions deploy <name>`.

## Secrets em produção

- **Vercel**: configurar todas as env vars em Settings → Environment Variables (Production + Preview).
- **Supabase**: secrets de Edge Functions via `supabase secrets set KEY=VALUE`.
- **Rotação**: trocar `QR_HMAC_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` a cada 90 dias (ou em qualquer suspeita).

## Backups

- Supabase Pro+: backup diário automático, retenção 7d.
- Backup adicional manual semanal: `pg_dump` para Storage (Cloudflare R2).
- Teste de restore mensal.
