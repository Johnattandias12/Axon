"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyQrPayload } from "@/lib/qr/hmac"

const payloadSchema = z.object({
  payload: z.string().regex(/^AXN1\.[a-f0-9]{32}\.[a-f0-9]{16}$/, "Formato de QR inválido"),
})

export type ValidateResult =
  | {
      ok: true
      status: "valid" | "already_used" | "cancelled" | "refunded" | "paused"
      holderName: string
      typeName: string
      lotName: string
      eventTitle: string
      usedAt: string | null
      ticketId: string
    }
  | { ok: false; error: string }

/**
 * Valida um QR Code de ingresso e marca como utilizado (se válido).
 * Permissões: validator, organizer ou admin.
 * Em modo demo (sem auth completa) ainda valida o HMAC e marca usado.
 */
export async function validateQr(payload: string): Promise<ValidateResult> {
  const parsed = payloadSchema.safeParse({ payload })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "QR inválido." }
  }

  // Auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Faça login como validador." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["validator", "organizer", "admin"].includes(profile.role)) {
    return { ok: false, error: "Sem permissão para validar ingressos." }
  }

  const admin = createAdminClient()

  // Extrai o ticket_id do payload AXN1.<hex32>.<hmac16>
  const hex = payload.split(".")[1] ?? ""
  const ticketId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`

  const { data: ticket } = await admin
    .from("tickets")
    .select(
      `id, event_id, status, used_at, holder_name, qr_hash,
       ticket_lots(name, ticket_types(name)),
       events(title)`
    )
    .eq("id", ticketId)
    .maybeSingle()

  if (!ticket) return { ok: false, error: "Ingresso não encontrado." }

  // Confere HMAC
  if (!verifyQrPayload(payload, ticket.id, ticket.event_id)) {
    return { ok: false, error: "Assinatura inválida." }
  }

  const lot = Array.isArray(ticket.ticket_lots) ? ticket.ticket_lots[0] : ticket.ticket_lots
  const tt = lot && Array.isArray(lot.ticket_types) ? lot.ticket_types[0] : lot?.ticket_types
  const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events

  const previousStatus = ticket.status as "valid" | "used" | "cancelled" | "refunded" | "paused"

  // Se já usado/cancelado/reembolsado/pausado, retorna sem marcar
  if (previousStatus !== "valid") {
    const outStatus =
      previousStatus === "used"
        ? ("already_used" as const)
        : (previousStatus as "cancelled" | "refunded" | "paused")
    await admin.from("check_ins").insert({
      ticket_id: ticket.id,
      event_id: ticket.event_id,
      validator_id: user.id,
      result: outStatus,
    })
    return {
      ok: true,
      status: outStatus,
      holderName: ticket.holder_name,
      typeName: tt?.name ?? "Ingresso",
      lotName: lot?.name ?? "",
      eventTitle: event?.title ?? "Evento",
      usedAt: ticket.used_at,
      ticketId: ticket.id,
    }
  }

  // Marca como usado
  const usedAt = new Date().toISOString()
  await admin
    .from("tickets")
    .update({ status: "used", used_at: usedAt, used_by: user.id })
    .eq("id", ticket.id)

  await admin.from("check_ins").insert({
    ticket_id: ticket.id,
    event_id: ticket.event_id,
    validator_id: user.id,
    result: "valid",
  })

  return {
    ok: true,
    status: "valid",
    holderName: ticket.holder_name,
    typeName: tt?.name ?? "Ingresso",
    lotName: lot?.name ?? "",
    eventTitle: event?.title ?? "Evento",
    usedAt,
    ticketId: ticket.id,
  }
}
