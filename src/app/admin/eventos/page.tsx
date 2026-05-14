import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { EventAdminActions } from "./EventAdminActions"

export const metadata: Metadata = { title: "Eventos (Admin)" }

export default async function AdminEventosPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, status, city, state, starts_at, category, organizer_id")
    .order("created_at", { ascending: false })
    .limit(100)

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

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Eventos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          {(events ?? []).length} eventos no total.
        </p>
      </div>

      <div className="space-y-2">
        {(events ?? []).map((event) => (
          <div
            key={event.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border p-4"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                {event.title}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
                {formatDate(event.starts_at, { dateStyle: "medium" })} ·{" "}
                {event.city ?? "Sem cidade"}
                {event.state ? `, ${event.state}` : ""}
              </p>
            </div>
            <span
              className="shrink-0 text-xs font-semibold"
              style={{ color: statusColor[event.status] ?? "var(--mute)" }}
            >
              {statusLabel[event.status] ?? event.status}
            </span>
            <Link
              href={`/eventos/${event.slug}`}
              className="hidden shrink-0 text-xs transition-colors hover:text-[var(--ink)] sm:inline-flex"
              style={{ color: "var(--mute)" }}
              target="_blank"
            >
              Ver
            </Link>
            <EventAdminActions eventId={event.id} currentStatus={event.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
