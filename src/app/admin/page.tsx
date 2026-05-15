import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { formatDate, centsToBRL } from "@/lib/utils"
import {
  Users,
  Calendar,
  Building2,
  Ticket,
  TrendingUp,
  Plus,
  Activity,
  CircleDot,
  ArrowUpRight,
  ScanLine,
} from "lucide-react"

export const metadata: Metadata = { title: "Dashboard · AXON Admin" }

const categoryLabel: Record<string, string> = {
  show: "Shows",
  esporte: "Esportes",
  religioso: "Religioso",
  curso: "Cursos",
  outro: "Outros",
}

const categoryColor: Record<string, string> = {
  show: "var(--pulse)",
  esporte: "var(--info)",
  religioso: "var(--warning)",
  curso: "var(--success)",
  outro: "var(--mute)",
}

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  cancelled: "Cancelado",
  finished: "Encerrado",
}

const statusColor: Record<string, string> = {
  draft: "var(--mute)",
  published: "var(--success)",
  cancelled: "var(--danger)",
  finished: "var(--ink-3)",
}

interface RecentEvent {
  id: string
  title: string
  slug: string
  banner_url: string | null
  status: string
  city: string | null
  state: string | null
  category: string
  starts_at: string
  capacity: number
  ticket_lots: Array<{ quantity_total: number; quantity_sold: number; price_cents: number }> | null
}

