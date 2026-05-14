import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, Ticket, Calendar } from "lucide-react"

export const metadata: Metadata = { title: "Painel do Organizador" }

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  cancelled: "Cancelado",
  finished: "Encerrado",
}

const statusColor: Record<string, { bg: string; text: string }> = {
  draft: { bg: "var(--paper-soft)", text: "var(--mute)" },
  published: { bg: "var(--success-soft)", text: "var(--success)" },
  cancelled: { bg: "var(--danger-soft)", text: "var(--danger)" },
  finished: { bg: "var(--ink-3)", text: "var(--paper)" },
}

export default async function OrganizadorDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/organizador")

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id, trade_name, legal_name, kyc_status")
    .eq("user_id", user.id)
    .single()

  if (!organizer) redirect("/organizador/comecar")

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, slug, status, starts_at, category, ticket_lots ( quantity_total, quantity_sold )"
    )
    .eq("organizer_id", organizer.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const totalSold = (events ?? []).reduce(
    (sum, e) => sum + (e.ticket_lots ?? []).reduce((s, l) => s + l.quantity_sold, 0),
    0
  )
  const publishedCount = (events ?? []).filter((e) => e.status === "published").length

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            {organizer.trade_name ?? organizer.legal_name}
          </h1>
          {organizer.kyc_status === "pending" && (
            <p className="mt-1 text-sm" style={{ color: "var(--warning)" }}>
              KYC pendente — seus eventos ficam em rascunho até aprovação.
            </p>
          )}
        </div>
        <Button
          render={<Link href="/organizador/eventos/novo" />}
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)", fontWeight: 600 }}
        >
          <Plus size={16} className="mr-1.5" />
          Novo evento
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard icon={<Calendar size={18} />} label="Eventos publicados" value={publishedCount} />
        <KpiCard icon={<Ticket size={18} />} label="Ingressos vendidos" value={totalSold} />
        <KpiCard
          icon={<TrendingUp size={18} />}
          label="Total de eventos"
          value={(events ?? []).length}
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* Lista de eventos */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Seus eventos
          </h2>
          <Link href="/organizador/eventos" className="text-sm" style={{ color: "var(--mute)" }}>
            Ver todos →
          </Link>
        </div>

        {!events || events.length === 0 ? (
          <div
            className="rounded-xl border border-dashed p-12 text-center"
            style={{ borderColor: "var(--rule)" }}
          >
            <p className="text-sm" style={{ color: "var(--mute)" }}>
              Nenhum evento criado ainda.
            </p>
            <Button
              render={<Link href="/organizador/eventos/novo" />}
              size="sm"
              className="mt-4"
              style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
            >
              Criar primeiro evento
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const sold = (event.ticket_lots ?? []).reduce((s, l) => s + l.quantity_sold, 0)
              const total = (event.ticket_lots ?? []).reduce((s, l) => s + l.quantity_total, 0)
              const colors = statusColor[event.status] ?? {
                bg: "var(--paper-soft)",
                text: "var(--mute)",
              }

              return (
                <Link
                  key={event.id}
                  href={`/organizador/eventos/${event.id}`}
                  className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-black/2"
                  style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
                      {formatDate(event.starts_at, { dateStyle: "medium" })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs" style={{ color: "var(--mute)" }}>
                      {sold}/{total} vendidos
                    </p>
                  </div>
                  <Badge
                    className="shrink-0 text-xs"
                    style={{ backgroundColor: colors.bg, color: colors.text, border: "none" }}
                  >
                    {statusLabel[event.status] ?? event.status}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode
  label: string
  value: number
  className?: string
}) {
  return (
    <div
      className={`space-y-2 rounded-xl border p-4 ${className ?? ""}`}
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div className="flex items-center gap-2" style={{ color: "var(--mute)" }}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p
        className="font-mono text-2xl font-bold"
        style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
      >
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  )
}
