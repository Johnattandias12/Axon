import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { EventAdminActions } from "./EventAdminActions"
import { Calendar, MapPin, Plus, ArrowUpRight } from "lucide-react"

export const metadata: Metadata = { title: "Eventos · AXON Admin" }

const categoryLabel: Record<string, string> = {
  show: "Show",
  esporte: "Esporte",
  religioso: "Religioso",
  curso: "Curso",
  outro: "Evento",
}

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "var(--paper-soft)", color: "var(--mute)", label: "Rascunho" },
  published: { bg: "var(--success-soft)", color: "var(--success)", label: "Publicado" },
  cancelled: { bg: "var(--danger-soft)", color: "var(--danger)", label: "Cancelado" },
  finished: { bg: "var(--paper-soft)", color: "var(--ink-3)", label: "Encerrado" },
}

export default async function AdminEventosPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, slug, status, city, state, starts_at, category, organizer_id, banner_url, capacity, ticket_lots(quantity_total, quantity_sold)"
    )
    .order("created_at", { ascending: false })
    .limit(100)

  const list = events ?? []
  const counts = {
    total: list.length,
    published: list.filter((e) => e.status === "published").length,
    draft: list.filter((e) => e.status === "draft").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-px w-6"
              style={{ background: "linear-gradient(90deg, transparent, var(--pulse))" }}
            />
            <p
              className="text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--mute)" }}
            >
              Gestão de eventos
            </p>
          </div>
          <h1
            className="mt-1 text-3xl font-bold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.035em" }}
          >
            Eventos da plataforma
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
            {counts.total} no total · {counts.published} publicados · {counts.draft} em rascunho
          </p>
        </div>
        <Link
          href="/organizador/eventos/novo"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02]"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          <Plus size={16} />
          Novo evento
        </Link>
      </div>

      {list.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-12 text-center"
          style={{ borderColor: "var(--rule)" }}
        >
          <Calendar size={28} className="mx-auto" style={{ color: "var(--mute-2)" }} />
          <p className="mt-3 text-sm font-medium" style={{ color: "var(--ink)" }}>
            Nenhum evento cadastrado
          </p>
          <Link
            href="/organizador/eventos/novo"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            Criar primeiro evento
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((event) => {
            const st = statusStyle[event.status] ?? statusStyle["draft"]!
            const sold = (event.ticket_lots ?? []).reduce((s, l) => s + l.quantity_sold, 0)
            const total = (event.ticket_lots ?? []).reduce((s, l) => s + l.quantity_total, 0)
            const pct = total > 0 ? Math.round((sold / total) * 100) : 0
            return (
              <div
                key={event.id}
                className="group flex flex-wrap items-center gap-3 rounded-2xl border p-3 transition-all hover:shadow-[var(--shadow-md)]"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
              >
                <div
                  className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg"
                  style={{ backgroundColor: "var(--paper-soft)" }}
                >
                  {event.banner_url ? (
                    <Image
                      src={event.banner_url}
                      alt={event.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, var(--ink) 0%, var(--ink-3) 100%)",
                        color: "var(--pulse)",
                      }}
                    >
                      <Calendar size={16} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/eventos/${event.id}`}
                    className="inline-flex items-center gap-1"
                  >
                    <p
                      className="truncate text-sm font-semibold transition-colors group-hover:text-[var(--pulse-deep)]"
                      style={{ color: "var(--ink)" }}
                    >
                      {event.title}
                    </p>
                    <ArrowUpRight
                      size={12}
                      style={{ color: "var(--mute)" }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </Link>
                  <div
                    className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs"
                    style={{ color: "var(--mute)" }}
                  >
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(event.starts_at, { dateStyle: "short" })}
                    </span>
                    {event.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {event.city}
                        {event.state ? `, ${event.state}` : ""}
                      </span>
                    )}
                    <span>{categoryLabel[event.category] ?? event.category}</span>
                  </div>
                </div>

                <div className="hidden text-right sm:block">
                  <p className="font-mono text-xs font-bold" style={{ color: "var(--ink)" }}>
                    {sold}/{total}
                  </p>
                  <div
                    className="mt-0.5 h-1 w-16 overflow-hidden rounded-full"
                    style={{ backgroundColor: "var(--paper-soft)" }}
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

                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase"
                  style={{ backgroundColor: st.bg, color: st.color }}
                >
                  {st.label}
                </span>

                <EventAdminActions eventId={event.id} currentStatus={event.status} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
