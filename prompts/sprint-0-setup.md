# 🚀 Sprint 0 — Setup

> **Como usar:** abra o Claude Code na pasta raiz `AXON/`, cole este prompt inteiro, mande executar. Confirme passo a passo se preferir, ou deixe rodar em modo agente.

---

## Contexto

Leia primeiro:

- `CLAUDE.md`
- `PROJECT_PLAN.md`
- `docs/01-architecture.md`
- `docs/08-design-system.md`
- `docs/09-environment-setup.md`

## Objetivo da Sprint 0

Deixar o projeto **rodando localmente** com:

- Next.js 15 + TypeScript strict + Tailwind v4 + shadcn/ui
- Supabase local provisionado e migrations aplicadas
- Design system básico funcionando
- CI no GitHub Actions
- Deploy preview no Vercel

## Tarefas

### 1. Inicializar projeto Next.js

```bash
pnpm dlx create-next-app@latest . \
  --typescript --tailwind --app --src-dir --import-alias "@/*" \
  --no-eslint --use-pnpm
```

Depois ajustar:

- Habilitar `strict: true` e `noUncheckedIndexedAccess: true` em `tsconfig.json`.
- Configurar `pnpm` workspace se necessário.

### 2. Instalar dependências

**Core:**

```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zod react-hook-form @hookform/resolvers
pnpm add @tanstack/react-query
pnpm add date-fns
pnpm add lucide-react
pnpm add clsx tailwind-merge class-variance-authority
```

**Dev:**

```bash
pnpm add -D @types/node typescript
pnpm add -D eslint eslint-config-next @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D prettier prettier-plugin-tailwindcss
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D @playwright/test
pnpm add -D husky lint-staged
```

### 3. shadcn/ui

```bash
pnpm dlx shadcn@latest init
# Style: New York | Base color: Slate | CSS vars: Yes
pnpm dlx shadcn@latest add button card input label dialog drawer dropdown-menu form select tabs toast badge separator skeleton avatar sonner
```

### 4. Estrutura de pastas

Crie conforme `CLAUDE.md` seção 3. Use:

```bash
mkdir -p src/lib/supabase src/lib/pagarme src/lib/qr src/lib/antifraud src/lib/utils
mkdir -p src/components/ui src/components/checkout src/components/event src/components/shared
mkdir -p src/hooks src/types src/styles
mkdir -p src/app/\(public\) src/app/\(auth\) src/app/checkout src/app/minha-conta src/app/organizador src/app/admin src/app/scan src/app/api/webhooks/pagarme
```

### 5. Configurar Supabase

```bash
pnpm add -D supabase
pnpm dlx supabase init
pnpm dlx supabase start
```

Mover migrations existentes para `supabase/migrations/`. Aplicar:

```bash
pnpm dlx supabase db push
pnpm dlx supabase gen types typescript --local > src/types/supabase.ts
```

Configurar `app.qr_secret` no DB local:

```sql
ALTER DATABASE postgres SET app.qr_secret = '<gerar com openssl rand -hex 32>';
ALTER DATABASE postgres SET app.admin_emails = 'johnattan@axon.com.br';
```

### 6. Supabase clients

Criar:

- `src/lib/supabase/server.ts` — usa `createServerClient` do `@supabase/ssr` com cookies
- `src/lib/supabase/client.ts` — `createBrowserClient` para Client Components
- `src/lib/supabase/admin.ts` — `service_role`, **só usar em rotas API/server actions críticas**
- `src/lib/supabase/middleware.ts` — helper para o middleware

Seguir exatamente o guia oficial `@supabase/ssr` para Next.js 15.

### 7. Middleware de autenticação

`src/middleware.ts` com refresh de sessão + proteção de rotas conforme `docs/03-auth-roles.md` seção "Proteção de rotas".

### 8. Design system

- Em `src/app/globals.css`: definir as CSS variables de `docs/08-design-system.md`.
- Em `tailwind.config.ts`: estender `colors` com tokens do brand.
- Adicionar Inter via `next/font/google` em `src/app/layout.tsx`.
- Layout root com `<Toaster />` (sonner), `ThemeProvider` (next-themes).

### 9. Página inicial

`src/app/(public)/page.tsx`:

- Hero "Encontre seu próximo evento" + busca.
- Seções: "Em destaque", "Esta semana", "Perto de você".
- Por ora, dados mock. Sprint 1 conecta no Supabase.

Footer com links: Sobre, Privacidade, Termos, Contato.

### 10. ESLint + Prettier + Husky

- `.eslintrc.json` estrito (no-explicit-any, no-unused-vars, exhaustive-deps).
- `.prettierrc` com `prettier-plugin-tailwindcss`.
- Husky pre-commit: `lint-staged` (eslint --fix + prettier --write).
- Husky pre-push: `pnpm typecheck`.

### 11. Vitest setup

- `vitest.config.ts` com jsdom + alias `@/`.
- Arquivo `src/test/setup.ts` com `@testing-library/jest-dom`.

### 12. Playwright setup

- `pnpm dlx playwright install`.
- `playwright.config.ts` apontando para `http://localhost:3000`.
- Pasta `e2e/` com um teste smoke (homepage carrega).

### 13. GitHub Actions

Criar `.github/workflows/ci.yml`:

- Trigger: push, PR.
- Jobs: install (cache), lint, typecheck, test, build.
- Node 20, pnpm 9.

### 14. Vercel

- `vercel.json` se necessário (regions: `gru1`).
- README com instruções de import no Vercel.

### 15. Sanity check final

Rode e me devolva:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

Tudo verde? Sprint 0 fechada.

## ✅ Definition of Done

- [ ] `pnpm dev` abre página inicial sem erros
- [ ] Tailwind v4 com tokens funcionando (cores do brand visíveis)
- [ ] Supabase local acessível em `localhost:54323`
- [ ] Migrations 001–003 aplicadas
- [ ] `pnpm typecheck` sem erros
- [ ] `pnpm lint` sem warnings (ou só warnings aceitáveis)
- [ ] CI passa no PR de "init"
- [ ] Preview do Vercel funcionando

## Próxima sprint

Sprint 1 — Auth + Eventos: `prompts/sprint-1-auth-events.md`
