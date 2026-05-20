import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { centsToBRL, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AddToCartButton } from "@/components/event/AddToCartButton"
import { EventBannerPlaceholder } from "@/components/event/EventBannerPlaceholder"
import { ShareEventButtons } from "@/components/event/ShareEventButtons"
import { CopyLinkButton } from "@/components/event/CopyLinkButton"
import { PageBackLink } from "@/components/shared/PageHeader"
import {
  Calendar,
  MapPin,
  Shield,
  Ticket as TicketIcon,
  Sparkles,
  Clock,
  Building2,
} from "lucide-react"

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

function getCountdown(date: string) {
  const target = new Date(date).getTime()
  const now = Date.now()
  const diff = target - now
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  return { days, hours }
}

export default async function EventoPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const [
    { data: event },
    {
      data: { user },
    },
    paymentModeRes,
  ] = await Promise.all([
    supabase
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
      .single(),
    supabase.auth.getUser(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("system_settings")
      .select("value")
      .eq("key", "payment_mode")
      .maybeSingle(),
  ])

  if (!event) notFound()

  const isRealPayment = paymentModeRes?.data?.value === "real"

  // Código de afiliado do user logado (silencioso se tabela não existir)
  let viewerAffiliateCode: string | null = null
  if (user) {
    try {
      const { getAffiliateByUserId } = await import("@/lib/supabase/affiliates-admin")
      const aff = await getAffiliateByUserId(supabase, user.id)
      viewerAffiliateCode = aff?.code ?? null
    } catch {
      // migração 008 pode não estar aplicada
    }
  }

  const now = new Date()
  const types = (event.ticket_types ?? []).sort((a, b) => a.position - b.position)

  const organizer = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers
  const organizerName = organizer?.trade_name ?? organizer?.legal_name ?? "Organizador"
  const countdown = getCountdown(event.starts_at)

  const allLots = types.flatMap((t) => t.ticket_lots ?? [])
  const totalAvailable = allLots.reduce(
    (s, l) => s + (l.quantity_total - l.quantity_sold - l.quantity_reserved),
    0
  )
  const totalCapacity = allLots.reduce((s, l) => s + l.quantity_total, 0)
  const soldPct =
    totalCapacity > 0 ? Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100) : 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      {/* Banner */}
      <div
        className="relative aspect-[21/9] max-h-[520px] w-full overflow-hidden"
        style={{ backgroundColor: "var(--paper-soft)" }}
      >
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" priority />
        ) : (
          <EventBannerPlaceholder
            category={event.category}
            className="absolute inset-0 h-full w-full"
          />
        )}

        {/* Pattern overlay */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-30 mix-blend-overlay"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="evt-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.15)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#evt-dots)" />
        </svg>

        {/* Gradients */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 45%, transparent 60%)",
          }}
        />

        {/* Hero content */}
        <div className="absolute right-0 bottom-0 left-0">
          <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 sm:pb-12">
            <div className="mb-4 flex items-center justify-between gap-2">
              <PageBackLink href="/eventos" label="Todos os eventos" />
              <div className="flex items-center gap-2">
                <CopyLinkButton eventSlug={slug} affiliateCode={viewerAffiliateCode} />
                <ShareEventButtons
                  eventTitle={event.title}
                  eventSlug={slug}
                  affiliateCode={viewerAffiliateCode}
                  variant="solid"
                />
              </div>
            </div>
            <Badge
              className="mb-3 text-[10px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: "var(--pulse)",
                color: "var(--pulse-ink)",
                border: "none",
              }}
            >
              {categoryLabel[event.category] ?? "Evento"}
            </Badge>
            <h1
              className="text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-5xl md:text-6xl"
              style={{ letterSpacing: "-0.04em", textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}
            >
              {event.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" })}
              </span>
              {(event.venue_name ?? event.city) && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {[event.venue_name, event.city, event.state].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {countdown && (
          <div
            className="axon-fade-up mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-pure)",
              backgroundImage:
                "linear-gradient(135deg, transparent 0%, color-mix(in srgb, var(--pulse) 6%, transparent) 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
              >
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--mute)" }}>
                  Contagem regressiva
                </p>
                <p className="font-mono text-lg font-bold" style={{ color: "var(--ink)" }}>
                  {countdown.days}d {countdown.hours}h
                </p>
              </div>
            </div>
            {soldPct > 0 && (
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--mute)" }}>
                <Sparkles size={12} style={{ color: "var(--pulse)" }} />
                <span>
                  <strong style={{ color: "var(--ink)" }}>{soldPct}%</strong> dos ingressos já
                  garantidos
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Coluna principal */}
          <div className="space-y-8">
            {event.description && (
              <section className="axon-fade-up">
                <h2
                  className="mb-3 flex items-center gap-2 text-lg font-semibold"
                  style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
                >
                  <span
                    className="h-4 w-1 rounded-full"
                    style={{ backgroundColor: "var(--pulse)" }}
                  />
                  Sobre o evento
                </h2>
                <div
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--ink-4)" }}
                >
                  {event.description}
                </div>
              </section>
            )}

            {/* Mapa estilizado */}
            {(event.venue_name ?? event.address) && (
              <section
                className="axon-fade-up overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--rule)" }}
              >
                <div
                  className="relative h-40 w-full"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--paper-soft) 0%, var(--paper-pure) 100%)",
                  }}
                >
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 600 160"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <defs>
                      <pattern
                        id="map-grid"
                        x="0"
                        y="0"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="var(--rule)"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect width="600" height="160" fill="url(#map-grid)" />
                    <path
                      d="M -20 80 Q 100 40 220 90 T 460 70 T 620 100"
                      stroke="var(--rule-strong)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M -20 120 Q 150 100 280 130 T 620 110"
                      stroke="var(--rule)"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <g transform="translate(300, 80)">
                      <circle r="24" fill="var(--pulse)" opacity="0.15" />
                      <circle r="14" fill="var(--pulse)" opacity="0.25" />
                      <circle r="6" fill="var(--pulse)" />
                      <circle r="3" fill="var(--pulse-ink)" />
                    </g>
                  </svg>
                </div>
                <div className="space-y-3 border-t p-4" style={{ borderColor: "var(--rule)" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} style={{ color: "var(--pulse)" }} />
                      <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                        {event.venue_name ?? "Local do evento"}
                      </p>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
                      {[event.address, event.city, event.state].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [event.venue_name, event.address, event.city, event.state]
                        .filter(Boolean)
                        .join(", ")
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-transform hover:scale-[1.01]"
                    style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
                  >
                    <MapPin size={12} />
                    Como chegar
                  </a>
                </div>
              </section>
            )}

            {/* Programação */}
            <section className="axon-fade-up">
              <h2
                className="mb-4 flex items-center gap-2 text-lg font-semibold"
                style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
              >
                <span
                  className="h-4 w-1 rounded-full"
                  style={{ backgroundColor: "var(--pulse)" }}
                />
                Programação
              </h2>
              <ol
                className="relative space-y-3 border-l pl-5"
                style={{ borderColor: "var(--rule)" }}
              >
                {[
                  {
                    time: "18:00",
                    title: "Abertura dos portões",
                    desc: "Triagem na entrada e credenciamento Frontstage.",
                  },
                  {
                    time: "19:30",
                    title: "Atração de abertura",
                    desc: "Show de aquecimento com banda local.",
                  },
                  {
                    time: "21:00",
                    title: "Atração principal",
                    desc: "Headliner do evento com show completo.",
                  },
                  {
                    time: "23:30",
                    title: "Pista livre",
                    desc: "Discotecagem após o show até o encerramento.",
                  },
                ].map((slot) => (
                  <li key={slot.time} className="relative">
                    <span
                      className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full ring-4"
                      style={{
                        backgroundColor: "var(--pulse)",
                        boxShadow: "0 0 0 4px var(--paper)",
                      }}
                    />
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span
                        className="font-mono text-xs font-bold tabular-nums"
                        style={{ color: "var(--pulse-deep)" }}
                      >
                        {slot.time}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                        {slot.title}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--mute)" }}>
                      {slot.desc}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[11px] italic" style={{ color: "var(--mute-2)" }}>
                * Programação sujeita a alteração pelo organizador.
              </p>
            </section>

            {/* FAQ */}
            <section className="axon-fade-up">
              <h2
                className="mb-4 flex items-center gap-2 text-lg font-semibold"
                style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
              >
                <span
                  className="h-4 w-1 rounded-full"
                  style={{ backgroundColor: "var(--pulse)" }}
                />
                Perguntas frequentes
              </h2>
              <div className="space-y-2">
                {[
                  {
                    q: "Como recebo meu ingresso?",
                    a: "Após a compra, seu ingresso digital com QR Code fica disponível em Minha Conta · Ingressos. Você também recebe por e-mail.",
                  },
                  {
                    q: "Meia-entrada precisa de comprovação?",
                    a: "Sim. Estudante apresenta carteirinha válida; meia social entrega 1kg de alimento na entrada.",
                  },
                  {
                    q: "Posso transferir meu ingresso?",
                    a: "O ingresso é nominal. Em caso de transferência, contate o organizador com até 48h de antecedência.",
                  },
                  {
                    q: "E se chover?",
                    a: "O evento acontece com qualquer clima, salvo decisão oficial do órgão de segurança. Acompanhe nossas redes.",
                  },
                ].map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-xl border p-4 transition-colors open:bg-[var(--paper-pure)]"
                    style={{ borderColor: "var(--rule)" }}
                  >
                    <summary
                      className="flex cursor-pointer items-center justify-between text-sm font-semibold"
                      style={{ color: "var(--ink)" }}
                    >
                      {f.q}
                      <svg
                        className="h-4 w-4 transition-transform group-open:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ color: "var(--mute)" }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--mute)" }}>
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {/* Política de cancelamento */}
            {event.cover_policy &&
              typeof event.cover_policy === "object" &&
              !Array.isArray(event.cover_policy) && (
                <section
                  className="axon-fade-up rounded-2xl border p-5"
                  style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Shield size={15} style={{ color: "var(--success)" }} />
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
                </section>
              )}

            {/* Organizador */}
            <section
              className="axon-fade-up flex items-center gap-4 rounded-2xl border p-5"
              style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
              >
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--mute)" }}>
                  Organizado por
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  {organizerName}
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar — ingressos */}
          <aside>
            <div
              className="sticky top-20 overflow-hidden rounded-2xl border"
              style={{
                borderColor: "var(--rule)",
                backgroundColor: "var(--paper-pure)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div
                className="flex items-center justify-between border-b p-5"
                style={{ borderColor: "var(--rule)" }}
              >
                <div className="flex items-center gap-2">
                  <TicketIcon size={16} style={{ color: "var(--pulse)" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    Ingressos
                  </h2>
                </div>
                {totalAvailable > 0 && (
                  <span className="text-[10px]" style={{ color: "var(--mute)" }}>
                    {totalAvailable} disponíveis
                  </span>
                )}
              </div>

              <div className="space-y-5 p-5">
                {types.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--mute)" }}>
                    Ingressos indisponíveis no momento.
                  </p>
                ) : (
                  types.map((type) => {
                    const activeLots = (type.ticket_lots ?? [])
                      .filter((lot) => {
                        const afterStart = new Date(lot.starts_at) <= now
                        const beforeEnd = !lot.ends_at || new Date(lot.ends_at) > now
                        return afterStart && beforeEnd
                      })
                      .sort((a, b) => a.position - b.position)

                    if (activeLots.length === 0) return null

                    return (
                      <div key={type.id} className="space-y-2.5">
                        <p
                          className="text-[10px] font-semibold tracking-wider uppercase"
                          style={{ color: "var(--mute)" }}
                        >
                          {type.name}
                        </p>
                        {activeLots.map((lot) => {
                          const avail =
                            lot.quantity_total - lot.quantity_sold - lot.quantity_reserved
                          const isSoldOut = avail <= 0
                          return (
                            <div
                              key={lot.id}
                              className="rounded-xl border p-3 transition-colors"
                              style={{
                                borderColor: "var(--rule)",
                                backgroundColor: isSoldOut
                                  ? "var(--paper-soft)"
                                  : "var(--paper-pure)",
                                opacity: isSoldOut ? 0.55 : 1,
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p
                                      className="text-sm font-medium"
                                      style={{ color: "var(--ink)" }}
                                    >
                                      {lot.name}
                                    </p>
                                    {lot.is_half_price && (
                                      <span
                                        className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                                        style={{
                                          backgroundColor: "var(--warning-soft)",
                                          color: "var(--warning)",
                                        }}
                                      >
                                        MEIA
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className="mt-0.5 text-[11px]"
                                    style={{ color: "var(--mute)" }}
                                  >
                                    {isSoldOut
                                      ? "Esgotado"
                                      : avail <= 20
                                        ? `${avail} restantes`
                                        : "Disponível"}
                                  </p>
                                </div>
                                <span
                                  className="shrink-0 text-right font-mono text-sm font-bold"
                                  style={{ color: "var(--ink)" }}
                                >
                                  {lot.price_cents === 0 ? "Grátis" : centsToBRL(lot.price_cents)}
                                </span>
                              </div>
                              {!isSoldOut && (
                                <div className="mt-3">
                                  <AddToCartButton
                                    lotId={lot.id}
                                    maxQuantity={avail}
                                    isAuthenticated={!!user}
                                    eventSlug={slug}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <Separator style={{ backgroundColor: "var(--rule)" }} />
                      </div>
                    )
                  })
                )}

                <div
                  className="flex items-center justify-center gap-1.5 rounded-lg p-2 text-[10px]"
                  style={{
                    backgroundColor: isRealPayment ? "rgba(200, 255, 0, 0.1)" : "var(--pulse-soft)",
                    color: isRealPayment ? "#c8ff00" : "var(--ink)",
                    border: isRealPayment ? "1px solid rgba(200, 255, 0, 0.2)" : "none",
                  }}
                >
                  {isRealPayment ? (
                    <>
                      <Shield size={10} className="text-[#c8ff00]" />
                      🔒 Pagamento 100% Seguro — Suas informações estão criptografadas.
                    </>
                  ) : (
                    <>
                      <Sparkles size={10} />
                      Modo demonstração — sem cobrança real
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
