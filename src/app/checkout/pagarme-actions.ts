"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createPagarmePixOrder, linkOrderToGateway } from "@/lib/payments/pagarme/orders"
import { validateCPF } from "@/lib/utils/validators"

export type PixChargeResult =
  | {
      ok: true
      orderId: string
      qrCode: string
      qrCodeUrl?: string
      expiresAt: string
    }
  | { ok: false; error: string }

const buySchema = z.object({
  lotId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(6),
  holderName: z.string().min(2).max(120),
  holderCpf: z.string().refine((v) => validateCPF(v), "CPF inválido."),
})

/**
 * Cria um pedido REAL na Pagar.me com pagamento Pix.
 * Fluxo:
 *   1. Valida autenticação + dados.
 *   2. Lê lote e checa estoque.
 *   3. Reserva atomicamente o estoque (reserve_lot RPC, lock pessimista).
 *   4. Cria order local com status='pending', reserved_until=now()+15min.
 *   5. Cria order_items.
 *   6. Chama Pagar.me create order (Pix).
 *   7. Salva gateway_order_id na order.
 *   8. Retorna QR pro client renderizar.
 *
 * O webhook (`/api/webhooks/pagarme`) é quem promove pra 'paid' e gera tickets.
 */
export async function createPixChargeAction(formData: FormData): Promise<PixChargeResult> {
  const parsed = buySchema.safeParse({
    lotId: formData.get("lotId"),
    quantity: formData.get("quantity"),
    holderName: String(formData.get("holderName") ?? "").trim(),
    holderCpf: String(formData.get("holderCpf") ?? "").replace(/\D/g, ""),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  if (!process.env["PAGARME_API_KEY"]) {
    return {
      ok: false,
      error: "Pagamento real desativado. Configure PAGARME_API_KEY pra ativar.",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { ok: false, error: "Você precisa estar autenticado." }
  }

  const admin = createAdminClient()

  const { data: lot, error: lotErr } = await admin
    .from("ticket_lots")
    .select("*, ticket_types(name), events!inner(id, title, status, organizer_id, starts_at)")
    .eq("id", parsed.data.lotId)
    .single()

  if (lotErr || !lot) return { ok: false, error: "Lote indisponível." }

  const event = Array.isArray(lot.events) ? lot.events[0] : lot.events
  if (!event || event.status !== "published") {
    return { ok: false, error: "Evento indisponível." }
  }

  // Captura imutáveis pro closure de rollback
  const lotId = lot.id as string
  const qty = parsed.data.quantity
  const priceCents = lot.price_cents as number

  // Reserva atômica via SQL RPC (já feito na migration 003)
  const { error: reserveErr } = await admin.rpc("reserve_lot", {
    p_lot_id: lotId,
    p_quantity: qty,
    p_order_id: crypto.randomUUID(), // sentinel — real order vem depois
  })
  if (reserveErr) {
    return {
      ok: false,
      error: /estoque_insuficiente/i.test(reserveErr.message)
        ? "Esgotaram enquanto você finalizava."
        : reserveErr.message,
    }
  }

  // Rollback helper
  async function releaseReservation() {
    await admin.rpc("release_lot", { p_lot_id: lotId, p_quantity: qty })
  }

  const subtotal = priceCents * qty
  const fee = Math.round(subtotal * 0.1)
  const total = subtotal + fee

  // Cria order LOCAL com status pending
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      buyer_id: user.id,
      event_id: event.id,
      status: "pending",
      subtotal_cents: subtotal,
      service_fee_cents: fee,
      total_cents: total,
      payment_method: "pix",
      reserved_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      metadata: {
        holders: [{ name: parsed.data.holderName, cpf: parsed.data.holderCpf, lot_id: lot.id }],
      },
    })
    .select("id")
    .single()

  if (orderErr || !order) {
    await releaseReservation()
    return { ok: false, error: orderErr?.message ?? "Falha ao criar pedido." }
  }

  // Order items pra reconciliação + cron expire_pending_orders
  const { error: itemsErr } = await admin.from("order_items").insert({
    order_id: order.id,
    ticket_lot_id: lotId,
    quantity: qty,
    unit_price_cents: priceCents,
  })
  if (itemsErr) {
    await admin.from("orders").delete().eq("id", order.id)
    await releaseReservation()
    return { ok: false, error: itemsErr.message }
  }

  // Chama Pagar.me
  try {
    const tt = lot.ticket_types
    const typeName = (Array.isArray(tt) ? tt[0] : tt)?.name ?? "Ingresso"
    const result = await createPagarmePixOrder({
      orderId: order.id,
      buyerName: parsed.data.holderName,
      buyerEmail: user.email,
      buyerCpf: parsed.data.holderCpf,
      amountCents: total,
      description: `${event.title} - ${typeName}`,
      expiresInMinutes: 15,
      items: [
        {
          amount: priceCents,
          description: `${typeName} - ${(lot.name as string | null) ?? "Lote"}`,
          quantity: qty,
        },
        {
          amount: fee,
          description: "Taxa de serviço AXON",
          quantity: 1,
        },
      ],
    })

    await linkOrderToGateway(admin, order.id, result.pagarme_order_id, {
      qr_code: result.qr_code,
      ...(result.qr_code_url ? { qr_code_url: result.qr_code_url } : {}),
      expires_at: result.expires_at,
    })

    return {
      ok: true,
      orderId: order.id,
      qrCode: result.qr_code,
      ...(result.qr_code_url ? { qrCodeUrl: result.qr_code_url } : {}),
      expiresAt: result.expires_at,
    }
  } catch (err) {
    // Pagar.me falhou — desfaz tudo
    await admin.from("order_items").delete().eq("order_id", order.id)
    await admin.from("orders").delete().eq("id", order.id)
    await releaseReservation()
    const msg = err instanceof Error ? err.message : "Falha no gateway"
    console.error("[createPixChargeAction] pagarme error:", msg, err)
    return { ok: false, error: "Não foi possível gerar o Pix. Tente novamente." }
  }
}
