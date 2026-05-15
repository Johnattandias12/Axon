"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateQrPayload } from "@/lib/qr/hmac"
import { sendTicketConfirmation } from "@/lib/email/send"
import { formatDate } from "@/lib/utils"

// ─── Schemas ─────────────────────────────────────────────────
const addSchema = z.object({
  lotId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(10),
})
const updateSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(10),
})
const removeSchema = z.object({ itemId: z.string().uuid() })

// ─── Helpers ─────────────────────────────────────────────────
async function getAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export type ActionResult = { ok: true } | { ok: false; error: string }

// ─── Adicionar ao carrinho ───────────────────────────────────
export async function addToCart(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await getAuth()
  if (!user) return { ok: false, error: "Faça login para comprar." }

  const parsed = addSchema.safeParse({
    lotId: formData.get("lotId"),
    quantity: formData.get("quantity"),
  })
  if (!parsed.success) return { ok: false, error: "Dados inválidos." }

  const admin = createAdminClient()

  // Verifica disponibilidade
  const { data: lot } = await admin
    .from("ticket_lots")
    .select("quantity_total, quantity_sold, quantity_reserved")
    .eq("id", parsed.data.lotId)
    .single()

  if (!lot) return { ok: false, error: "Lote não encontrado." }

  const avail = lot.quantity_total - lot.quantity_sold - lot.quantity_reserved
  if (avail < parsed.data.quantity) {
    return { ok: false, error: `Apenas ${avail} ingressos disponíveis.` }
  }

  // Upsert: se já existe, soma quantidades (limita a 10)
  const { data: existing } = await admin
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("ticket_lot_id", parsed.data.lotId)
    .maybeSingle()

  if (existing) {
    const newQty = Math.min(10, existing.quantity + parsed.data.quantity)
    const { error } = await admin
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await admin.from("cart_items").insert({
      user_id: user.id,
      ticket_lot_id: parsed.data.lotId,
      quantity: parsed.data.quantity,
    })
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath("/carrinho")
  revalidatePath("/eventos", "layout")
  return { ok: true }
}

// ─── Atualizar quantidade ────────────────────────────────────
export async function updateCartQuantity(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await getAuth()
  if (!user) return { ok: false, error: "Faça login." }

  const parsed = updateSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  })
  if (!parsed.success) return { ok: false, error: "Dados inválidos." }

  const admin = createAdminClient()
  const { error } = await admin
    .from("cart_items")
    .update({ quantity: parsed.data.quantity })
    .eq("id", parsed.data.itemId)
    .eq("user_id", user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/carrinho")
  return { ok: true }
}

