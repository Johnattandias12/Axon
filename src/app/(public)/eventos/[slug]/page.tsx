import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { centsToBRL, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, Users, Shield, ChevronLeft } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("title, description, banner_url")
    .eq("slug", slug)
    .single()

  if (!data) return { title: "Evento não encontrado" }

  return {
    title: data.title,
    description: data.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: data.title,
      description: data.description?.slice(0, 160) ?? undefined,
      images: data.banner_url ? [{ url: data.banner_url }] : [],
    },
  }
}

const categoryLabel: Record<string, string> = {
  show: "Show",
  esporte: "Esporte",
  religioso: "Religioso",
  curso: "Curso",
  outro: "Evento",
}

export default async function EventoPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select(
      `
      *,
      organizers ( id, trade_name, legal_name ),
      ticket_types (
        id, name, description, position,
        ticket_lots ( id, name, price_cents, quantity_total, quantity_sold, quantity_reserved, is_half_price, starts_at, ends_at, position )
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) notFound()

  const now = new Date()
  const types = (event.ticket_types ?? []).sort((a, b) => a.position - b.position)

  const organizer = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers
  const organizerName = organizer?.trade_name ?? organizer?.legal_name ?? "Organizador"

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      {/* Banner */}
      <div className="relative aspect-[21/9] max-h-[480px] w-full overflow-hidden bg-neutral-200">
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" priority />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, var(--ink) 0%, var(--ink-3) 100%)" }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/eventos"
          className="mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "var(--mute)" }}
        >
          <ChevronLeft size={15} />
          Todos os eventos
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          {/* Coluna principal */}
          <div className="space-y-8">
            <div className="space-y-3">
              <Badge
                className="text-xs"
                style={{ backgroundColor: "var(--ink)", color: "var(--paper)", border: "none" }}
              >
                {categoryLabel[event.category] ?? "Evento"}
              </Badge>
              <h1
                className="text-3xl leading-tight font-bold"
                style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
              >
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <Calendar size={15} style={{ color: "var(--mute)" }} />
                  <span className="text-sm" style={{ color: "var(--mute)" }}>
                    {formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" })}
                  </span>
                </div>
                {(event.venue_name ?? event.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={15} style={{ color: "var(--mute)" }} />
                    <span className="text-sm" style={{ color: "var(--mute)" }}>
                      {[event.venue_name, event.city, event.state].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {event.description && (
              <div>
                <h2
                  className="mb-3 text-base font-semibold"
                  style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
                >
                  Sobre o evento
                </h2>
                <div
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--ink-4)" }}
                >
                  {event.description}
                </div>
              </div>
            )}

            {/* Política de cancelamento */}
            {event.cover_policy &&
              typeof event.cover_policy === "object" &&
              !Array.isArray(event.cover_policy) && (
                <div
                  className="space-y-1 rounded-xl border p-4"
                  style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Shield size={15} style={{ color: "var(--mute)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                      Política de cancelamento
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--mute)" }}>
                    Reembolso integral disponível por até{" "}
                    <strong style={{ color: "var(--ink)" }}>
                      {((event.cover_policy as Record<string, unknown>)["refund_days"] as number) ??
                        7}{" "}
                      dias
                    </strong>{" "}
                    após a compra, com 48h de antecedência do evento.
                  </p>
                </div>
              )}

            {/* Organizador */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
              >
                <Users size={16} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--mute)" }}>
                  Organizado por
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  {organizerName}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar — ingressos */}
          <div className="space-y-4">
            <div
              className="sticky top-20 space-y-4 rounded-xl border p-5"
              style={{
                borderColor: "var(--rule)",
                backgroundColor: "var(--paper-pure)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
              >
                Ingressos
              </h2>

              {types.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--mute)" }}>
                  Ingressos indisponíveis no momento.
                </p>
              ) : (
                <div className="space-y-4">
                  {types.map((type) => {
                    const activeLots = (type.ticket_lots ?? [])
                      .filter((lot) => {
                        const afterStart = new Date(lot.starts_at) <= now
                        const beforeEnd = !lot.ends_at || new Date(lot.ends_at) > now
                        return afterStart && beforeEnd
                      })
                      .sort((a, b) => a.position - b.position)

                    return (
                      <div key={type.id} className="space-y-2">
                        <p
                          className="text-xs font-semibold tracking-wider uppercase"
                          style={{ color: "var(--mute)", letterSpacing: "0.1em" }}
                        >
                          {type.name}
                        </p>
                        {activeLots.length === 0 ? (
                          <p className="text-xs" style={{ color: "var(--mute-2)" }}>
                            Sem lotes ativos
                          </p>
                        ) : (
                          activeLots.map((lot) => {
                            const avail =
                              lot.quantity_total - lot.quantity_sold - lot.quantity_reserved
                            const isSoldOut = avail <= 0
                            return (
                              <div
                                key={lot.id}
                                className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                                style={{
                                  borderColor: "var(--rule)",
                                  backgroundColor: isSoldOut ? "var(--paper-soft)" : "transparent",
                                  opacity: isSoldOut ? 0.6 : 1,
                                }}
                              >
                                <div>
                                  <p
                                    className="text-sm font-medium"
                                    style={{ color: "var(--ink)" }}
                                  >
                                    {lot.name}
                                    {lot.is_half_price && (
                                      <span
                                        className="ml-2 rounded px-1.5 py-0.5 text-xs"
                                        style={{
                                          backgroundColor: "var(--warning-soft)",
                                          color: "var(--warning)",
                                        }}
                                      >
                                        Meia
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs" style={{ color: "var(--mute)" }}>
                                    {isSoldOut
                                      ? "Esgotado"
                                      : avail <= 20
                                        ? `${avail} restantes`
                                        : "Disponível"}
                                  </p>
                                </div>
                                <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                                  {lot.price_cents === 0 ? "Grátis" : centsToBRL(lot.price_cents)}
                                </p>
                              </div>
                            )
                          })
                        )}
                        <Separator style={{ backgroundColor: "var(--rule)" }} />
                      </div>
                    )
                  })}
                </div>
              )}

              <div
                className="rounded-lg p-3 text-center text-sm"
                style={{ backgroundColor: "var(--paper-soft)", color: "var(--mute)" }}
              >
                Checkout disponível em breve.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
