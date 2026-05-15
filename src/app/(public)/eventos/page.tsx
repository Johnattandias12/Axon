import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { EventCard } from "@/components/event/EventCard"
import { EventsFilterBar } from "@/components/event/EventsFilterBar"
import { Calendar } from "lucide-react"

export const metadata: Metadata = {
  title: "Eventos",
  description: "Encontre shows, esportes e experiências perto de você.",
}

interface SearchParams {
  busca?: string
  categoria?: string
  cidade?: string
  ordem?: "data" | "preco" | "mais-vendidos"
}

const categoryOptions = [
  { value: "", label: "Todos" },
  { value: "show", label: "Shows" },
  { value: "esporte", label: "Esportes" },
  { value: "religioso", label: "Religioso" },
  { value: "curso", label: "Cursos" },
  { value: "outro", label: "Festas" },
] as const

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
      `id, slug, title, banner_url, category, venue_name, city, state, starts_at, status,
       ticket_lots(price_cents, quantity_total, quantity_sold, quantity_reserved)`
    )
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .limit(48)

  if (params.busca) query = query.ilike("title", `%${params.busca}%`)
  if (params.categoria) {
    query = query.eq(
      "category",
      params.categoria as "show" | "esporte" | "religioso" | "curso" | "outro"
    )
  }
  if (params.cidade) query = query.ilike("city", `%${params.cidade}%`)

  // Ordenação
  if (params.ordem === "preco") {
    query = query.order("starts_at", { ascending: true })
  } else {
    query = query.order("starts_at", { ascending: true })
  }

  const { data: events } = await query

  // Cidades únicas (para sugestões)
  const { data: allEvents } = await supabase
    .from("events")
    .select("city")
    .eq("status", "published")
    .not("city", "is", null)
    .limit(200)

  const cidades = Array.from(
    new Set((allEvents ?? []).map((e) => e.city).filter((c): c is string => !!c))
  ).sort()

  // Mapeia para EventCard format
  let mapped = (events ?? []).map((event) => {
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
    return { ...event, minPriceCents, availableCount }
  })

  // Ordenação em memória para preço
  if (params.ordem === "preco") {
    mapped = mapped.sort((a, b) => (a.minPriceCents ?? 999999) - (b.minPriceCents ?? 999999))
  } else if (params.ordem === "mais-vendidos") {
    mapped = mapped.sort((a, b) => {
      const ax = (a.ticket_lots ?? []).reduce((s, l) => s + l.quantity_sold, 0)
      const bx = (b.ticket_lots ?? []).reduce((s, l) => s + l.quantity_sold, 0)
      return bx - ax
    })
  }

  const activeFilters = [
    params.busca && { label: `"${params.busca}"`, removeKey: "busca" },
    params.categoria && {
      label: categoryOptions.find((c) => c.value === params.categoria)?.label ?? params.categoria,
      removeKey: "categoria",
    },
    params.cidade && { label: params.cidade, removeKey: "cidade" },
  ].filter(Boolean) as Array<{ label: string; removeKey: string }>

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span
              className="h-px w-8"
              style={{ background: "linear-gradient(90deg, transparent, var(--pulse))" }}
            />
            <span
              className="text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--mute)" }}
            >
              AXON · Catálogo
            </span>
          </div>
          <h1
            className="mt-2 text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: "var(--ink)", letterSpacing: "-0.035em" }}
          >
            Encontre seu próximo evento
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--mute)" }}>
            {mapped.length} {mapped.length === 1 ? "evento encontrado" : "eventos encontrados"}
            {params.cidade ? ` em ${params.cidade}` : ""}.
          </p>
        </div>

        <EventsFilterBar
          categories={categoryOptions as unknown as { value: string; label: string }[]}
          cidades={cidades}
          initial={{
            busca: params.busca ?? "",
            categoria: params.categoria ?? "",
            cidade: params.cidade ?? "",
            ordem: params.ordem ?? "data",
          }}
        />

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px]" style={{ color: "var(--mute)" }}>
              Filtros:
            </span>
            {activeFilters.map((f) => {
              const sp = new URLSearchParams()
              for (const [k, v] of Object.entries(params)) {
                if (k !== f.removeKey && v) sp.set(k, String(v))
              }
              return (
                <Link
                  key={f.removeKey}
                  href={`/eventos${sp.toString() ? `?${sp.toString()}` : ""}`}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-black/5"
                  style={{
                    borderColor: "var(--rule)",
                    color: "var(--ink-4)",
                    backgroundColor: "var(--paper-pure)",
                  }}
                >
                  {f.label}
                  <span style={{ color: "var(--mute)" }}>×</span>
                </Link>
              )
            })}
            <Link
              href="/eventos"
              className="text-[11px] underline-offset-2 hover:underline"
              style={{ color: "var(--mute)" }}
            >
              limpar tudo
            </Link>
          </div>
        )}

        <div className="mt-8">
          {mapped.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed p-16 text-center"
              style={{ borderColor: "var(--rule)" }}
            >
              <Calendar size={28} className="mx-auto" style={{ color: "var(--mute-2)" }} />
              <p className="mt-3 text-base font-medium" style={{ color: "var(--ink)" }}>
                Nenhum evento encontrado
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
                Tente outros filtros ou volte em breve.
              </p>
              <Link
                href="/eventos"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
                style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
              >
                Ver todos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mapped.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
