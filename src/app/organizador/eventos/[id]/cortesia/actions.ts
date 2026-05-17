"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateQrPayload } from "@/lib/qr/hmac"

const courtesySchema = z.object({
  eventId: z.string().uuid(),
  lotId: z.string().uuid(),
  items: z
    .array(
      z.object({
        name: z.string().min(2, "Nome muito curto"),
        cpf: z.string().min(3, "Informe documento"),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
      })
    )
    .min(1)
    .max(200),
})

export type IssueCourtesyState = { ok: true; issued: number } | { ok: false; error: string } | null

/**
 * Emite N cortesias (orders com total_cents=0) para um lote do evento.
 * Cada cortesia gera 1 ticket nominal com QR HMAC.
 * O organizador é tecnicamente o buyer das orders (não exige conta do convidado).
 */
export async function issueCourtesies(
  _prev: IssueCourtesyState,
  formData: FormData
): Promise<IssueCourtesyState> {
  const raw = formData.get("payload")
  if (typeof raw !== "string") {
    return { ok: false, error: "Payload ausente." }
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(raw)
  } catch {
    return { ok: false, error: "Payload inválido." }
  }

  const parsed = courtesySchema.safeParse(parsedJson)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const { eventId, lotId, items } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Não autenticado." }

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!organizer) return { ok: false, error: "Organizador não encontrado." }

  const admin = createAdminClient()

  const { data: event } = await admin
    .from("events")
    .select("id, organizer_id")
    .eq("id", eventId)
    .single()
  if (!event || event.organizer_id !== organizer.id) {
    return { ok: false, error: "Evento não encontrado ou sem permissão." }
  }

  const { data: lot } = await admin
    .from("ticket_lots")
    .select("id, event_id, quantity_total, quantity_sold, quantity_reserved, is_half_price")
    .eq("id", lotId)
    .single()
  if (!lot || lot.event_id !== eventId) {
    return { ok: false, error: "Lote inválido." }
  }

  const available = lot.quantity_total - lot.quantity_sold - lot.quantity_reserved
  if (available < items.length) {
    return { ok: false, error: `Apenas ${available} ingressos disponíveis neste lote.` }
  }

  let issued = 0
  for (const item of items) {
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        buyer_id: user.id,
        event_id: eventId,
        status: "paid",
        subtotal_cents: 0,
        service_fee_cents: 0,
        total_cents: 0,
        payment_method: "pix",
        paid_at: new Date().toISOString(),
        metadata: {
          courtesy: true,
          recipient_email: item.email || null,
          recipient_name: item.name,
        },
      })
      .select("id")
      .single()
    if (orderErr || !order) continue

    const ticketId = crypto.randomUUID()
    await admin.from("order_items").insert({
      order_id: order.id,
      ticket_lot_id: lotId,
      quantity: 1,
      unit_price_cents: 0,
    })
    await admin.from("tickets").insert({
      id: ticketId,
      order_id: order.id,
      ticket_lot_id: lotId,
      event_id: eventId,
      qr_hash: generateQrPayload(ticketId, eventId),
      holder_name: item.name,
      holder_cpf: item.cpf,
      is_half_price: lot.is_half_price,
      status: "valid",
    })
    issued++
  }

  if (issued > 0) {
    await admin
      .from("ticket_lots")
      .update({ quantity_sold: lot.quantity_sold + issued })
      .eq("id", lotId)
  }

  revalidatePath(`/organizador/eventos/${eventId}/cortesia`)
  return { ok: true, issued }
}
