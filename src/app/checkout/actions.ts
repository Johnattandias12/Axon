"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateQrPayload } from "@/lib/qr/hmac"
import { sendTicketConfirmation } from "@/lib/email/send"
import { formatDate } from "@/lib/utils"

const buyDemoSchema = z.object({
  lotId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(6),
  holderName: z.string().min(2, "Informe seu nome").max(120),
  holderCpf: z.string().min(3, "Informe seu documento").max(20),
})

export type BuyDemoState = { ok: true; orderId: string } | { ok: false; error: string } | null

/**
 * Cria um pedido confirmado SEM pagamento (modo demo) e gera os ingressos.
 * Fluxo:
 *  1. Garante usuário autenticado (cria perfil se for a primeira vez)
 *  2. Lê o lote, valida estoque
 *  3. Cria order PAID + order_items + tickets com QR HMAC
 *  4. Atualiza estoque (quantity_sold)
 *  5. Redireciona para /minha-conta/ingressos/[orderId]
 */
export async function buyDemo(_prev: BuyDemoState, formData: FormData): Promise<BuyDemoState> {
  const parsed = buyDemoSchema.safeParse({
    lotId: formData.get("lotId"),
    quantity: formData.get("quantity"),
    holderName: formData.get("holderName"),
    holderCpf: formData.get("holderCpf"),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: "Você precisa estar autenticado para comprar." }
  }

  const admin = createAdminClient()

  const { data: lot, error: lotErr } = await admin
    .from("ticket_lots")
    .select("*, events!inner(id, status, organizer_id, title, starts_at, venue_name, city, state)")
    .eq("id", parsed.data.lotId)
    .single()

  if (lotErr || !lot) {
    return { ok: false, error: "Lote não encontrado." }
  }

  const event = Array.isArray(lot.events) ? lot.events[0] : lot.events
  if (!event || event.status !== "published") {
    return { ok: false, error: "Evento indisponível para compra." }
  }

  const available = lot.quantity_total - lot.quantity_sold - lot.quantity_reserved
  if (available < parsed.data.quantity) {
    return { ok: false, error: `Apenas ${available} ingressos disponíveis neste lote.` }
  }

  const subtotal = lot.price_cents * parsed.data.quantity
  const fee = Math.round(subtotal * 0.1)
  const total = subtotal + fee

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      buyer_id: user.id,
      event_id: event.id,
      status: "paid",
      subtotal_cents: subtotal,
      service_fee_cents: fee,
      total_cents: total,
      payment_method: "pix",
      paid_at: new Date().toISOString(),
      metadata: { demo: true, source: "buy_demo" },
    })
    .select("id")
    .single()

  if (orderErr || !order) {
    return { ok: false, error: orderErr?.message ?? "Falha ao criar pedido." }
  }

  await admin.from("order_items").insert({
    order_id: order.id,
    ticket_lot_id: lot.id,
    quantity: parsed.data.quantity,
    unit_price_cents: lot.price_cents,
  })

  const ticketsToInsert = Array.from({ length: parsed.data.quantity }, () => {
    const ticketId = crypto.randomUUID()
    return {
      id: ticketId,
      order_id: order.id,
      ticket_lot_id: lot.id,
      event_id: event.id,
      qr_hash: generateQrPayload(ticketId, event.id),
      holder_name: parsed.data.holderName,
      holder_cpf: parsed.data.holderCpf,
      is_half_price: lot.is_half_price,
      status: "valid" as const,
    }
  })

  const { error: ticketsErr } = await admin.from("tickets").insert(ticketsToInsert)
  if (ticketsErr) {
    return { ok: false, error: ticketsErr.message }
  }

  await admin
    .from("ticket_lots")
    .update({ quantity_sold: lot.quantity_sold + parsed.data.quantity })
    .eq("id", lot.id)

  // Envia email de confirmação (silencioso se sem RESEND_API_KEY)
  if (user.email) {
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
    const evt = event as {
      title: string
      starts_at: string
      venue_name: string | null
      city: string | null
      state: string | null
    }
    void sendTicketConfirmation({
      to: user.email,
      buyerName: parsed.data.holderName,
      eventTitle: evt.title,
      eventDate: formatDate(evt.starts_at, { dateStyle: "full", timeStyle: "short" }),
      eventLocation: [evt.venue_name, evt.city, evt.state].filter(Boolean).join(" · ") || "",
      ticketCount: parsed.data.quantity,
      totalCents: total,
      orderUrl: `${appUrl}/minha-conta/ingressos/${order.id}`,
      qrPayloads: ticketsToInsert.map((t) => t.qr_hash),
    })
  }

  redirect(`/minha-conta/ingressos/${order.id}`)
}
