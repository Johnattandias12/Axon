import type { SupabaseClient } from "@supabase/supabase-js"

export interface CheckInRow {
  id: string
  ticket_id: string | null
  event_id: string
  validator_id: string | null
  result: string
  scanned_at: string
  gate: string | null
  offline_synced: boolean
  payload_hash: string | null
  events: { id: string; title: string; slug: string | null } | null
  validators: { full_name: string | null; email: string | null } | null
  tickets: {
    id: string
    holder_name: string | null
    holder_cpf: string | null
    is_half_price: boolean
  } | null
}

type AnyClient = SupabaseClient

export interface CheckInQueryFilters {
  eventIds?: string[] // se setado, filtra só eventos dessa lista
  limit?: number
  sinceHours?: number
}

/**
 * Lista os últimos check_ins com info de evento, validador e titular.
 * Tolerante a colunas extras — service_role bypassa RLS.
 */
export async function listCheckIns(
  client: AnyClient,
  filters: CheckInQueryFilters = {}
): Promise<CheckInRow[]> {
  let query = client
    .from("check_ins")
    .select(
      `id, ticket_id, event_id, validator_id, result, scanned_at, gate, offline_synced, payload_hash,
       events(id, title, slug),
       validators:profiles!validator_id(full_name, email),
       tickets(id, holder_name, holder_cpf, is_half_price)`
    )
    .order("scanned_at", { ascending: false })
    .limit(filters.limit ?? 200)

  if (filters.eventIds && filters.eventIds.length > 0) {
    query = query.in("event_id", filters.eventIds)
  }
  if (filters.sinceHours) {
    const since = new Date(Date.now() - filters.sinceHours * 3600_000).toISOString()
    query = query.gte("scanned_at", since)
  }

  const { data } = await query
  return ((data ?? []) as unknown as CheckInRow[]) ?? []
}

export interface CheckInStats {
  total: number
  valid: number
  rejected: number
  validRate: number
  byGate: Map<string, number>
  byHour: number[]
  lastAt: string | null
}

export function computeCheckInStats(rows: CheckInRow[]): CheckInStats {
  const total = rows.length
  const valid = rows.filter((r) => r.result === "valid").length
  const rejected = total - valid
  const validRate = total === 0 ? 0 : Math.round((valid / total) * 100)
  const byGate = new Map<string, number>()
  for (const r of rows) {
    const k = r.gate ?? "—"
    byGate.set(k, (byGate.get(k) ?? 0) + 1)
  }
  // últimos 24 buckets de 1h
  const byHour = new Array<number>(24).fill(0)
  const now = Date.now()
  for (const r of rows) {
    const diffH = Math.floor((now - new Date(r.scanned_at).getTime()) / 3600_000)
    if (diffH >= 0 && diffH < 24) byHour[23 - diffH]! += 1
  }
  const lastAt = rows[0]?.scanned_at ?? null
  return { total, valid, rejected, validRate, byGate, byHour, lastAt }
}

export const RESULT_LABEL: Record<string, string> = {
  valid: "Válido",
  already_used: "Já usado",
  invalid_hmac: "QR inválido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  not_found: "Não encontrado",
  wrong_event: "Evento errado",
}

export const RESULT_COLOR: Record<string, { bg: string; color: string }> = {
  valid: { bg: "var(--success-soft)", color: "var(--success)" },
  already_used: { bg: "var(--warning-soft)", color: "var(--warning)" },
  invalid_hmac: { bg: "var(--danger-soft)", color: "var(--danger)" },
  cancelled: { bg: "var(--paper-soft)", color: "var(--mute)" },
  refunded: { bg: "var(--paper-soft)", color: "var(--mute)" },
  not_found: { bg: "var(--danger-soft)", color: "var(--danger)" },
  wrong_event: { bg: "var(--danger-soft)", color: "var(--danger)" },
}
