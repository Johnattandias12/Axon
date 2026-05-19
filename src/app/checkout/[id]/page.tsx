import { redirect } from "next/navigation"
import { CheckoutClient } from "./CheckoutClient"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { SiteHeader } from "@/components/shared/SiteHeader"
import { getPagarmeOrder } from "@/lib/payments/pagarme/orders"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CheckoutPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar?redirectTo=/checkout/${id}`)

  const admin = createAdminClient()

  const orderRes = await admin
    .from("orders")
    .select(
      "id, buyer_id, status, subtotal_cents, service_fee_cents, total_cents, gateway_order_id, metadata, event_id"
    )
    .eq("id", id)
    .maybeSingle()

  const order = orderRes.data as {
    id: string
    buyer_id: string
    status: string
    subtotal_cents: number
    service_fee_cents: number
    total_cents: number
    gateway_order_id: string | null
    metadata: { pix_qr?: string; pix_expires_at?: string; demo?: boolean } | null
    event_id: string
  } | null

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--paper)" }}>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-white">Pedido não encontrado</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--mute)" }}>
            Este pedido não existe ou já foi removido.
          </p>
        </main>
      </div>
    )
  }

  if (order.buyer_id !== user.id) redirect("/minha-conta")

  // Pago — manda direto pro detalhe do ingresso
  if (order.status === "paid") {
    redirect(`/minha-conta/ingressos/${id}`)
  }
  if (order.status === "canceled" || order.status === "expired" || order.status === "refunded") {
    return (
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--paper)" }}>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-white">Pedido {order.status}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--mute)" }}>
            Este pedido foi {order.status}. Refaça a compra pra garantir seu ingresso.
          </p>
        </main>
      </div>
    )
  }

  // Tenta obter o PIX QR: prioriza metadata.pix_qr (saved by createPixChargeAction).
  // Fallback: consulta Pagar.me diretamente se gateway_order_id existir.
  let pixPayload: string | null = order.metadata?.pix_qr ?? null
  let pixExpiresAt: string | null = order.metadata?.pix_expires_at ?? null

  if (!pixPayload && order.gateway_order_id && process.env["PAGARME_API_KEY"]) {
    try {
      const pmo = await getPagarmeOrder(order.gateway_order_id)
      const charge = (pmo.charges ?? [])[0]
      const last = charge?.last_transaction
      if (last?.qr_code) pixPayload = last.qr_code
      if (last?.expires_at) pixExpiresAt = last.expires_at
    } catch (e) {
      console.error("[checkout] getPagarmeOrder failed:", e)
    }
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--paper)" }}>
      <SiteHeader />
      <main className="flex-1">
        <CheckoutClient
          orderId={id}
          subtotal={order.subtotal_cents}
          fee={order.service_fee_cents}
          total={order.total_cents}
          pixPayload={pixPayload}
          pixExpiresAt={pixExpiresAt}
          isDemo={!order.gateway_order_id}
        />
      </main>
    </div>
  )
}
