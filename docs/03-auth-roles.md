# 03 — Auth e Papéis

## Provedor

**Supabase Auth** — magic link como padrão; Google OAuth como secundário (Sprint 4+).

Razão: comprador de ingresso não quer criar senha. E-mail é suficiente, e magic link é mais seguro que senha fraca.

## Papéis

| Role        | Quem               | Onde mora                                                 | Permissões base                                            |
| ----------- | ------------------ | --------------------------------------------------------- | ---------------------------------------------------------- |
| `buyer`     | Comprador padrão   | `profiles.role='buyer'`                                   | Comprar, ver próprios tickets                              |
| `organizer` | Produtor de evento | `profiles.role='organizer'` + linha em `organizers`       | Criar/editar próprios eventos, ver próprios pedidos, sacar |
| `validator` | Porteiro           | `profiles.role='validator'` + linha em `event_validators` | Escanear QR só dos eventos atribuídos                      |
| `admin`     | Time AXON          | `profiles.role='admin'`                                   | Tudo                                                       |

Promoção entre papéis:

- Buyer → Organizer: via onboarding `/organizador/comecar` (preenche `organizers`, KYC).
- Buyer → Validator: organizador convida via `/organizador/eventos/[id]/equipe`.
- Admin: setado manualmente via SQL.

## Fluxos

### Magic link

```
1. Usuário em /entrar digita e-mail
2. server action: supabase.auth.signInWithOtp({ email })
3. Supabase envia e-mail com link → /api/auth/callback?token=...
4. Callback verifica, cria sessão (cookie), redireciona pra /
5. Se primeiro login: cria `profiles` com role='buyer'
```

### Convite de validador

```
1. Organizador em /organizador/eventos/[id]/equipe → "Convidar"
2. Insere e-mail + portão opcional
3. server action createValidatorInvite:
   - Cria/recupera profile pelo e-mail
   - Insere em event_validators
   - Manda e-mail "Você foi convidado para validar o evento X"
4. Validador clica → faz magic link
5. Role é promovida a 'validator' (se ainda for buyer)
```

## RLS — princípios

**1. Default deny.** Toda tabela começa com:

```sql
ALTER TABLE x ENABLE ROW LEVEL SECURITY;
-- Sem policies = ninguém acessa nada (exceto service_role)
```

**2. Helpers em SQL** para reduzir duplicação:

```sql
CREATE FUNCTION auth.uid() RETURNS uuid AS ...      -- já existe no Supabase
CREATE FUNCTION public.is_admin() RETURNS bool AS
  $$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin') $$;
CREATE FUNCTION public.owns_event(event_id uuid) RETURNS bool AS ...
CREATE FUNCTION public.can_validate_event(event_id uuid) RETURNS bool AS ...
```

**3. Policies por papel** (exemplos resumidos — SQL completo em `migrations/002`):

```sql
-- events
CREATE POLICY "public reads published"
  ON events FOR SELECT
  USING (status = 'published' OR owns_event(id) OR is_admin());

CREATE POLICY "organizer manages own"
  ON events FOR ALL
  USING (organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()))
  WITH CHECK (organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()));

-- tickets
CREATE POLICY "buyer sees own"
  ON tickets FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid()));

CREATE POLICY "organizer sees event tickets"
  ON tickets FOR SELECT
  USING (owns_event(event_id) OR is_admin());

CREATE POLICY "validator reads only event scope"
  ON tickets FOR SELECT
  USING (can_validate_event(event_id));

-- Updates de status de ticket: SOMENTE via function validate_ticket()
-- Nenhuma policy de UPDATE pra tickets para usuários normais.
```

## Magic link com escopo (validador)

Quando convidamos um validador para 1 evento, podemos:

- (A) Login normal + RLS limita acesso só ao evento via `event_validators`.
- (B) Token específico no link `/scan/[token]` que só serve para aquele evento.

**Adotamos (A)** por simplicidade. O link de convite é só "entre na sua conta"; a permissão vem do banco.

## Sessões

- Cookies httpOnly + SameSite=Lax + Secure.
- Refresh automático via Supabase SSR helpers.
- Logout em `/api/auth/logout` (limpa cookies + revoga sessão Supabase).
- Token TTL: 1h access, 30d refresh.

## Proteção de rotas

Middleware (`src/middleware.ts`):

```ts
// pseudocódigo
- /organizador/* → exige role IN ('organizer', 'admin')
- /admin/* → exige role = 'admin'
- /scan/* → exige role IN ('validator', 'organizer', 'admin')
- /minha-conta/* → exige autenticação
- resto → público
```

Mesmo com middleware, **RLS é a fonte da verdade**. Middleware é UX (redireciona pra login), não segurança.

## 2FA (futuro, pós-MVP)

- Organizadores e admins: TOTP via Supabase MFA.
- Compradores: não obrigatório.
