import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PageHeader } from "@/components/shared/PageHeader"
import { PremiumTicketCard, type PremiumTicketOrder } from "@/components/event/PremiumTicketCard"
import { EventCountdown } from "@/components/event/EventCountdown"
import { Ticket as TicketIcon, Calendar, History, Sparkles } from "lucide-react"

export const metadata: Metadata = { title: "Meus ingressos · AXON" }
export const dynamic = "force-dynamic"

interface RawOrderRow {
  id: string
  status: string
  total_cents: number
  paid_at: string | null
  created_at: string
  events:
    | {
        id: string
        title: string
        slug: string
        starts_at: string
        venue_name: string | null
        city: string | null
        state: string | null
        banner_url: string | null
        category: string | null
      }
    | Array<{
        id: string
        title: string
        slug: string
        starts_at: string
        venue_name: string | null
        city: string | null
        state: string | null
        banner_url: string | null
        category: string | null
      }>
    | null
  tickets: { id: string }[] | null
}

function toPremium(rows: RawOrderRow[]): PremiumTicketOrder[] {
  const out: PremiumTicketOrder[] = []
  for (const o of rows) {
    const ev = Array.isArray(o.events) ? o.events[0] : o.events
    if (!ev) continue
    out.push({
      id: o.id,
      status: o.status,
      total_cents: o.total_cents,
      paid_at: o.paid_at,
      created_at: o.created_at,
      event: {
        id: ev.id,
        title: ev.title,
        slug: ev.slug,
        starts_at: ev.starts_at,
        venue_name: ev.venue_name,
        city: ev.city,
        state: ev.state,
        banner_url: ev.banner_url,
        category: ev.category,
      },
      ticketCount: (o.tickets ?? []).length,
    })
  }
  return out
}

export default async function MeusIngressosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta/ingressos")

  // Usa adminClient pra bypass de RLS — ownership garantido via .eq("buyer_id", user.id).
  // Padrão do projeto pra páginas de detalhe de pedido.
  const admin = createAdminClient()
  const { data: orders } = await admin
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

  const all = toPremium((orders ?? []) as RawOrderRow[])
  const now = Date.now()

  const future = all
    .filter((o) => new Date(o.event.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.event.starts_at).getTime() - new Date(b.event.starts_at).getTime())
  const past = all
    .filter((o) => new Date(o.event.starts_at).getTime() < now)
    .sort((a, b) => new Date(b.event.starts_at).getTime() - new Date(a.event.starts_at).getTime())

  const next = future[0]

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        back={{ href: "/minha-conta", label: "Minha conta" }}
        eyebrow="Meus ingressos"
        title={
          all.length === 0
            ? "Você ainda não tem ingressos"
            : all.length === 1
              ? "1 ingresso"
              : `${all.length} ingressos`
        }
        description={
          all.length === 0
            ? "Compre um ingresso e ele aparece aqui — pronto pra escanear na porta."
            : "Tudo o que você comprou na AXON, num só lugar."
        }
      />

      {/* Hero: próximo evento com countdown */}
      {next && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "var(--pulse-deep)" }} />
            <h2
              className="text-[11px] font-semibold tracking-[0.14em] uppercase"
              style={{ color: "var(--mute)" }}
            >
              Próximo · {next.event.title}
            </h2>
          </div>
          <EventCountdown startsAt={next.event.starts_at} />
        </section>
      )}

      {all.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {future.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: "var(--pulse-deep)" }} />
                  <h2
                    className="text-sm font-semibold tracking-wider uppercase"
                    style={{ color: "var(--mute)" }}
                  >
                    Próximos ({future.length})
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
                {future.map((o) => (
                  <PremiumTicketCard key={o.id} order={o} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
                {past.map((o) => (
                  <PremiumTicketCard key={o.id} order={o} past />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-dashed p-10 text-center sm:p-14"
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
          Sem ingressos por aqui
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm" style={{ color: "var(--mute)" }}>
          Compre um ingresso e ele aparece aqui — com QR pronto e tudo.
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
