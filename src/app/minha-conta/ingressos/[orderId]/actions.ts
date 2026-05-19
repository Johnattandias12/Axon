"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendTicketTransferred } from "@/lib/email/send"
import { formatDate } from "@/lib/utils"

export type TicketActionResult =
  | { ok: true; message?: string; transferUrl?: string }
  | { ok: false; error: string }

const ticketIdSchema = z.object({ ticketId: z.string().uuid() })
const transferSchema = z.object({
  ticketId: z.string().uuid(),
  recipientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
})
const refundSchema = z.object({
  ticketId: z.string().uuid(),
  reason: z.string().max(500).optional().default(""),
})

async function getAuthedTicket(ticketId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Faça login.", user: null, ticket: null }

  const admin = createAdminClient()
  const { data: ticket, error } = await admin
    .from("tickets")
    .select(
      "id, status, transfer_token, refund_requested_at, holder_name, order_id, orders(buyer_id)"
    )
    .eq("id", ticketId)
    .single()

  if (error) {
    console.error("[getAuthedTicket] error:", error)
    return { error: `Erro no banco: ${error.message}`, user, ticket: null }
  }
  if (!ticket) return { error: "Ingresso não encontrado no banco.", user, ticket: null }
  const order = Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders
  if (!order || order.buyer_id !== user.id) {
    return { error: "Este ingresso não é seu.", user, ticket: null }
  }

  return { error: null, user, ticket, admin }
}

// ─── Transferir: gera token de 7 dias, opcionalmente envia email ───────
export async function transferTicket(
  _prev: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const parsed = transferSchema.safeParse({
    ticketId: formData.get("ticketId"),
    recipientEmail: formData.get("recipientEmail") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const ctx = await getAuthedTicket(parsed.data.ticketId)
  if (ctx.error || !ctx.ticket || !ctx.admin) return { ok: false, error: ctx.error ?? "" }

  if (ctx.ticket.status !== "valid") {
    return { ok: false, error: "Só dá pra transferir ingresso válido." }
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await ctx.admin
    .from("tickets")
    .update({
      status: "paused",
      transfer_token: token,
      transfer_expires_at: expiresAt,
    })
    .eq("id", ctx.ticket.id)

  if (error) return { ok: false, error: error.message }

  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
  const transferUrl = `${appUrl}/transferir/${token}`

  // Envia email pro destinatário se informado (silencioso sem RESEND_API_KEY)
  let emailSent = false
  const recipientEmail = parsed.data.recipientEmail?.trim()
  if (recipientEmail) {
    try {
      const { data: orderEvent } = await ctx.admin
        .from("tickets")
        .select("id, events(title, starts_at, venue_name, city, state)")
        .eq("id", ctx.ticket.id)
        .single()
      const evt =
        orderEvent && Array.isArray(orderEvent.events) ? orderEvent.events[0] : orderEvent?.events
      if (evt) {
        const res = await sendTicketTransferred({
          to: recipientEmail,
          fromName: ctx.ticket.holder_name ?? "Alguém",
          eventTitle: evt.title,
          eventDate: formatDate(evt.starts_at, { dateStyle: "full", timeStyle: "short" }),
          eventLocation: [evt.venue_name, evt.city, evt.state].filter(Boolean).join(" · "),
          acceptUrl: transferUrl,
        })
        emailSent = res.sent
      }
    } catch (err) {
      console.error("[transferTicket] email envio falhou:", err)
    }
  }

  revalidatePath(`/minha-conta/ingressos/${ctx.ticket.order_id}`)
  return {
    ok: true,
    message: emailSent
      ? "Link enviado por email pro destinatário."
      : recipientEmail
        ? "Link criado. Email não foi enviado — copie e mande você mesmo."
        : "Link de transferência criado.",
    transferUrl,
  }
}

// ─── Cancelar transferência (volta a valid) ───────────────────
export async function cancelTransfer(
  _prev: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const parsed = ticketIdSchema.safeParse({ ticketId: formData.get("ticketId") })
  if (!parsed.success) return { ok: false, error: "Dados inválidos." }

  const ctx = await getAuthedTicket(parsed.data.ticketId)
  if (ctx.error || !ctx.ticket || !ctx.admin) return { ok: false, error: ctx.error ?? "" }

  if (ctx.ticket.status !== "paused" || !ctx.ticket.transfer_token) {
    return { ok: false, error: "Este ingresso não está em transferência." }
  }

  const { error } = await ctx.admin
    .from("tickets")
    .update({
      status: "valid",
      transfer_token: null,
      transfer_expires_at: null,
    })
    .eq("id", ctx.ticket.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/minha-conta/ingressos/${ctx.ticket.order_id}`)
  return { ok: true, message: "Transferência cancelada." }
}

// ─── Solicitar reembolso (pausa o ingresso) ───────────────────
export async function requestRefund(
  _prev: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const parsed = refundSchema.safeParse({
    ticketId: formData.get("ticketId"),
    reason: formData.get("reason") ?? "",
  })
  if (!parsed.success) return { ok: false, error: "Dados inválidos." }

  const ctx = await getAuthedTicket(parsed.data.ticketId)
  if (ctx.error || !ctx.ticket || !ctx.admin) return { ok: false, error: ctx.error ?? "" }

  if (ctx.ticket.status !== "valid") {
    return { ok: false, error: "Só dá pra pedir reembolso de ingresso válido." }
  }

  const { error } = await ctx.admin
    .from("tickets")
    .update({
      status: "paused",
      refund_requested_at: new Date().toISOString(),
      refund_reason: parsed.data.reason || null,
    })
    .eq("id", ctx.ticket.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/minha-conta/ingressos/${ctx.ticket.order_id}`)
  return { ok: true, message: "Pedido registrado. O organizador vai te chamar." }
}

// ─── Cancelar pedido de reembolso ─────────────────────────────
export async function cancelRefundRequest(
  _prev: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const parsed = ticketIdSchema.safeParse({ ticketId: formData.get("ticketId") })
  if (!parsed.success) return { ok: false, error: "Dados inválidos." }

  const ctx = await getAuthedTicket(parsed.data.ticketId)
  if (ctx.error || !ctx.ticket || !ctx.admin) return { ok: false, error: ctx.error ?? "" }

  if (ctx.ticket.status !== "paused" || !ctx.ticket.refund_requested_at) {
    return { ok: false, error: "Não há pedido de reembolso em aberto." }
  }

  const { error } = await ctx.admin
    .from("tickets")
    .update({
      status: "valid",
      refund_requested_at: null,
      refund_reason: null,
    })
    .eq("id", ctx.ticket.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/minha-conta/ingressos/${ctx.ticket.order_id}`)
  return { ok: true, message: "Pedido cancelado. Seu ingresso voltou pra ativo." }
}
