import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

export const metadata: Metadata = { title: "Meus eventos" }

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  cancelled: "Cancelado",
  finished: "Encerrado",
}

const statusStyle: Record<string, { bg: string; text: string }> = {
  draft: { bg: "var(--paper-soft)", text: "var(--mute)" },
  published: { bg: "var(--success-soft)", text: "var(--success)" },
  cancelled: { bg: "var(--danger-soft)", text: "var(--danger)" },
  finished: { bg: "var(--ink-3)", text: "var(--paper)" },
}

export default async function EventosListPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar")

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Eventos
        </h1>
        <Button
          render={<Link href="/organizador/eventos/novo" />}
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)", fontWeight: 600 }}
        >
          <Plus size={16} className="mr-1.5" />
          Novo evento
        </Button>
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
            const style = statusStyle[event.status] ?? {
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
                <p className="shrink-0 text-xs" style={{ color: "var(--mute)" }}>
                  {sold}/{total} vendidos
                </p>
                <Badge
                  className="shrink-0 text-xs"
                  style={{ backgroundColor: style.bg, color: style.text, border: "none" }}
                >
                  {statusLabel[event.status] ?? event.status}
                </Badge>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