// ─── Remover item ────────────────────────────────────────────
export async function removeCartItem(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await getAuth()
  if (!user) return { ok: false, error: "Faça login." }

  const parsed = removeSchema.safeParse({ itemId: formData.get("itemId") })
  if (!parsed.success) return { ok: false, error: "Dados inválidos." }

  const admin = createAdminClient()
  const { error } = await admin
    .from("cart_items")
    .delete()
    .eq("id", parsed.data.itemId)
    .eq("user_id", user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/carrinho")
  return { ok: true }
}

// ─── Limpar carrinho ─────────────────────────────────────────
export async function clearCart(): Promise<ActionResult> {
  const user = await getAuth()
  if (!user) return { ok: false, error: "Faça login." }

  const admin = createAdminClient()
  const { error } = await admin.from("cart_items").delete().eq("user_id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/carrinho")
  return { ok: true }
}

// ─── Checkout demo: converte carrinho em pedido pago + tickets ─
export type CheckoutState = { ok: true; orderId: string } | { ok: false; error: string } | null

export async function checkoutDemo(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const user = await getAuth()
  if (!user || !user.email) return { ok: false, error: "Faça login para finalizar." }

  const holderName = String(formData.get("holderName") ?? "").trim()
  const holderCpf = String(formData.get("holderCpf") ?? "").trim()
  if (holderName.length < 2) return { ok: false, error: "Informe o nome do titular." }
  if (holderCpf.length < 3) return { ok: false, error: "Informe o documento." }

  const admin = createAdminClient()

  const { data: items } = await admin
    .from("cart_items")
    .select(
      "id, quantity, ticket_lot_id, ticket_lots(id, price_cents, is_half_price, quantity_total, quantity_sold, quantity_reserved, event_id, name, ticket_types(name), events(id, title, starts_at, venue_name, city, state, status))"
    )
    .eq("user_id", user.id)

  if (!items || items.length === 0) {
    return { ok: false, error: "Seu carrinho está vazio." }
  }

  // Agrupa por evento (em modo demo permitimos 1 evento por checkout)
  type LotData = {
    id: string
    price_cents: number
    is_half_price: boolean
    quantity_total: number
    quantity_sold: number
    quantity_reserved: number
    event_id: string
    name: string
    ticket_types: { name: string } | { name: string }[] | null
    events:
      | {
          id: string
          title: string
          starts_at: string
          venue_name: string | null
          city: string | null
          state: string | null
          status: string
        }
      | {
          id: string
          title: string
          starts_at: string
          venue_name: string | null
          city: string | null
          state: string | null
          status: string
        }[]
      | null
  }
  const eventMap = new Map<
    string,
    { event: NonNullable<Exclude<LotData["events"], LotData["events"][]>>; items: typeof items }
  >()
  for (const item of items) {
    const lot = Array.isArray(item.ticket_lots) ? item.ticket_lots[0] : item.ticket_lots
    if (!lot) continue
    const evt = Array.isArray(lot.events) ? lot.events[0] : lot.events
    if (!evt || evt.status !== "published") continue
    const cur = eventMap.get(evt.id)
    if (cur) cur.items.push(item)
    else eventMap.set(evt.id, { event: evt, items: [item] })
  }

  if (eventMap.size === 0) return { ok: false, error: "Itens indisponíveis no carrinho." }
  if (eventMap.size > 1) {
    return {
      ok: false,
      error: "Por enquanto só é possível finalizar 1 evento por vez. Remova ou separe os itens.",
    }
  }

  const entries = Array.from(eventMap.values())
  const first = entries[0]
  if (!first) return { ok: false, error: "Itens indisponíveis no carrinho." }
  const event = first.event
  const eventItems = first.items

  // Calcula totais e valida estoque
  let subtotal = 0
  type LotForTicket = {
    id: string
    price_cents: number
    is_half_price: boolean
    quantity_sold: number
    quantity_total: number
    quantity_reserved: number
    name: string
    ticket_types: { name: string } | { name: string }[] | null
  }
  const ticketsToCreate: Array<{
    lotId: string
    qty: number
    pricePerUnit: number
    isHalf: boolean
    lot: LotForTicket
  }> = []

  for (const item of eventItems) {
    const lot = Array.isArray(item.ticket_lots) ? item.ticket_lots[0] : item.ticket_lots
    if (!lot) continue
    const avail = lot.quantity_total - lot.quantity_sold - lot.quantity_reserved
    if (avail < item.quantity) {
      return {
        ok: false,
        error: `Lote "${lot.name}" tem só ${avail} ingressos disponíveis.`,
      }
    }
    subtotal += lot.price_cents * item.quantity
    ticketsToCreate.push({
      lotId: lot.id,
      qty: item.quantity,
      pricePerUnit: lot.price_cents,
      isHalf: lot.is_half_price,
      lot: lot as LotForTicket,
    })
  }

  const fee = Math.round(subtotal * 0.1)
  const total = subtotal + fee

  // Cria a order
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
      metadata: { demo: true, source: "cart_checkout" },
    })
    .select("id")
    .single()

  if (orderErr || !order) return { ok: false, error: orderErr?.message ?? "Falha ao criar pedido." }

  // Order items + tickets
  const allQrs: string[] = []
  for (const t of ticketsToCreate) {
    await admin.from("order_items").insert({
      order_id: order.id,
      ticket_lot_id: t.lotId,
      quantity: t.qty,
      unit_price_cents: t.pricePerUnit,
    })

    const ticketRows = Array.from({ length: t.qty }, () => {
      const ticketId = crypto.randomUUID()
      const qr = generateQrPayload(ticketId, event.id)
      allQrs.push(qr)
      return {
        id: ticketId,
        order_id: order.id,
        ticket_lot_id: t.lotId,
        event_id: event.id,
        qr_hash: qr,
        holder_name: holderName,
        holder_cpf: holderCpf,
        is_half_price: t.isHalf,
        status: "valid" as const,
      }
    })

    await admin.from("tickets").insert(ticketRows)

    await admin
      .from("ticket_lots")
      .update({ quantity_sold: t.lot.quantity_sold + t.qty })
      .eq("id", t.lotId)
  }

  // Esvazia carrinho
  await admin.from("cart_items").delete().eq("user_id", user.id)

  // Email de confirmação (silencioso se sem Resend)
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
  void sendTicketConfirmation({
    to: user.email,
    buyerName: holderName,
    eventTitle: event.title,
    eventDate: formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" }),
    eventLocation: [event.venue_name, event.city, event.state].filter(Boolean).join(" · "),
    ticketCount: ticketsToCreate.reduce((s, t) => s + t.qty, 0),
    totalCents: total,
    orderUrl: `${appUrl}/minha-conta/ingressos/${order.id}`,
    qrPayloads: allQrs,
  })

  revalidatePath("/carrinho")
  revalidatePath("/minha-conta")
  redirect(`/minha-conta/ingressos/${order.id}`)
}
