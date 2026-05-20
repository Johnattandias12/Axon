"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateQrPayload } from "@/lib/qr/hmac"
import { sendTicketConfirmation } from "@/lib/email/send"
import { formatDate } from "@/lib/utils"
import { validateCPF } from "@/lib/utils/validators"
import {
  getAffiliateByCode,
  insertReferral,
  updateAffiliateStats,
} from "@/lib/supabase/affiliates-admin"

const buyDemoSchema = z.object({
  lotId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(6),
  holderName: z.string().min(2, "Informe seu nome").max(120),
  holderCpf: z.string().refine((v) => validateCPF(v), "CPF inválido."),
  affiliateCode: z
    .string()
    .regex(/^[A-Z0-9]{4,12}$/)
    .optional()
    .or(z.literal("")),
  useWalletCredit: z.coerce.boolean().optional(),
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
  try {
    return await buyDemoInner(formData)
  } catch (err) {
    // redirect() lança NEXT_REDIRECT — deixa subir
    if (isRedirectError(err)) throw err
    console.error("[buyDemo] erro inesperado:", err)
    return {
      ok: false,
      error: "Não foi possível finalizar a compra. Tente novamente em alguns segundos.",
    }
  }
}

async function buyDemoInner(formData: FormData): Promise<BuyDemoState> {
  const parsed = buyDemoSchema.safeParse({
    lotId: formData.get("lotId"),
    quantity: formData.get("quantity"),
    holderName: String(formData.get("holderName") ?? "").trim(),
    holderCpf: String(formData.get("holderCpf") ?? "").replace(/\D/g, ""),
    affiliateCode: String(formData.get("affiliateCode") ?? "")
      .toUpperCase()
      .trim(),
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

  // Reserva atômica: condicional na disponibilidade atual no banco.
  // Se outra compra concorrente esgotou, .select() volta vazio e abortamos.
  const newSold = lot.quantity_sold + parsed.data.quantity
  const { data: lockedLot, error: lockErr } = await admin
    .from("ticket_lots")
    .update({ quantity_sold: newSold })
    .eq("id", lot.id)
    .lte("quantity_sold", lot.quantity_total - lot.quantity_reserved - parsed.data.quantity)
    .select("id, quantity_sold")
    .maybeSingle()

  if (lockErr) return { ok: false, error: lockErr.message }
  if (!lockedLot) {
    return { ok: false, error: "Ingressos esgotaram enquanto você finalizava. Tente outro lote." }
  }

  const subtotal = lot.price_cents * parsed.data.quantity
  const fee = Math.round(subtotal * 0.0899)
  const baseTotal = subtotal + fee

  // Aplica créditos AXON se o user pediu (não pode exceder o total)
  let creditApplied = 0
  if (parsed.data.useWalletCredit) {
    const profileUnsafe = admin as unknown as {
      from: (n: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string
          ) => {
            maybeSingle: () => Promise<{ data: { wallet_credit_cents?: number } | null }>
          }
        }
      }
    }
    const { data: pf } = await profileUnsafe
      .from("profiles")
      .select("wallet_credit_cents")
      .eq("id", user.id)
      .maybeSingle()
    const available = (pf?.wallet_credit_cents ?? 0) as number
    creditApplied = Math.min(available, baseTotal)
  }
  const total = baseTotal - creditApplied

  const rollbackStock = async () => {
    await admin.from("ticket_lots").update({ quantity_sold: lot.quantity_sold }).eq("id", lot.id)
  }
  const rollbackCredit = async () => {
    if (creditApplied === 0) return
    const updUnsafe = admin as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ error: { message: string } | null }>
    }
    // best-effort: re-credita
    await updUnsafe.rpc("increment_wallet_credit", {
      p_user_id: user.id,
      p_amount: creditApplied,
    })
  }

  // Debita o crédito ANTES de criar a order (se o user pediu usar)
  if (creditApplied > 0) {
    const updUnsafe = admin as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ error: { message: string } | null }>
    }
    const { error: debitErr } = await updUnsafe.rpc("debit_wallet_credit", {
      p_user_id: user.id,
      p_amount: creditApplied,
    })
    if (debitErr) {
      await rollbackStock()
      return {
        ok: false,
        error: "Não foi possível aplicar seu crédito. Tente novamente.",
      }
    }
  }

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
      paid_at: null,
      metadata: {
        demo: true,
        source: "buy_demo",
        ...(creditApplied > 0 ? { credit_applied_cents: creditApplied } : {}),
      },
    })
    .select("id")
    .single()

  if (orderErr || !order) {
    await rollbackStock()
    await rollbackCredit()
    return { ok: false, error: orderErr?.message ?? "Falha ao criar pedido." }
  }

  const { error: orderItemsErr } = await admin.from("order_items").insert({
    order_id: order.id,
    ticket_lot_id: lot.id,
    quantity: parsed.data.quantity,
    unit_price_cents: lot.price_cents,
  })

  if (orderItemsErr) {
    await admin.from("orders").delete().eq("id", order.id)
    await rollbackStock()
    return { ok: false, error: orderItemsErr.message }
  }

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
    await admin.from("order_items").delete().eq("order_id", order.id)
    await admin.from("orders").delete().eq("id", order.id)
    await rollbackStock()
    return { ok: false, error: ticketsErr.message }
  }

  // Credita comissão de afiliado (silencioso se a tabela ainda não existir)
  if (parsed.data.affiliateCode) {
    try {
      const affiliate = await getAffiliateByCode(admin, parsed.data.affiliateCode)
      // Não credita auto-indicação
      if (affiliate && affiliate.user_id !== user.id) {
        const commissionCents = Math.round((subtotal * Number(affiliate.commission_pct)) / 100)
        const { error: refErr } = await insertReferral(admin, {
          affiliate_id: affiliate.id,
          order_id: order.id,
          event_id: event.id,
          commission_cents: commissionCents,
          status: "pending",
        })
        if (!refErr) {
          await updateAffiliateStats(admin, affiliate.id, {
            total_referrals: affiliate.total_referrals + 1,
            total_commission_cents: affiliate.total_commission_cents + commissionCents,
          })
        }
      }
    } catch (affErr) {
      // Migração 008 pode não estar aplicada. Loga mas não bloqueia a compra.
      console.error("[buyDemo] afiliado falhou (compra OK):", affErr)
    }
  }

  revalidatePath("/minha-conta", "layout")
  redirect(`/checkout/${order.id}`)
}

