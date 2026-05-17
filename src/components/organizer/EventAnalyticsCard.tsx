import { createAdminClient } from "@/lib/supabase/admin"
import { centsToBRL } from "@/lib/utils"
import { TrendingUp, Users, Ticket, BarChart3, Download } from "lucide-react"
import Link from "next/link"

interface Props {
  eventId: string
}

/**
 * Painel de analytics do evento (server component).
 * Mostra: receita bruta, ingressos vendidos, ticket médio, check-ins,
 * + barras por tipo de ingresso. Botões pra exportar CSV de vendas e check-ins.
 */
export async function EventAnalyticsCard({ eventId }: Props) {
  const admin = createAdminClient()

  const [{ data: orders }, { data: checkIns }, { data: tickets }] = await Promise.all([
    admin
      .from("orders")
      .select("id, total_cents, status, paid_at")
      .eq("event_id", eventId)
      .eq("status", "paid"),
    admin.from("check_ins").select("id, scanned_at, result").eq("event_id", eventId),
    admin
      .from("tickets")
      .select("id, status, ticket_lot_id, ticket_lots(name, price_cents, ticket_types(name))")
      .eq("event_id", eventId),
  ])

  const paidOrders = orders ?? []
  const allTickets = tickets ?? []
  const allCheckIns = checkIns ?? []

  const grossRevenueCents = paidOrders.reduce((s, o) => s + o.total_cents, 0)
  const ticketsSold = allTickets.filter(
    (t) => t.status !== "cancelled" && t.status !== "refunded"
  ).length
  const avgTicketCents = ticketsSold > 0 ? Math.round(grossRevenueCents / ticketsSold) : 0
  const checkedIn = allCheckIns.filter((c) => c.result === "valid").length
  const checkInRate = ticketsSold > 0 ? Math.round((checkedIn / ticketsSold) * 100) : 0

  // Por tipo
  const byType = new Map<string, { count: number; revenue: number }>()
  for (const t of allTickets) {
    if (t.status === "cancelled" || t.status === "refunded") continue
    const lot = Array.isArray(t.ticket_lots) ? t.ticket_lots[0] : t.ticket_lots
    const tt = lot && Array.isArray(lot.ticket_types) ? lot.ticket_types[0] : lot?.ticket_types
    const name = tt?.name ?? "Sem categoria"
    const price = lot?.price_cents ?? 0
    const prev = byType.get(name) ?? { count: 0, revenue: 0 }
    byType.set(name, { count: prev.count + 1, revenue: prev.revenue + price })
  }
  const byTypeArr = Array.from(byType.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
  const maxRevenue = Math.max(1, ...byTypeArr.map((b) => b.revenue))

  return (
    <section
      className="space-y-5 rounded-2xl border p-5"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} style={{ color: "var(--pulse-deep)" }} />
          <h2
            className="text-base font-semibold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Analytics
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportLink eventId={eventId} type="sales" label="CSV Vendas" />
          <ExportLink eventId={eventId} type="checkins" label="CSV Check-ins" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={<TrendingUp size={13} />}
          label="Receita bruta"
          value={centsToBRL(grossRevenueCents)}
          accent="var(--pulse-deep)"
        />
        <Stat icon={<Ticket size={13} />} label="Vendidos" value={String(ticketsSold)} />
        <Stat
          icon={<BarChart3 size={13} />}
          label="Ticket médio"
          value={centsToBRL(avgTicketCents)}
        />
        <Stat
          icon={<Users size={13} />}
          label="Check-in"
          value={`${checkedIn} · ${checkInRate}%`}
          accent={checkInRate >= 70 ? "var(--success)" : undefined}
        />
      </div>

      {byTypeArr.length > 0 && (
        <div className="space-y-2.5">
          <p
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Receita por tipo
          </p>
          <div className="space-y-2">
            {byTypeArr.map((b) => {
              const pct = Math.round((b.revenue / maxRevenue) * 100)
              return (
                <div key={b.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: "var(--ink)" }}>{b.name}</span>
                    <span style={{ color: "var(--mute)" }}>
                      {b.count} ·{" "}
                      <strong style={{ color: "var(--ink)" }}>{centsToBRL(b.revenue)}</strong>
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ backgroundColor: "var(--paper-soft)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, var(--pulse), var(--pulse-deep))",
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: string
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
    >
      <div className="flex items-center gap-1.5" style={{ color: "var(--mute)" }}>
        {icon}
        <p className="text-[10px] font-semibold tracking-wider uppercase">{label}</p>
      </div>
      <p
        className="mt-1.5 font-mono text-lg font-bold tabular-nums"
        style={{ color: accent ?? "var(--ink)", letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
    </div>
  )
}

function ExportLink({
  eventId,
  type,
  label,
}: {
  eventId: string
  type: "sales" | "checkins"
  label: string
}) {
  return (
    <Link
      href={`/api/organizador/eventos/${eventId}/export?type=${type}`}
      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-black/5"
      style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
      prefetch={false}
    >
      <Download size={11} />
      {label}
    </Link>
  )
}
