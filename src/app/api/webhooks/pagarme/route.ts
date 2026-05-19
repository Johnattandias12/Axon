import { NextResponse } from "next/server"
import {
  verifyPagarmeBasicAuth,
  verifyPagarmeSignature,
} from "@/lib/payments/pagarme/webhook-verify"
import { PagarmeWebhookEventSchema, isHandledEvent } from "@/lib/payments/pagarme/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendTicketConfirmation } from "@/lib/email/send"
import { generateQrPayload } from "@/lib/qr/hmac"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

/**
 * Webhook Pagar.me v5.
 *
 * Garantias:
 *  - Auth Basic (user+password) OU HMAC-SHA256 — escolhido por env presentes
 *  - Idempotência por event.id (insert UNIQUE em webhook_events; duplicado = 200 OK silencioso)
 *  - Claim atomico pending→paid no Node (sem dependência de app.qr_secret)
 *  - release_lot() devolve estoque em cancel/fail/expire
 *  - Email de confirmação enviado apenas no 1º processamento do evento
 *  - Falha de processamento NÃO marca evento como processado (fica gravado com .error)
 */
export async function POST(req: Request) {
  const rawBody = await req.text()

  // 1) Autenticação. Pagar.me v5 atualmente usa Basic Auth (user+password
  //    definidos por nós ao criar o webhook). Mantemos fallback pra HMAC.
  const whUser = process.env["PAGARME_WEBHOOK_USER"]
  const whPass = process.env["PAGARME_WEBHOOK_PASSWORD"]
  const hmacSecret = process.env["PAGARME_WEBHOOK_SECRET"]
  const auth = req.headers.get("authorization")
  const signature = req.headers.get("x-hub-signature") || req.headers.get("pagarme-signature")

  const isSandbox = process.env["NEXT_PUBLIC_PAGARME_ENV"] === "sandbox"

  let authed = false
  if (whUser && whPass && auth) {
    authed = verifyPagarmeBasicAuth(auth, whUser, whPass)
    if (!authed) {
      console.error("[pagarme-webhook] basic auth inválido")
      return new NextResponse("invalid auth", { status: 401 })
    }
  } else if (hmacSecret && signature) {
    authed = verifyPagarmeSignature(rawBody, signature, hmacSecret)
    if (!authed) {
      console.error("[pagarme-webhook] HMAC signature inválido")
      return new NextResponse("invalid signature", { status: 401 })
    }
  } else if (!whUser && !whPass && !hmacSecret) {
    console.warn(
      "[pagarme-webhook] sem PAGARME_WEBHOOK_USER+PASSWORD nem PAGARME_WEBHOOK_SECRET — rodando sem verificação (dev only)"
    )
  } else if (isSandbox) {
    console.warn(
      "[pagarme-webhook] rodando em modo sandbox com credenciais incompletas no header — ignorando autenticação"
    )
  } else {
    // env definida mas header ausente
    console.error("[pagarme-webhook] credenciais configuradas mas header ausente")
    return new NextResponse("missing auth", { status: 401 })
  }

  // 2) Parse + valida shape
  let event
  try {
    const json = JSON.parse(rawBody) as unknown
    event = PagarmeWebhookEventSchema.parse(json)
  } catch (e) {
    console.error("[pagarme-webhook] invalid payload:", e)
    return new NextResponse("invalid payload", { status: 400 })
  }

  const admin = createAdminClient()

  // 3) Idempotência: tenta inserir em webhook_events; conflito = já processado.
  const wh = admin as unknown as {
    from: (n: string) => {
      insert: (
        row: Record<string, unknown>
      ) => Promise<{ error: { code?: string; message: string } | null }>
    }
  }
  const insertRes = await wh.from("webhook_events").insert({
    id: event.id,
    gateway: "pagarme",
    type: event.type,
    payload: event,
  })
  if (insertRes.error) {
    // 23505 = unique_violation no Postgres → evento duplicado, OK.
    if (insertRes.error.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error("[pagarme-webhook] webhook_events insert failed:", insertRes.error.message)
    // Não bloqueia processamento — só perde idempotência.
  }

  // 4) Despacha o evento (só os que importam)
  if (!isHandledEvent(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type })
  }

  try {
    if (event.type === "order.paid" || event.type === "charge.paid") {
      await handleOrderPaid(admin, event.data)
    } else if (
      event.type === "order.canceled" ||
      event.type === "order.payment_failed" ||
      event.type === "order.expired"
    ) {
      await handleOrderFailed(admin, event.data, event.type)
    } else if (event.type === "charge.refunded" || event.type === "charge.chargedback") {
      await handleChargeRefund(admin, event.data)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[pagarme-webhook] processing ${event.type} failed:`, msg)
    // Marca o evento como erro pra reprocessamento manual.
    const upd = admin as unknown as {
      from: (n: string) => {
        update: (row: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: unknown }>
        }
      }
    }
    await upd
      .from("webhook_events")
      .update({ error: msg.slice(0, 1000) })
      .eq("id", event.id)
    return new NextResponse("processing error", { status: 500 })
  }

  return NextResponse.json({ received: true })
}

interface AdminClient {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string
      ) => {
        maybeSingle?: () => Promise<{ data: Record<string, unknown> | null }>
        single?: () => Promise<{ data: Record<string, unknown> | null }>
      }
    }
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: unknown }>
    }
  }
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
}

function admin(c: ReturnType<typeof createAdminClient>): AdminClient {
  return c as unknown as AdminClient
}

/**
 * data: PagarmeOrder ou PagarmeCharge (depende do tipo de evento).
 * `code` no order vem como nosso UUID (`orders.id`).
 * `order_id` (no charge) também é nosso UUID quando event for charge.*.
 */
async function handleOrderPaid(
  client: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>
) {
  const ourOrderId = extractOurOrderId(data)
  if (!ourOrderId) {
    console.error("[pagarme-webhook] order.paid sem nosso order_id no payload:", data)
    return
  }

  // Atomic claim: muda pending→paid em uma única query. Se nada retornar,
  // já foi processado (idempotente) ou nunca esteve pending.
  const claim = await (
    client as unknown as {
      from: (n: string) => {
        update: (row: Record<string, unknown>) => {
          eq: (
            col: string,
            val: string
          ) => {
            eq: (
              col: string,
              val: string
            ) => {
              select: (cols: string) => Promise<{
                data: Array<{
                  id: string
                  buyer_id: string
                  event_id: string
                  total_cents: number
                  metadata: {
                    holders?: Array<{ name?: string; cpf?: string; lot_id?: string }>
                  } | null
                }> | null
                error: { message: string } | null
              }>
            }
          }
        }
      }
    }
  )
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", ourOrderId)
    .eq("status", "pending")
    .select("id, buyer_id, event_id, total_cents, metadata")

  if (claim.error) {
    throw new Error(`claim order: ${claim.error.message}`)
  }
  const claimed = (claim.data ?? [])[0]
  if (!claimed) {
    // já paga ou cancelada — idempotente, sem reprocessar.
    return
  }

  // Carrega itens
  const itemsRes = await (
    client as unknown as {
      from: (n: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string
          ) => Promise<{
            data: Array<{
              ticket_lot_id: string
              quantity: number
              ticket_lots: { is_half_price: boolean; event_id: string } | null
            }> | null
          }>
        }
      }
    }
  )
    .from("order_items")
    .select("ticket_lot_id, quantity, ticket_lots(is_half_price, event_id)")
    .eq("order_id", ourOrderId)

  const items = itemsRes.data ?? []
  const a = admin(client)

  // Gera tickets no Node com QR HMAC, em batch
  const holders = claimed.metadata?.holders ?? []
  let holderIdx = 0
  const ticketsToInsert: Array<Record<string, unknown>> = []
  for (const item of items) {
    const lot = Array.isArray(item.ticket_lots) ? item.ticket_lots[0] : item.ticket_lots
    for (let i = 0; i < item.quantity; i++) {
      const ticketId = crypto.randomUUID()
      const holder = holders[holderIdx++] ?? {}
      ticketsToInsert.push({
        id: ticketId,
        order_id: ourOrderId,
        ticket_lot_id: item.ticket_lot_id,
        event_id: lot?.event_id ?? claimed.event_id,
        qr_hash: generateQrPayload(ticketId, lot?.event_id ?? claimed.event_id),
        holder_name: holder.name ?? "Titular",
        holder_cpf: holder.cpf ?? "",
        is_half_price: lot?.is_half_price ?? false,
        status: "valid",
      })
    }
  }

  if (ticketsToInsert.length > 0) {
    const { error: insErr } = await client.from("tickets").insert(ticketsToInsert as never)
    if (insErr) {
      throw new Error(`tickets insert: ${insErr.message}`)
    }
  }

  // Move reserved → sold em cada lote
  for (const item of items) {
    // get current values
    const { data: lotRow } = await a
      .from("ticket_lots")
      .select("quantity_reserved, quantity_sold")
      .eq("id", item.ticket_lot_id).maybeSingle!()
    const lr = (lotRow ?? {}) as { quantity_reserved?: number; quantity_sold?: number }
    const reserved = Math.max((lr.quantity_reserved ?? 0) - item.quantity, 0)
    const sold = (lr.quantity_sold ?? 0) + item.quantity
    await a
      .from("ticket_lots")
      .update({ quantity_reserved: reserved, quantity_sold: sold })
      .eq("id", item.ticket_lot_id)
  }

  // Email de confirmação
  const { data: buyer } = await a.from("profiles").select("full_name").eq("id", claimed.buyer_id)
    .maybeSingle!()

  // pega email via auth.users (profiles.email pode não estar syncada em todos os casos)
  const userRes = await (
    client as unknown as {
      auth: {
        admin: {
          getUserById: (id: string) => Promise<{ data: { user: { email?: string } | null } | null }>
        }
      }
    }
  ).auth.admin.getUserById(claimed.buyer_id)
  const buyerEmail = userRes?.data?.user?.email
  if (!buyerEmail) return

  const { data: ev } = await a
    .from("events")
    .select("title, starts_at, venue_name, city, state")
    .eq("id", claimed.event_id).maybeSingle!()

  const evt = (ev ?? {}) as {
    title?: string
    starts_at?: string
    venue_name?: string | null
    city?: string | null
    state?: string | null
  }
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
  const bp = (buyer ?? {}) as { full_name?: string }

  await sendTicketConfirmation({
    to: buyerEmail,
    buyerName: bp.full_name || "Você",
    eventTitle: evt.title || "Seu evento",
    eventDate: evt.starts_at
      ? formatDate(evt.starts_at, { dateStyle: "full", timeStyle: "short" })
      : "",
    eventLocation: [evt.venue_name, evt.city, evt.state].filter(Boolean).join(" · ") || "",
    ticketCount: ticketsToInsert.length,
    totalCents: claimed.total_cents,
    orderUrl: `${appUrl}/minha-conta/ingressos/${ourOrderId}`,
    qrPayloads: ticketsToInsert.map((t) => t["qr_hash"] as string),
    userId: claimed.buyer_id,
    orderId: ourOrderId,
  })
}

async function handleOrderFailed(
  client: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>,
  evType: string
) {
  const a = admin(client)
  const ourOrderId = extractOurOrderId(data)
  if (!ourOrderId) return

  const { data: order } = await a.from("orders").select("id, status, metadata").eq("id", ourOrderId)
    .maybeSingle!()
  if (!order) return
  if (order["status"] === "paid") {
    // Já paga — não regredimos.
    return
  }

  // Libera estoque por item.
  const itemsRes = await (
    client as unknown as {
      from: (n: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string
          ) => Promise<{ data: Array<{ ticket_lot_id: string; quantity: number }> | null }>
        }
      }
    }
  )
    .from("order_items")
    .select("ticket_lot_id, quantity")
    .eq("order_id", ourOrderId)

  for (const item of itemsRes.data ?? []) {
    const { error: relErr } = await client.rpc("release_lot", {
      p_lot_id: item.ticket_lot_id,
      p_quantity: item.quantity,
    })
    if (relErr) console.error("[pagarme-webhook] release_lot failed:", relErr.message)
  }

  const newStatus = evType === "order.expired" ? "expired" : "canceled"
  await a.from("orders").update({ status: newStatus }).eq("id", ourOrderId)
}

async function handleChargeRefund(
  client: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>
) {
  const a = admin(client)
  const ourOrderId = extractOurOrderId(data)
  if (!ourOrderId) return
  // Marca como refunded — o fluxo formal de refund tem tela própria; aqui só reflete.
  await a.from("orders").update({ status: "refunded" }).eq("id", ourOrderId)
}

/**
 * Pagar.me v5 envia o `code` (nosso UUID) no order;
 * em eventos de charge, o `order_id` aponta pro pagarme_order_id e precisamos olhar metadata.
 */
function extractOurOrderId(data: Record<string, unknown>): string | null {
  const code = data["code"]
  if (typeof code === "string" && code.length >= 36) return code
  const metadata = data["metadata"] as Record<string, unknown> | undefined
  const axon = metadata?.["axon_order_id"]
  if (typeof axon === "string") return axon
  return null
}
