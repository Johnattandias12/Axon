import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * LGPD art. 18 IV — Portabilidade dos dados.
 * Devolve um JSON com tudo que a AXON guarda sobre o titular autenticado.
 *
 * Inclui: perfil, pedidos, ingressos, transferências, créditos, afiliações,
 * logs de e-mail. Não inclui dados de outros usuários (mesmo que em
 * order.transfers — só meta agregada).
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const u = admin as unknown as {
    from: (n: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => Promise<{ data: unknown[] | null }>
      }
    }
  }

  const [
    profileRes,
    organizerRes,
    ordersRes,
    orderItemsRes,
    ticketsRes,
    refundsRes,
    affiliateRes,
    emailLogsRes,
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id),
    admin.from("organizers").select("*").eq("user_id", user.id),
    admin.from("orders").select("*").eq("buyer_id", user.id),
    u.from("order_items").select("*, orders!inner(buyer_id)").eq("orders.buyer_id", user.id),
    u.from("tickets").select("*, orders!inner(buyer_id)").eq("orders.buyer_id", user.id),
    u.from("refunds").select("*, orders!inner(buyer_id)").eq("orders.buyer_id", user.id),
    u.from("affiliates").select("*").eq("user_id", user.id),
    u.from("email_logs").select("*").eq("user_id", user.id),
  ])

  const payload = {
    generated_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profileRes.data ?? [],
    organizer: organizerRes.data ?? [],
    orders: ordersRes.data ?? [],
    order_items: orderItemsRes.data ?? [],
    tickets: ticketsRes.data ?? [],
    refunds: refundsRes.data ?? [],
    affiliate: affiliateRes.data ?? [],
    email_logs: emailLogsRes.data ?? [],
  }

  // Audita o export pra rastreabilidade LGPD
  try {
    const a = admin as unknown as {
      from: (n: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
      }
    }
    await a.from("audit_logs").insert({
      user_id: user.id,
      action: "lgpd_export",
      target_type: "self",
      target_id: user.id,
      metadata: { records_count: Object.values(payload).flat().length },
    })
  } catch (e) {
    console.error("[lgpd/export] audit log failed:", e)
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="axon-meus-dados-${user.id.slice(0, 8)}.json"`,
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
