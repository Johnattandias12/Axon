# 05 — Fluxo de Validação (QR Code)

## Objetivos

1. Validação rápida (< 300ms) na porta.
2. Impossível forjar QR sem o secret do servidor.
3. Funciona **sem internet** (rede de quadra, estádio, igreja é instável).
4. Impossível usar o mesmo ingresso 2 vezes mesmo em modo distribuído.
5. Auditoria completa de scans (válidos e inválidos).

## Payload do QR

O QR contém uma string compacta:

```
AXN1.<ticket_id_short>.<hmac_short>
```

- `AXN1` — versão (permite migração futura).
- `ticket_id_short` — `tickets.id` (UUID base64-url, ~22 chars).
- `hmac_short` — primeiros 16 hex chars do HMAC-SHA256(`ticket_id + event_id + secret`).

Total: ~50 caracteres. Lê rápido em QR de tamanho moderado.

> **Secret** vive em `QR_HMAC_SECRET` (env). Trocar = invalidar todos os ingressos vigentes. Só fazer em incidente de vazamento.

## Geração

Server-side apenas, na função `confirm_order`:

```ts
import { createHmac } from "crypto"

function buildQrPayload(ticketId: string, eventId: string): string {
  const hmac = createHmac("sha256", process.env.QR_HMAC_SECRET!)
    .update(`${ticketId}|${eventId}`)
    .digest("hex")
    .slice(0, 16)
  return `AXN1.${ticketId}.${hmac}`
}
```

Salva em `tickets.qr_hash` o payload **completo** (para busca rápida).

## Validação online

Edge Function `validate_ticket` (rota chamada pelo PWA):

```ts
POST /functions/v1/validate-ticket
Body: { payload: string, gate?: string }
Auth: validator session

1. Parse payload (regex AXN1.<id>.<hmac>)
2. Recalcula HMAC esperado. Se != → INSERT check_in result='invalid_hmac' → 401
3. SELECT * FROM tickets WHERE id = $1 FOR UPDATE
4. Permissão: can_validate_event(ticket.event_id) → senão 403
5. Switch status:
   - 'valid'     → UPDATE status='used', used_at=now(), used_by=validator
                   INSERT check_in result='valid'
                   → 200 OK + dados do titular
   - 'used'      → INSERT check_in result='already_used'
                   → 409 Conflict + info do uso anterior
   - 'cancelled' → 410 Gone
   - 'refunded'  → 410 Gone
```

O lock `FOR UPDATE` garante que dois porteiros escaneando ao mesmo tempo não validem duplicado.

## Validação offline

**Antes do evento (com internet):**

1. PWA chama `GET /api/scan/event/[id]/manifest` (autenticado).
2. Recebe `{ event, valid_hashes: string[16][], cancelled_hashes, half_price_hashes }`.
3. Service Worker grava em IndexedDB.

**Na porta (sem internet):**

1. Scaneia QR.
2. Valida HMAC localmente (mesma função).
3. Checa contra `valid_hashes` (IndexedDB).
4. Se válido E não está em `used_local` (IndexedDB do device) → marca como usado local, exibe ✅.
5. Push pra `sync_queue` (IndexedDB).
6. Mostra badge "pendente sincronização".

**Quando voltar online:**

1. SW dispara sync.
2. POST `/api/scan/sync-batch` com lista de `[ticket_id, scanned_at, validator_id, gate]`.
3. Servidor processa cada item:
   - Se ticket ainda `valid` → marca used.
   - Se já `used` por outro → primeiro scan ganha; rotorna conflict.
4. SW remove os sincronizados da fila.
5. UI atualiza badges.

**Riscos do offline (assumidos):**

- 2 porteiros offline no mesmo evento podem aceitar duplicado → mitigação: dividir portões por validator, telão único de check-ins.

## UX da tela do porteiro

- Tela fullscreen, câmera no centro.
- Após scan:
  - ✅ VERDE com nome do titular + tipo de ingresso (5s, depois volta auto).
  - ⚠️ AMARELO se meia-entrada → mostrar "PEDIR DOC ESTUDANTE".
  - ❌ VERMELHO + motivo se inválido.
- Som: beep diferente pra cada resultado (sucesso curto, erro grave).
- Vibração curta.
- Modo escuro forçado (porta de evento à noite).
- Badge no canto: "Online" / "Offline (12 pendentes)".

## Métricas e dashboard ao vivo

Página `/organizador/eventos/[id]/check-in` mostra:

- Total esperado / Check-ins realizados (gauge).
- Gráfico por minuto (linha).
- Por portão (barras).
- Lista de últimos 20 scans (Realtime).
- Lista de tentativas inválidas (alerta).

## Anti-cópia / anti-screenshot

QR é prova de portador. Se compartilhado, o **primeiro** a entrar valida. Os demais batem `already_used`.

Mitigações adicionais:

- E-mail destacando: "Não compartilhe seu QR. O primeiro a entrar usa o ingresso."
- Opcional (configurável por evento): exigir documento na entrada (validador confirma `holder_cpf`).
