# 🔐 Sprint 1 — Auth + Eventos

> Pré-requisito: Sprint 0 fechada.

## Contexto obrigatório

Leia:

- `CLAUDE.md`
- `docs/02-data-model.md`
- `docs/03-auth-roles.md`
- `docs/07-legal-compliance.md` (seção meia-entrada)
- `docs/08-design-system.md`

## Objetivo

Organizador consegue: criar conta → completar onboarding → criar evento → adicionar tipos/lotes → publicar.
Comprador consegue: ver listagem → ver página do evento (sem comprar ainda — checkout é Sprint 2).

## Entregas

### 1. Auth — Magic Link

#### Rotas

- `/(auth)/entrar` — formulário de e-mail (server action `signInWithOtp`)
- `/api/auth/callback` — verifica token, cria sessão, redireciona
- `/api/auth/logout` — limpa sessão

#### Componentes

- `<MagicLinkForm />` — input + botão "Receber link no e-mail"
- `<AuthCard />` — wrapper visual

#### Fluxo

1. Usuário digita e-mail.
2. Server action chama `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`.
3. Resend (via SMTP do Supabase em dev / domínio próprio em prod) envia link.
4. Click → callback → sessão criada → redirect `/`.
5. Primeiro login dispara trigger SQL `handle_new_user` que cria `profiles`.

### 2. Onboarding do organizador

#### Rota: `/organizador/comecar`

- Etapa 1: PF ou PJ
- Etapa 2: Dados (nome legal, CNPJ/CPF, telefone, e-mail)
- Etapa 3: Dados bancários (banco, agência, conta, titular)
- Etapa 4: Termos do organizador (aceite obrigatório)
- Etapa 5: Confirmação → cria `organizers` com `kyc_status='pending'` + atualiza `profiles.role='organizer'`

Validação Zod estrita em cada etapa. CNPJ/CPF: validar algoritmo.

> Para textos legais reutilizar padrão Filgueira V9 do owner (Poppins, paleta preto/dourado, prosa fluida). Skill `skill-juridico-filgueira` referenciada.

### 3. CRUD de eventos

#### Rotas

- `/organizador` — dashboard com KPI cards + lista de eventos
- `/organizador/eventos` — lista paginada
- `/organizador/eventos/novo` — wizard de criação
- `/organizador/eventos/[id]` — visão do evento + abas
- `/organizador/eventos/[id]/editar` — edição
- `/organizador/eventos/[id]/lotes` — gestão de tipos e lotes
- `/organizador/eventos/[id]/equipe` — convidar validadores

#### Wizard de criação (4 passos)

1. **Básico**: título, descrição (rich text Tiptap ou textarea + markdown), categoria, classificação etária.
2. **Local e data**: nome do local, endereço (autocomplete via Nominatim ou Google Maps), data início/fim.
3. **Banner**: upload pro Supabase Storage (`event-banners/<id>.<ext>`), recorte 16:9.
4. **Política**: dias para reembolso (default 7), descrição da política.

Após criar, evento fica em `draft`. Não aparece publicamente.

#### Gestão de lotes

- Criar/editar/remover `ticket_types` (VIP, Pista, Camarote)
- Dentro de cada tipo, criar `ticket_lots` (1º lote, 2º lote)
- Cada lote: nome, preço (em reais, converter para cents), quantidade, vigência, **flag meia-entrada**
- UI mostra resumo: "Total: 500 ingressos · Meia: 200 (40% ✅)"
- Botão "Publicar evento" só habilita se quota de meia ≥ 40% (a função trigger valida no DB também).

### 4. Listagem e busca pública

#### Rota: `/` (já existe da Sprint 0)

- Substituir mock por dados reais via Supabase.
- Hero com input de busca + filtros: cidade, categoria, período.
- Listagem com `<EventCard />`.

#### Rota: `/eventos`

- Listagem completa com filtros laterais.
- Paginação ou infinite scroll.

#### Rota: `/eventos/[slug]`

- Banner full-width.
- Título, data, local, mapa (Leaflet + OSM).
- Descrição renderizada.
- Seletor de tipos de ingresso + lotes (ainda sem comprar — Sprint 2 conecta).
- Política de cancelamento.
- Card do organizador.
- Sticky CTA mobile "Comprar".

SEO:

- Metadata dinâmica (title, description, OG image = banner).
- Sitemap dinâmico em `/sitemap.xml`.

### 5. Convite de validador

#### Em `/organizador/eventos/[id]/equipe`

- Lista de validadores atribuídos.
- Botão "Convidar": modal com e-mail + portão (opcional).
- Server action:
  - Verifica se profile existe pelo e-mail.
  - Se não, cria um placeholder via Supabase Admin (`createUser` com magic link).
  - Insere em `event_validators`.
  - Manda e-mail "Você foi convidado para validar o evento X".

### 6. Painel do comprador (mínimo)

#### Rota: `/minha-conta`

- "Olá, {nome}"
- Aba "Meus pedidos" — vazia na Sprint 1 (Sprint 2 popula)
- Aba "Dados pessoais" — editar nome, telefone, CPF
- Aba "Privacidade" — botões LGPD (export, delete) — implementação completa em Sprint 5

## Testes obrigatórios

### Unitários (Vitest)

- Validação de CPF/CNPJ
- Slug do evento (não-único, normalização)
- Conversor preço reais ↔ cents
- Schema Zod do evento

### E2E (Playwright)

- Login com magic link (mock do e-mail via Inbucket)
- Criar evento → adicionar lotes → publicar
- Listagem mostra evento publicado
- Página do evento renderiza corretamente

## Antes de fechar a sprint

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm test:e2e
pnpm build
```

## ✅ Definition of Done

- [ ] Login funcionando ponta a ponta (magic link)
- [ ] Onboarding completo do organizador
- [ ] Criar evento com lotes e publicar
- [ ] Validação de meia-entrada (40%) bloqueia publicação
- [ ] Listagem pública mostra eventos publicados
- [ ] Página do evento com SEO correto
- [ ] Convite de validador funcionando
- [ ] Painel do comprador básico
- [ ] Todos os testes passando
- [ ] Deploy preview no Vercel funcional

## Próxima sprint

Sprint 2 — Checkout: `prompts/sprint-2-checkout.md`
