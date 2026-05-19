import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { formatDate, centsToBRL } from "@/lib/utils"
import {
  Calendar,
  MapPin,
  Ticket,
  Users,
  TrendingUp,
  CheckCircle2,
  Edit,
  ExternalLink,
  Building2,
  Clock,
} from "lucide-react"
import { EventAdminActions } from "../EventAdminActions"
import { PageBackLink } from "@/components/shared/PageHeader"

export const metadata: Metadata = { title: "Detalhe do evento · AXON Admin" }

const categoryLabel: Record<string, string> = {
  show: "Show",
  esporte: "Esporte",
  religioso: "Religioso",
  curso: "Curso",
  outro: "Evento",
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  draft: { bg: "var(--paper-soft)", color: "var(--mute)" },
  published: { bg: "var(--success-soft)", color: "var(--success)" },
  cancelled: { bg: "var(--danger-soft)", color: "var(--danger)" },
  finished: { bg: "var(--ink-3)", color: "var(--paper)" },
}

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  cancelled: "Cancelado",
  finished: "Encerrado",
}

export default async function AdminEventoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select(
      `*, organizers(id, trade_name, legal_name, contact_email),
       ticket_types(id, name, position, ticket_lots(id, name, price_cents, quantity_total, quantity_sold, quantity_reserved, is_half_price, position))`
    )
    .eq("id", id)
    .single()

  if (!event) notFound()

  const [{ count: ticketsCount }, { count: checkinsCount }, { data: orders }] = await Promise.all([
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("event_id", id),
    supabase
      .from("check_ins")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id)
      .eq("result", "valid"),
    supabase
      .from("orders")
      .select("total_cents, service_fee_cents, status")
      .eq("event_id", id)
      .eq("status", "paid"),
  ])

  const organizer = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers
  const types = (event.ticket_types ?? []).sort((a, b) => a.position - b.position)
  const allLots = types.flatMap((t) => t.ticket_lots ?? [])
  const totalCapacity = allLots.reduce((s, l) => s + l.quantity_total, 0)
  const totalSold = allLots.reduce((s, l) => s + l.quantity_sold, 0)
  const totalReserved = allLots.reduce((s, l) => s + l.quantity_reserved, 0)
  const fillPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0
  const gmvCents = (orders ?? []).reduce((s, o) => s + (o.total_cents ?? 0), 0)
  const feeCents = (orders ?? []).reduce((s, o) => s + (o.service_fee_cents ?? 0), 0)

  const checkinPct =
    (ticketsCount ?? 0) > 0 ? Math.round(((checkinsCount ?? 0) / (ticketsCount ?? 0)) * 100) : 0

  return (
    <div className="space-y-6">
      <PageBackLink href="/admin/eventos" label="Voltar para eventos" />

      {/* Hero */}
      <div
        className="relative rounded-3xl border"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <div
          className="relative aspect-[21/8] w-full overflow-hidden rounded-t-[22px]"
          style={{ backgroundColor: "var(--paper-soft)" }}
        >
          {event.banner_url ? (
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <CategoryBanner category={event.category} />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}
          />
          <div className="absolute right-5 bottom-5 left-5 flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1.5">
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md"
                style={{
                  backgroundColor: statusStyle[event.status]?.bg ?? "var(--paper-soft)",
                  color: statusStyle[event.status]?.color ?? "var(--mute)",
                }}
              >
                {statusLabel[event.status] ?? event.status}
              </span>
              <h1
                className="text-3xl font-bold tracking-tight text-white"
                style={{ letterSpacing: "-0.03em" }}
              >
                {event.title}
              </h1>
              <p className="text-sm text-white/80">
                {categoryLabel[event.category] ?? "Evento"} ·{" "}
                {formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" })}
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t p-4"
          style={{ borderColor: "var(--rule)" }}
        >
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"
            style={{ color: "var(--mute)" }}
          >
            {(event.venue_name ?? event.city) && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {[event.venue_name, event.city, event.state].filter(Boolean).join(" · ")}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              Criado em {formatDate(event.created_at, { dateStyle: "short" })}
            </span>
            {organizer && (
              <span className="flex items-center gap-1.5">
                <Building2 size={13} />
                {organizer.trade_name ?? organizer.legal_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/eventos/${event.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
            >
              <ExternalLink size={12} />
              Ver público
            </Link>
            <Link
              href={`/organizador/eventos/${event.id}/editar`}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
            >
              <Edit size={12} />
              Editar
            </Link>
            <EventAdminActions eventId={event.id} currentStatus={event.status} />
          </div>
        </div>
      </div>

      {/* KPIs do evento */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat
          icon={<Ticket size={14} />}
          label="Vendidos"
          value={`${totalSold}/${totalCapacity}`}
          sub={`${fillPct}% da capacidade`}
          accent="var(--pulse)"
        />
        <MiniStat
          icon={<Users size={14} />}
          label="Reservados"
          value={totalReserved.toString()}
          sub="Pendentes de pagamento"
          accent="var(--warning)"
        />
        <MiniStat
          icon={<CheckCircle2 size={14} />}
          label="Check-ins"
          value={`${checkinsCount ?? 0}`}
          sub={`${checkinPct}% dos válidos`}
          accent="var(--success)"
        />
        <MiniStat
          icon={<TrendingUp size={14} />}
          label="GMV"
          value={centsToBRL(gmvCents)}
          sub={`Taxa AXON: ${centsToBRL(feeCents)}`}
          accent="var(--info)"
        />
      </div>

      {/* Descrição + Lotes */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {event.description && (
            <Card title="Sobre o evento" icon={<Calendar size={14} />}>
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: "var(--ink-4)" }}
              >
                {event.description}
              </p>
            </Card>
          )}

          <Card title="Tipos de ingresso e lotes" icon={<Ticket size={14} />}>
            {types.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--mute)" }}>
                Nenhum lote criado. Adicione tipos de ingresso para começar a vender.
              </p>
            ) : (
              <div className="space-y-5">
                {types.map((type) => {
                  const lots = (type.ticket_lots ?? []).sort((a, b) => a.position - b.position)
                  return (
                    <div key={type.id}>
                      <p
                        className="mb-2 text-xs font-semibold tracking-wider uppercase"
                        style={{ color: "var(--mute)" }}
                      >
                        {type.name}
                      </p>
                      <div className="space-y-2">
                        {lots.map((lot) => {
                          const avail =
                            lot.quantity_total - lot.quantity_sold - lot.quantity_reserved
                          const pct =
                            lot.quantity_total > 0
                              ? Math.round((lot.quantity_sold / lot.quantity_total) * 100)
                              : 0
                          return (
                            <div
                              key={lot.id}
                              className="rounded-xl border p-3"
                              style={{
                                borderColor: "var(--rule)",
                                backgroundColor: "var(--paper-soft)",
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="text-sm font-medium"
                                      style={{ color: "var(--ink)" }}
                                    >
                                      {lot.name}
                                    </span>
                                    {lot.is_half_price && (
                                      <span
                                        className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                                        style={{
                                          backgroundColor: "var(--warning-soft)",
                                          color: "var(--warning)",
                                        }}
                                      >
                                        MEIA
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
                                    {lot.quantity_sold} vendidos · {lot.quantity_reserved}{" "}
                                    reservados · {avail} disponíveis
                                  </p>
                                </div>
                                <span
                                  className="shrink-0 font-mono text-sm font-bold"
                                  style={{ color: "var(--ink)" }}
                                >
                                  {lot.price_cents === 0 ? "Grátis" : centsToBRL(lot.price_cents)}
                                </span>
                              </div>
                              <div
                                className="mt-2 h-1 overflow-hidden rounded-full"
                                style={{ backgroundColor: "var(--paper-pure)" }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: pct >= 80 ? "var(--success)" : "var(--pulse)",
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card title="Detalhes" icon={<Calendar size={14} />}>
            <dl className="space-y-2.5 text-xs">
              <Field
                label="Início"
                value={formatDate(event.starts_at, { dateStyle: "long", timeStyle: "short" })}
              />
              {event.ends_at && (
                <Field
                  label="Término"
                  value={formatDate(event.ends_at, { dateStyle: "long", timeStyle: "short" })}
                />
              )}
              <Field label="Capacidade" value={event.capacity?.toLocaleString("pt-BR") ?? "—"} />
              <Field label="Classificação" value={event.age_rating ?? "Livre"} />
              <Field label="Slug" value={event.slug} mono />
              <Field label="Nominal" value={event.is_nominal ? "Sim" : "Não"} />
            </dl>
          </Card>

          {organizer && (
            <Card title="Organizador" icon={<Building2 size={14} />}>
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                {organizer.trade_name ?? organizer.legal_name}
              </p>
              {organizer.contact_email && (
                <a
                  href={`mailto:${organizer.contact_email}`}
                  className="mt-1 block text-xs hover:underline"
                  style={{ color: "var(--mute)" }}
                >
                  {organizer.contact_email}
                </a>
              )}
            </Card>
          )}

          <Card title="Capacidade" icon={<Users size={14} />}>
            <CapacityRing pct={fillPct} sold={totalSold} total={totalCapacity} />
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div className="mb-4 flex items-center gap-1.5" style={{ color: "var(--mute)" }}>
        {icon}
        <span className="text-xs font-medium tracking-wider uppercase">{title}</span>
      </div>
      {children}
    </div>
  )
}

function MiniStat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div className="absolute top-0 right-0 h-1 w-full" style={{ backgroundColor: accent }} />
      <div className="flex items-center gap-1.5" style={{ color: "var(--mute)" }}>
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-[10px] font-medium tracking-wider uppercase">{label}</span>
      </div>
      <p
        className="mt-2 font-mono text-xl font-bold"
        style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px]" style={{ color: "var(--mute)" }}>
        {sub}
      </p>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt style={{ color: "var(--mute)" }}>{label}</dt>
      <dd
        className={mono ? "font-mono" : ""}
        style={{ color: "var(--ink)", letterSpacing: mono ? "0" : undefined }}
      >
        {value}
      </dd>
    </div>
  )
}

function CapacityRing({ pct, sold, total }: { pct: number; sold: number; total: number }) {
  const r = 44
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 110 110" className="h-24 w-24 -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--paper-soft)" strokeWidth="10" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="var(--pulse)"
          strokeWidth="10"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p
          className="font-mono text-2xl font-bold"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          {pct}%
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
          {sold.toLocaleString("pt-BR")} de {total.toLocaleString("pt-BR")} vendidos
        </p>
      </div>
    </div>
  )
}

function CategoryBanner({ category }: { category: string }) {
  const colors: Record<string, { a: string; b: string }> = {
    show: { a: "#c8ff00", b: "#3d4a00" },
    esporte: { a: "#2d7af6", b: "#0a1f3d" },
    religioso: { a: "#e89400", b: "#3d2700" },
    curso: { a: "#00b96b", b: "#003319" },
    outro: { a: "#4a4a52", b: "#0a0a0b" },
  }
  const c = colors[category] ?? colors["outro"]!
  return (
    <svg viewBox="0 0 800 280" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.a} />
          <stop offset="100%" stopColor={c.b} />
        </linearGradient>
        <pattern id="hp" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.1)" />
        </pattern>
      </defs>
      <rect width="800" height="280" fill="url(#hg)" />
      <rect width="800" height="280" fill="url(#hp)" />
      <circle cx="650" cy="80" r="90" fill="rgba(255,255,255,0.06)" />
      <circle cx="120" cy="220" r="60" fill="rgba(0,0,0,0.15)" />
    </svg>
  )
}