export default async function AdminPage() {
  const supabase = await createClient()

  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)

  const [
    { count: totalUsers },
    { count: totalEvents },
    { count: totalOrganizers },
    { count: publishedEvents },
    { count: totalTickets },
    { count: totalCheckins },
    { data: recentEvents },
    { data: paidOrders },
    { data: eventsForChart },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("organizers").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "valid"),
    supabase.from("check_ins").select("*", { count: "exact", head: true }).eq("result", "valid"),
    supabase
      .from("events")
      .select(
        "id, title, slug, banner_url, status, city, state, category, starts_at, capacity, ticket_lots(quantity_total, quantity_sold, price_cents)"
      )
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("orders").select("total_cents, service_fee_cents").eq("status", "paid"),
    supabase
      .from("events")
      .select("category, status, created_at")
      .gte("created_at", since30.toISOString()),
  ])

  const events = (recentEvents ?? []) as RecentEvent[]

  const totalRevenueCents = (paidOrders ?? []).reduce((s, o) => s + (o.total_cents ?? 0), 0)
  const platformFeeCents = (paidOrders ?? []).reduce((s, o) => s + (o.service_fee_cents ?? 0), 0)

  // Distribuição por categoria
  const categoryDist: Record<string, number> = {}
  for (const ev of eventsForChart ?? []) {
    const k = ev.category as string
    categoryDist[k] = (categoryDist[k] ?? 0) + 1
  }
  const categoryEntries = Object.entries(categoryDist)
  const totalCat = categoryEntries.reduce((s, [, v]) => s + v, 0) || 1

  // Sparkline: eventos criados por dia nos últimos 30 dias
  const dayCounts: number[] = new Array(30).fill(0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (const ev of eventsForChart ?? []) {
    const d = new Date(ev.created_at)
    d.setHours(0, 0, 0, 0)
    const idx = 29 - Math.floor((today.getTime() - d.getTime()) / 86400000)
    if (idx >= 0 && idx < 30) {
      dayCounts[idx] = (dayCounts[idx] ?? 0) + 1
    }
  }
  const sparkMax = Math.max(...dayCounts, 1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.04em" }}
          >
            Bem-vindo de volta
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--mute)" }}>
            Visão completa da plataforma AXON ·{" "}
            {formatDate(new Date().toISOString(), { dateStyle: "long" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/organizador/eventos/novo"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            <Plus size={16} />
            Novo evento
          </Link>
          <Link
            href="/eventos"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5"
            style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
          >
            Ver site público
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={<Users size={16} />}
          label="Usuários"
          value={totalUsers ?? 0}
          href="/admin/usuarios"
          accent="var(--info)"
        />
        <KpiCard
          icon={<Building2 size={16} />}
          label="Organizadores"
          value={totalOrganizers ?? 0}
          href="/admin/organizadores"
          accent="var(--warning)"
        />
        <KpiCard
          icon={<Calendar size={16} />}
          label="Eventos publicados"
          value={publishedEvents ?? 0}
          secondary={`${totalEvents ?? 0} no total`}
          href="/admin/eventos"
          accent="var(--success)"
        />
        <KpiCard
          icon={<Ticket size={16} />}
          label="Ingressos vendidos"
          value={totalTickets ?? 0}
          secondary={`${totalCheckins ?? 0} check-ins`}
          href="/admin/eventos"
          accent="var(--pulse)"
        />
      </div>

      {/* Receita + Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Receita */}
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div className="flex items-center gap-2" style={{ color: "var(--mute)" }}>
            <TrendingUp size={16} />
            <span className="text-xs font-medium tracking-wider uppercase">GMV</span>
          </div>
          <p
            className="mt-3 font-mono text-3xl font-bold"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            {centsToBRL(totalRevenueCents)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--mute)" }}>
            <CircleDot size={10} style={{ color: "var(--success)" }} />
            <span>Taxa AXON: {centsToBRL(platformFeeCents)}</span>
          </div>
          <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--rule)" }}>
            <p className="mb-2 text-xs" style={{ color: "var(--mute)" }}>
              Eventos criados · 30 dias
            </p>
            <Sparkline values={dayCounts} max={sparkMax} />
          </div>
        </div>

        {/* Donut categoria */}
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div className="flex items-center gap-2" style={{ color: "var(--mute)" }}>
            <Activity size={16} />
            <span className="text-xs font-medium tracking-wider uppercase">Categorias</span>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <Donut entries={categoryEntries} total={totalCat} />
            <div className="space-y-1.5">
              {categoryEntries.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--mute)" }}>
                  Sem dados
                </p>
              ) : (
                categoryEntries.map(([cat, val]) => (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: categoryColor[cat] ?? "var(--mute)" }}
                    />
                    <span style={{ color: "var(--ink)" }}>{categoryLabel[cat] ?? cat}</span>
                    <span style={{ color: "var(--mute)" }}>{val}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div
          className="space-y-2 rounded-2xl border p-6"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div className="flex items-center gap-2" style={{ color: "var(--mute)" }}>
            <CircleDot size={16} />
            <span className="text-xs font-medium tracking-wider uppercase">Atalhos</span>
          </div>
          <QuickAction
            href="/organizador/eventos/novo"
            label="Criar evento"
            icon={<Plus size={14} />}
          />
          <QuickAction
            href="/admin/eventos"
            label="Gerenciar eventos"
            icon={<Calendar size={14} />}
          />
          <QuickAction
            href="/admin/usuarios"
            label="Gerenciar usuários"
            icon={<Users size={14} />}
          />
          <QuickAction
            href="/admin/organizadores"
            label="Aprovar organizadores"
            icon={<Building2 size={14} />}
          />
          <QuickAction href="/scan" label="Abrir scanner" icon={<ScanLine size={14} />} />
        </div>
      </div>

      {/* Eventos recentes */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              Eventos recentes
            </h2>
            <p className="text-xs" style={{ color: "var(--mute)" }}>
              Últimos 6 cadastrados
            </p>
          </div>
          <Link
            href="/admin/eventos"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--mute)" }}
          >
            Ver todos →
          </Link>
        </div>

        {events.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed p-12 text-center"
            style={{ borderColor: "var(--rule)" }}
          >
            <Calendar size={28} className="mx-auto" style={{ color: "var(--mute-2)" }} />
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--ink)" }}>
              Nenhum evento criado ainda
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
              Crie o primeiro evento para começar
            </p>
            <Link
              href="/organizador/eventos/novo"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              <Plus size={14} />
              Criar evento
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => {
              const sold = (event.ticket_lots ?? []).reduce((s, l) => s + l.quantity_sold, 0)
              const total = (event.ticket_lots ?? []).reduce((s, l) => s + l.quantity_total, 0)
              const pct = total > 0 ? Math.round((sold / total) * 100) : 0
              const minPrice =
                event.ticket_lots && event.ticket_lots.length > 0
                  ? Math.min(...event.ticket_lots.map((l) => l.price_cents))
                  : null
              return (
                <Link
                  key={event.id}
                  href={`/admin/eventos/${event.id}`}
                  className="group overflow-hidden rounded-2xl border transition-all hover:shadow-[var(--shadow-md)]"
                  style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
                >
                  <div
                    className="relative aspect-[16/9] w-full overflow-hidden"
                    style={{ backgroundColor: "var(--paper-soft)" }}
                  >
                    {event.banner_url ? (
                      <Image
                        src={event.banner_url}
                        alt={event.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <EventPattern category={event.category} />
                    )}
                    <div className="absolute top-3 right-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--paper-pure) 75%, transparent)",
                          color: statusColor[event.status] ?? "var(--mute)",
                        }}
                      >
                        {statusLabel[event.status] ?? event.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div>
                      <p
                        className="line-clamp-1 text-sm font-semibold"
                        style={{ color: "var(--ink)" }}
                      >
                        {event.title}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
                        {formatDate(event.starts_at, { dateStyle: "medium" })}
                        {event.city ? ` · ${event.city}` : ""}
                      </p>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span style={{ color: "var(--mute)" }}>
                          {sold}/{total} vendidos
                        </span>
                        <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                          {pct}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full"
                        style={{ backgroundColor: "var(--paper-soft)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 80 ? "var(--success)" : "var(--pulse)",
                          }}
                        />
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between border-t pt-3 text-xs"
                      style={{ borderColor: "var(--rule)" }}
                    >
                      <span style={{ color: "var(--mute)" }}>
                        {categoryLabel[event.category] ?? event.category}
                      </span>
                      <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                        {minPrice === null
                          ? "—"
                          : minPrice === 0
                            ? "Grátis"
                            : `a partir de ${centsToBRL(minPrice)}`}
                      </span>
                    </div>
                  </div>
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
  secondary,
  href,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  secondary?: string
  href: string
  accent: string
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-[var(--shadow-md)]"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div
        className="absolute top-0 left-0 h-full w-1 transition-all group-hover:w-1.5"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center gap-2" style={{ color: "var(--mute)" }}>
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-xs font-medium tracking-wide">{label}</span>
      </div>
      <p
        className="mt-3 font-mono text-3xl font-bold tabular-nums"
        style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
      >
        {value.toLocaleString("pt-BR")}
      </p>
      {secondary && (
        <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
          {secondary}
        </p>
      )}
    </Link>
  )
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-black/5"
      style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
    >
      <span className="flex items-center gap-2">
        <span style={{ color: "var(--mute)" }}>{icon}</span>
        {label}
      </span>
      <ArrowUpRight size={13} style={{ color: "var(--mute)" }} />
    </Link>
  )
}

function Sparkline({ values, max }: { values: number[]; max: number }) {
  const w = 240
  const h = 50
  const step = w / Math.max(values.length - 1, 1)
  const pts = values.map((v, i) => `${i * step},${h - (v / max) * h}`)
  const firstPt = pts[0] ?? `0,${h}`
  const area = `M0,${h} L${pts.join(" L")} L${w},${h} Z`
  const line = `M${firstPt} L${pts.slice(1).join(" L")}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--pulse)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--pulse)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke="var(--pulse)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Donut({ entries, total }: { entries: [string, number][]; total: number }) {
  const r = 32
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--paper-soft)" strokeWidth="12" />
      {entries.map(([cat, v]) => {
        const frac = v / total
        const dash = `${frac * c} ${c - frac * c}`
        const off = -acc
        acc += frac * c
        return (
          <circle
            key={cat}
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={categoryColor[cat] ?? "var(--mute)"}
            strokeWidth="12"
            strokeDasharray={dash}
            strokeDashoffset={off}
          />
        )
      })}
    </svg>
  )
}

function EventPattern({ category }: { category: string }) {
  const colors: Record<string, string[]> = {
    show: ["#c8ff00", "#a2d900"],
    esporte: ["#2d7af6", "#1e5fd6"],
    religioso: ["#e89400", "#cc7a00"],
    curso: ["#00b96b", "#008f52"],
    outro: ["#4a4a52", "#2a2a2f"],
  }
  const [a, b] = colors[category] ?? colors["outro"]!
  return (
    <svg viewBox="0 0 400 225" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bg-${category}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
        <pattern
          id={`dots-${category}`}
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.12)" />
        </pattern>
      </defs>
      <rect width="400" height="225" fill={`url(#bg-${category})`} />
      <rect width="400" height="225" fill={`url(#dots-${category})`} />
      <circle cx="320" cy="60" r="60" fill="rgba(255,255,255,0.08)" />
      <circle cx="60" cy="180" r="40" fill="rgba(0,0,0,0.1)" />
    </svg>
  )
}
