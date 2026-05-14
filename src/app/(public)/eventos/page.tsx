import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { EventCard } from "@/components/event/EventCard"
import { Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Eventos",
  description: "Encontre shows, jogos e experiências perto de você.",
}

interface SearchParams {
  busca?: string
  categoria?: string
  cidade?: string
}

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("events")
    .select(
      `
      id, slug, title, banner_url, category, venue_name, city, state, starts_at, status,
      ticket_lots ( price_cents, quantity_total, quantity_sold, quantity_reserved )
    `
    )
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(48)

  if (params.busca) {
    query = query.ilike("title", `%${params.busca}%`)
  }
  if (params.categoria) {
    query = query.eq(
      "category",
      params.categoria as "show" | "esporte" | "religioso" | "curso" | "outro"
    )
  }
  if (params.cidade) {
    query = query.ilike("city", `%${params.cidade}%`)
  }

  const { data: events } = await query

  const categories = [
    { value: "", label: "Todos" },
    { value: "show", label: "Shows" },
    { value: "esporte", label: "Esportes" },
    { value: "religioso", label: "Religioso" },
    { value: "curso", label: "Cursos" },
    { value: "outro", label: "Outros" },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 space-y-4">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            Eventos
          </h1>

          <form className="flex flex-wrap gap-3" method="GET">
            <div
              className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border px-3"
              style={{ borderColor: "var(--rule-strong)", backgroundColor: "var(--paper-pure)" }}
            >
              <Search size={15} style={{ color: "var(--mute)" }} />
              <input
                name="busca"
                defaultValue={params.busca}
                placeholder="Buscar eventos…"
                className="flex-1 bg-transparent py-2 text-sm outline-none"
                style={{ color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <a
                  key={cat.value}
                  href={`/eventos${cat.value ? `?categoria=${cat.value}` : ""}`}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      params.categoria === cat.value || (!params.categoria && !cat.value)
                        ? "var(--ink)"
                        : "var(--paper-pure)",
                    color:
                      params.categoria === cat.value || (!params.categoria && !cat.value)
                        ? "var(--paper)"
                        : "var(--ink-4)",
                    borderColor: "var(--rule)",
                  }}
                >
                  {cat.label}
                </a>
              ))}
            </div>
          </form>
        </div>

        {!events || events.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg font-medium" style={{ color: "var(--ink)" }}>
              Nenhum evento encontrado.
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
              Tente outros filtros ou volte em breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => {
              const lots = event.ticket_lots ?? []
              const available = lots.filter(
                (l) => l.quantity_total - l.quantity_sold - l.quantity_reserved > 0
              )
              const minPriceCents =
                available.length > 0 ? Math.min(...available.map((l) => l.price_cents)) : undefined
              const availableCount = available.reduce(
                (sum, l) => sum + (l.quantity_total - l.quantity_sold - l.quantity_reserved),
                0
              )

              return (
                <EventCard key={event.id} event={{ ...event, minPriceCents, availableCount }} />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
