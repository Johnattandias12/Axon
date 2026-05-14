# 📱 Sprint 3 — PWA de Validação (Porteiro)

> Pré-requisito: Sprint 2 fechada (ingressos com QR estão sendo gerados).

## Contexto obrigatório

- `CLAUDE.md`
- `docs/05-validation-flow.md` ← **leitura prioritária**
- `docs/02-data-model.md` (event_validators, check_ins, tickets)
- `docs/03-auth-roles.md` (role 'validator')

## Objetivo

Porteiro abre o app no celular, escaneia o QR, recebe ✅/❌ em <300ms, **funciona sem internet** com sincronização posterior. Painel mostra check-ins ao vivo.

## Entregas

### 1. Configurar como PWA

#### `public/manifest.webmanifest`

```json
{
  "name": "AXON Validador",
  "short_name": "AXON",
  "start_url": "/scan",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "icons": [...]
}
```

#### Service Worker

- Estratégia: `next-pwa` ou Workbox manual.
- Pre-cache: shell do `/scan/*`.
- Runtime: cache-first para manifest do evento, network-first para validações.

#### `next.config.ts`

Configurar para PWA + service worker.

### 2. Auth do validador

#### Rota `/scan`

- Se não logado → redireciona para `/(auth)/entrar?next=/scan`.
- Se logado mas sem eventos atribuídos → tela "Você ainda não foi convidado para validar nenhum evento".
- Lista de eventos atribuídos (via `event_validators`).
- Selecionar evento → entra no scanner.

### 3. Scanner de câmera

#### Rota `/scan/[event_id]`

- Tela fullscreen, escura.
- `<QrScanner />` Client Component usando `@yudiel/react-qr-scanner` ou `html5-qrcode`.
- Header minimalista: nome do evento + status conexão (Online / Offline com badge da fila pendente).
- Botão "Configurações": trocar câmera, alternar som, mudar portão.

#### Comportamento ao escanear

1. Lê payload (string `AXN1.<id>.<hmac>`).
2. Chama `validateScan(payload)` (action). Roteia online/offline.
3. Exibe `<ValidationResult />` em tela cheia por 2s:
   - ✅ Verde + nome do titular + tipo de ingresso
   - 🟡 Amarelo + "MEIA — PEDIR DOCUMENTO" se `is_half_price`
   - ❌ Vermelho + motivo
4. Vibração + som conforme resultado.
5. Volta automaticamente para câmera.

### 4. Edge Function — `validate-ticket`

#### `supabase/functions/validate-ticket/index.ts`

```ts
serve(async (req) => {
  // 1. Verificar JWT (validator session)
  // 2. Body: { payload, gate? }
  // 3. supabase.rpc('validate_ticket', { p_payload, p_validator_id, p_gate })
  //    → função SQL faz lock + check HMAC + update + insert check_in
  // 4. Retorna jsonb com result
})
```

> A função SQL `validate_ticket` já existe (migration 003). Edge Function é wrapper HTTP.

### 5. Modo offline

#### Pré-download (com internet)

- Ao entrar em `/scan/[event_id]`:
  - `GET /api/scan/event/[id]/manifest` (server action ou route handler):
    - Lista TODOS os `tickets` válidos do evento (`status IN ('valid','used')`).
    - Retorna `{ event, valid_hashes: [{ id, hash16, holder_name, is_half_price, status }] }`.
  - Salva no IndexedDB (`idb-keyval` ou `dexie`).

#### Validação local

- `validateOffline(payload)`:
  1. Parse + recalcula HMAC com secret embutido **NÃO PODE**. Solução: HMAC é validado pelo servidor — offline a gente confia no manifest (lista whitelisted).
  2. Procura `id` no IndexedDB.
  3. Verifica `status === 'valid'` E não está em `used_local`.
  4. Marca em `used_local` IndexedDB.
  5. Enfileira `{ ticket_id, scanned_at, gate, payload }` em `sync_queue`.
  6. Mostra ✅.

> Decisão de arquitetura: o secret HMAC NÃO sai do servidor. No offline confiamos na whitelist pre-baixada — riscos: ingresso emitido depois da whitelist não valida offline (mostrar warning) e ingresso cancelado depois pode ser aceito (raro; risco aceito).

#### Sincronização

- SW listener `online` → drena `sync_queue` via `POST /api/scan/sync-batch`.
- Servidor processa cada item via `validate_ticket()`:
  - Se já `used` por outro: conflito → primeiro ganha.
  - Se `valid`: marca used com `offline_synced=true`.
- Resposta detalhada por item → cliente atualiza badge.

### 6. Painel ao vivo do organizador

#### Rota `/organizador/eventos/[id]/check-in`

- Card "Total esperado: X / Check-ins: Y" com gauge.
- Gráfico de barras por minuto (recharts).
- Gráfico por portão.
- Lista de últimos 20 scans (Realtime subscription em `check_ins` filtrada por evento).
- Lista de alertas (scans `invalid_hmac`, `already_used`).
- Botão "Exportar CSV".

### 7. UX detalhada

- Modo escuro forçado em `/scan/*`.
- Bloqueia rotação de tela.
- `screen.wakeLock` para não dormir durante o evento.
- Som configurável (default ON).
- Vibração configurável.
- Tela de "Bateria fraca" se < 15%.
- "Avise se sair" quando há fila offline não sincronizada.

## Testes obrigatórios

### Unitários

- Parse do payload `AXN1.<id>.<hmac>`.
- Geração HMAC server-side (consistência com `validate_ticket`).
- Lógica de fila offline.

### E2E

- Validar ingresso válido → marca used.
- Validar mesmo ingresso 2x → segundo retorna `already_used`.
- Offline: marcar 3 ingressos → voltar online → sincroniza.
- 2 validadores tentam o mesmo ingresso simultaneamente → só 1 ganha.

### Manual (em campo)

- Testar em iPhone Safari, Chrome Android, com 4G ruim, sem rede.

## Definition of Done

- [ ] `/scan` instalável como PWA (Add to Home Screen)
- [ ] Scanner lê QR rapidamente
- [ ] Validação online funciona com lock pessimista
- [ ] Modo offline com fila e sincronização
- [ ] Painel ao vivo do organizador
- [ ] Funciona iPhone + Android
- [ ] Build prod + deploy preview

## Próxima sprint

Sprint 4 — Financeiro: `prompts/sprint-4-financial.md`