export async function approveDemoOrder(orderId: string) {
  const supabase = await createClient()

  // Garante que a order realmente é demo para evitar fraudes em orders reais
  const { data: order, error: findErr } = await supabase
    .from("orders")
    .select("status, metadata")
    .eq("id", orderId)
    .single()

  if (findErr || !order) {
    return { ok: false, error: "Pedido não encontrado." }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isDemo = (order.metadata as any)?.demo === true
  if (!isDemo) {
    return { ok: false, error: "Este pedido não é simulado e não pode ser aprovado manualmente." }
  }

  const { error: updErr } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)

  if (updErr) {
    return { ok: false, error: updErr.message }
  }

  // Envia email de confirmação para o fluxo demo pós-aprovação
  try {
    const admin = createAdminClient()
    const { data: fullOrder } = await admin
      .from("orders")
      .select("id, total_cents, event_id, buyer_id")
      .eq("id", orderId)
      .single()

    if (fullOrder) {
      const [{ data: event }, { data: profile }, { data: tickets }, { data: authUserRes }] =
        await Promise.all([
          admin
            .from("events")
            .select("title, starts_at, venue_name, city, state")
            .eq("id", fullOrder.event_id)
            .single(),
          admin.from("profiles").select("full_name").eq("id", fullOrder.buyer_id).single(),
          admin.from("tickets").select("qr_hash").eq("order_id", orderId),
          admin.auth.admin.getUserById(fullOrder.buyer_id),
        ])

      const email = authUserRes?.user?.email

      if (email && event && tickets) {
        const appUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
        void sendTicketConfirmation({
          to: email,
          buyerName: profile?.full_name || "Cliente",
          eventTitle: event.title,
          eventDate: formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" }),
          eventLocation:
            [event.venue_name, event.city, event.state].filter(Boolean).join(" · ") || "",
          ticketCount: tickets.length,
          totalCents: fullOrder.total_cents,
          orderUrl: `${appUrl}/minha-conta/ingressos/${orderId}`,
          qrPayloads: tickets.map((t) => t.qr_hash),
        })
      }
    }
  } catch (emailErr) {
    console.error("[approveDemoOrder] erro ao enviar email:", emailErr)
  }

  revalidatePath(`/checkout/${orderId}`)
  revalidatePath("/minha-conta")
  return { ok: true }
}
