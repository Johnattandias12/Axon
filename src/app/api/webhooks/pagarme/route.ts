import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyPagarmeSignature } from "@/lib/payments/pagarme/webhook-verify"
import { PagarmeWebhookEventSchema, isHandledEvent } from "@/lib/payments/pagarme/types"

// Cast para webhook_events — tabela existe no banco mas o types/supabase.ts
// foi gerado parcialmente e não cobre ela ainda. Quando rodar `pnpm db:types`
// dá pra remover este wrapper.
function webhookEventsTable(client: SupabaseClient) {
  return (
    client as unknown as {
      from: (n: string) => ReturnType<SupabaseClient["from"]>
    }
  ).from("webhook_events")
}

/**
 * Webhook Pagar.me v5.
 *
 * Garantias:
 *   - HMAC-SHA256 verify obrigatório (header X-Hub-Signature)
 *   - Idempotência por event.id (unique key em webhook_events)
 *   - Idempotência da confirm_order (SQL function checa se status já é 'paid')
 *   - Sempre 200 quando reconhecido (evita reentries do Pagar.me)
 *
 * Eventos processados:
 *   order.paid              -> confirm_order RPC (gera tickets + estoque)
 *   order.payment_failed    -> marca order='failed', libera reserva
 *   order.canceled          -> idem failed
 *   order.expired           -> idem failed
 *   charge.refunded         -> marca order='refunded' (refunds table TODO)
 *   charge.chargedback      -> flag fraud (TODO)
 *
 * Configurar no painel Pagar.me:
 *   URL  https://<domain>/api/webhooks/pagarme
 *   HMAC PAGARME_WEBHOOK_SECRET (env)
 *   Eventos: order.*, charge.refunded, charge.chargedback
 */
export async function POST(req: Request) {
  const secret = process.env["PAGARME_WEBHOOK_SECRET"]
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get("x-hub-signature")

  if (!verifyPagarmeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const ev = PagarmeWebhookEventSchema.safeParse(parsed)
  if (!ev.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }
  const event = ev.data

  const admin = createAdminClient()

  // Idempotência: insere event_id em webhook_events. Se já existe (unique), retorna 200.
  const { error: insertErr } = await webhookEventsTable(admin).insert({
    id: event.id,
    gateway: "pagarme",
    type: event.type,
    payload: parsed as Record<string, unknown>,
  })

  if (insertErr) {
    // Duplicate key = já processamos. Pagar.me retry frequente — responder 200.
    if (insertErr.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 })
    }
    console.error("[pagarme webhook] insert event failed", insertErr)
    // Não bloqueia o processamento — Pagar.me pode reenviar.
  }

  // Tipos não-tratados ainda registram no banco (auditoria) mas não disparam ação.
  if (!isHandledEvent(event.type)) {
    return NextResponse.json({ ok: true, ignored: event.type }, { status: 200 })
  }

  // Resolve order_id local — vem em data.code (que setamos no createPagarmePixOrder)
  // OU em data.metadata.axon_order_id (fallback)
  const data = event.data as {
    code?: string
    id?: string
    metadata?: { axon_order_id?: string }
  }
  const ourOrderId = data.code ?? data.metadata?.axon_order_id ?? null

  if (!ourOrderId) {
    console.error("[pagarme webhook] event sem axon_order_id", event.id, event.type)
    await webhookEventsTable(admin).update({ error: "no_axon_order_id" }).eq("id", event.id)
    return NextResponse.json({ ok: true, warn: "no_axon_order_id" }, { status: 200 })
  }

  try {
    switch (event.type) {
      case "order.paid":
      case "charge.paid": {
        // confirm_order é idempotente — se status já é 'paid' retorna sem fazer nada
        const { error } = await admin.rpc("confirm_order", { p_order_id: ourOrderId })
        if (error) throw error
        break
      }
      case "order.payment_failed":
      case "order.canceled":
      case "order.expired": {
        await admin
          .from("orders")
          .update({
            status: event.type === "order.canceled" ? "cancelled" : "expired",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", ourOrderId)
          .eq("status", "pending")
        // expire_pending_orders cron libera os lots, mas chamamos release_lot
        // pra cada item agora pra acelerar.
        const { data: items } = await admin
          .from("order_items")
          .select("ticket_lot_id, quantity")
          .eq("order_id", ourOrderId)
        for (const it of items ?? []) {
          await admin.rpc("release_lot", {
            p_lot_id: it.ticket_lot_id,
            p_quantity: it.quantity,
          })
        }
        break
      }
      case "charge.refunded": {
        await admin.from("orders").update({ status: "refunded" }).eq("id", ourOrderId)
        // refunds table — registrar aqui no futuro
        break
      }
      case "charge.chargedback": {
        await admin.from("orders").update({ status: "cancelled" }).eq("id", ourOrderId)
        // fraud_flags — registrar aqui no futuro
        break
      }
    }

    await webhookEventsTable(admin)
      .update({ processed_at: new Date().toISOString() })
      .eq("id", event.id)

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[pagarme webhook] processing failed", event.id, msg)
    await webhookEventsTable(admin)
      .update({ error: msg.slice(0, 500) })
      .eq("id", event.id)
    // Retorna 500 pra Pagar.me retentar
    return NextResponse.json({ error: "processing_failed", message: msg }, { status: 500 })
  }
}
