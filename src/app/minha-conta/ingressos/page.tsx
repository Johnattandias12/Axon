import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/PageHeader"
import { OrdersGrid, type OrderRow } from "@/components/shared/OrdersGrid"
import { Ticket as TicketIcon, Calendar, History } from "lucide-react"

export const metadata: Metadata = { title: "Meus ingressos · AXON" }
export const dynamic = "force-dynamic"

export default async function MeusIngressosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta/ingressos")

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, status, total_cents, paid_at, created_at,
       events(id, title, slug, starts_at, venue_name, city, state, banner_url, category),
       tickets(id)`
    )
    .eq("buyer_id", user.id)
    .in("status", ["paid", "pending"])
    .order("created_at", { ascending: false })
    .limit(200)

  const allOrders = (orders ?? []) as OrderRow[]
  const nowIso = new Date().toISOString()

  const future = allOrders.filter((o) => {
    const e = Array.isArray(o.events) ? o.events[0] : o.events
    return e && new Date(e.starts_at) >= new Date(nowIso)
  })
  const past = allOrders.filter((o) => {
    const e = Array.isArray(o.events) ? o.events[0] : o.events
    return e && new Date(e.starts_at) < new Date(nowIso)
  })

  return (
    <div className="space-y-8">
      <PageHeader
        back={{ href: "/minha-conta", label: "Minha conta" }}
        eyebrow="Meus ingressos"
        title={`${allOrders.length} ${allOrders.length === 1 ? "pedido" : "pedidos"}`}
        description="Todos os ingressos que você comprou na AXON, em um só lugar."
      />

      {allOrders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: "var(--pulse-deep)" }} />
              <h2
                className="text-sm font-semibold tracking-wider uppercase"
                style={{ color: "var(--mute)" }}
              >
                Próximos ({future.length})
              </h2>
            </div>
            {future.length === 0 ? (
              <p
                className="rounded-2xl border border-dashed p-6 text-center text-sm"
                style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
              >
                Sem eventos próximos. Que tal explorar a agenda?
              </p>
            ) : (
              <OrdersGrid orders={future} />
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <History size={14} style={{ color: "var(--mute)" }} />
              <h2
                className="text-sm font-semibold tracking-wider uppercase"
                style={{ color: "var(--mute)" }}
              >
                Histórico ({past.length})
              </h2>
            </div>
            {past.length === 0 ? (
              <p
                className="rounded-2xl border border-dashed p-6 text-center text-sm"
                style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
              >
                Você ainda não foi a nenhum evento. Seu histórico aparece aqui depois.
              </p>
            ) : (
              <OrdersGrid orders={past} past />
            )}
          </section>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-dashed p-14 text-center"
      style={{ borderColor: "var(--rule-strong)" }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: "var(--pulse)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
        >
          <TicketIcon size={26} />
        </div>
        <p
          className="mt-4 text-lg font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
        >
          Nenhum ingresso ainda
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm" style={{ color: "var(--mute)" }}>
          Quando você comprar um ingresso, ele aparece aqui. Pronto pra escanear na porta.
        </p>
        <Link
          href="/eventos"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.03]"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          Explorar eventos
        </Link>
      </div>
    </div>
  )
}
