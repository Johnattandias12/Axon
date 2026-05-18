import Link from "next/link"
import Image from "next/image"
import { centsToBRL, formatDate } from "@/lib/utils"
import { CheckCircle2, Clock, ArrowUpRight, Ticket as TicketIcon, MapPin } from "lucide-react"

export interface PremiumTicketOrder {
  id: string
  status: string
  total_cents: number
  paid_at: string | null
  created_at: string
  event: {
    id: string
    title: string
    slug: string
    starts_at: string
    venue_name: string | null
    city: string | null
    state: string | null
    banner_url: string | null
    category?: string | null
  }
  ticketCount: number
}

const categoryGradient: Record<string, string> = {
  show: "linear-gradient(135deg, #1A0033 0%, #4F0084 60%, #C8FF00 200%)",
  esporte: "linear-gradient(135deg, #001833 0%, #003E80 60%, #C8FF00 200%)",
  religioso: "linear-gradient(135deg, #2A1A00 0%, #804E00 60%, #C8FF00 200%)",
  curso: "linear-gradient(135deg, #002914 0%, #006F36 60%, #C8FF00 200%)",
  outro: "linear-gradient(135deg, #0A0A0B 0%, #2A2A30 60%, #C8FF00 200%)",
}

/**
 * Card de ingresso estilo "boarding pass premium": banner grande, linha
 * perfurada divisória, gradient por categoria, badge de status pulsante.
 * Mobile-first.
 */
export function PremiumTicketCard({
  order,
  past = false,
}: {
  order: PremiumTicketOrder
  past?: boolean
}) {
  const { event } = order
  const gradient = categoryGradient[event.category ?? "outro"] ?? categoryGradient.outro
  const eventDate = new Date(event.starts_at)
  const isPaid = order.status === "paid"
  const local = [event.venue_name, event.city, event.state].filter(Boolean).join(" · ")

  return (
    <Link
      href={`/minha-conta/ingressos/${order.id}`}
      className="group relative block overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)]"
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "var(--paper-pure)",
        opacity: past ? 0.85 : 1,
      }}
    >
      {/* Banner do evento — full width */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: gradient }} />
        )}

        {/* Overlay gradient pra legibilidade do título sobreposto */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        {/* Badge de status — top-right */}
        <div className="absolute top-3 right-3">
          {past ? (
            <Badge bg="rgba(0,0,0,0.5)" color="rgba(255,255,255,0.9)" icon={<Clock size={11} />}>
              Encerrado
            </Badge>
          ) : isPaid ? (
            <Badge bg="var(--success)" color="white" icon={<CheckCircle2 size={11} />} pulse>
              Confirmado
            </Badge>
          ) : (
            <Badge bg="var(--warning)" color="white" icon={<Clock size={11} />}>
              Pendente
            </Badge>
          )}
        </div>

        {/* Tag de categoria — top-left */}
        {event.category && (
          <span
            className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md"
            style={{
              backgroundColor: "rgba(0,0,0,0.55)",
              color: "var(--pulse)",
              boxShadow: "0 0 0 1px rgba(200,255,0,0.25) inset",
            }}
          >
            {event.category}
          </span>
        )}

        {/* Título sobre o banner */}
        <div className="absolute right-4 bottom-3 left-4">
          <h3
            className="line-clamp-2 text-base font-bold tracking-tight text-white drop-shadow-md sm:text-lg"
            style={{ letterSpacing: "-0.02em" }}
          >
            {event.title}
          </h3>
        </div>
      </div>

      {/* Stub perfurado — linha tracejada com "furos" laterais */}
      <div className="relative">
        <span
          className="absolute top-1/2 -left-1.5 h-3 w-3 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: "var(--paper)" }}
          aria-hidden="true"
        />
        <span
          className="absolute top-1/2 -right-1.5 h-3 w-3 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: "var(--paper)" }}
          aria-hidden="true"
        />
        <div
          className="h-px"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--rule) 0, var(--rule) 6px, transparent 6px, transparent 11px)",
          }}
        />
      </div>

      {/* Bottom: dados do ingresso */}
      <div className="min-w-0 space-y-3 p-4 sm:p-5">
        <div
          className="flex min-w-0 items-center gap-3 text-[12px]"
          style={{ color: "var(--mute)" }}
        >
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Clock size={12} className="shrink-0" style={{ color: "var(--pulse-deep)" }} />
            <span className="truncate">
              {formatDate(eventDate, { dateStyle: "long", timeStyle: "short" })}
            </span>
          </span>
        </div>
        {local && (
          <div
            className="flex min-w-0 items-center gap-1.5 text-[12px]"
            style={{ color: "var(--mute)" }}
          >
            <MapPin size={12} className="shrink-0" style={{ color: "var(--mute)" }} />
            <span className="truncate">{local}</span>
          </div>
        )}

        <div
          className="flex items-end justify-between border-t pt-3"
          style={{ borderColor: "var(--rule)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
            >
              <TicketIcon size={16} />
            </div>
            <div>
              <p
                className="font-mono text-base leading-none font-bold"
                style={{ color: "var(--ink)" }}
              >
                {order.ticketCount}
                <span
                  className="ml-1 text-[10px] font-medium tracking-wider uppercase"
                  style={{ color: "var(--mute)" }}
                >
                  {order.ticketCount === 1 ? "ingresso" : "ingressos"}
                </span>
              </p>
              <p className="mt-1 font-mono text-xs font-bold" style={{ color: "var(--ink-4)" }}>
                {centsToBRL(order.total_cents)}
              </p>
            </div>
          </div>

          <span
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors group-hover:border-[var(--pulse)] group-hover:text-[var(--pulse-deep)]"
            style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
          >
            Ver QR
            <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function Badge({
  children,
  bg,
  color,
  icon,
  pulse = false,
}: {
  children: React.ReactNode
  bg: string
  color: string
  icon: React.ReactNode
  pulse?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md ${
        pulse ? "axon-pulse" : ""
      }`}
      style={{ backgroundColor: bg, color }}
    >
      {icon}
      {children}
    </span>
  )
}
