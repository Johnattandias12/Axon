import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { centsToBRL, formatDate } from "@/lib/utils"
import type { Tables } from "@/types/supabase"

interface EventCardProps {
  event: Pick<
    Tables<"events">,
    | "slug"
    | "title"
    | "banner_url"
    | "category"
    | "venue_name"
    | "city"
    | "state"
    | "starts_at"
    | "status"
  > & {
    minPriceCents?: number
    availableCount?: number
  }
}

const categoryLabel: Record<string, string> = {
  show: "Show",
  esporte: "Esporte",
  religioso: "Religioso",
  curso: "Curso",
  outro: "Evento",
}

export function EventCard({ event }: EventCardProps) {
  const isAvailable = event.availableCount === undefined || event.availableCount > 0
  const isLow =
    event.availableCount !== undefined && event.availableCount > 0 && event.availableCount <= 50

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="group block overflow-hidden rounded-xl border transition-all"
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "var(--paper-pure)",
        boxShadow: "var(--shadow-sm)",
        transitionDuration: "var(--duration-normal)",
      }}
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-end p-4"
            style={{
              background: "linear-gradient(135deg, var(--ink-2) 0%, var(--ink-3) 100%)",
            }}
          >
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: "var(--mute-2)", letterSpacing: "0.12em" }}
            >
              {categoryLabel[event.category] ?? "Evento"}
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge
            className="text-xs font-medium"
            style={{
              backgroundColor: "var(--ink)",
              color: "var(--paper)",
              border: "none",
            }}
          >
            {categoryLabel[event.category] ?? "Evento"}
          </Badge>
          {isLow && (
            <Badge
              className="text-xs font-medium"
              style={{
                backgroundColor: "var(--warning-soft)",
                color: "var(--warning)",
                border: "none",
              }}
            >
              Últimos {event.availableCount}
            </Badge>
          )}
          {!isAvailable && (
            <Badge
              className="text-xs font-medium"
              style={{
                backgroundColor: "var(--danger-soft)",
                color: "var(--danger)",
                border: "none",
              }}
            >
              Esgotado
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3
          className="line-clamp-2 text-base leading-tight font-semibold"
          style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
        >
          {event.title}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} style={{ color: "var(--mute)" }} className="shrink-0" />
            <span className="text-xs" style={{ color: "var(--mute)" }}>
              {formatDate(event.starts_at, { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
          {(event.venue_name ?? event.city) && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} style={{ color: "var(--mute)" }} className="shrink-0" />
              <span className="truncate text-xs" style={{ color: "var(--mute)" }}>
                {[event.venue_name, event.city, event.state].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          {event.minPriceCents !== undefined ? (
            <div>
              {event.minPriceCents === 0 ? (
                <span className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                  Gratuito
                </span>
              ) : (
                <div>
                  <span className="text-xs" style={{ color: "var(--mute)" }}>
                    a partir de{" "}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {centsToBRL(event.minPriceCents)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm font-medium" style={{ color: "var(--mute)" }}>
              Ver ingressos
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: "var(--pulse)",
              color: "var(--pulse-ink)",
            }}
          >
            Garantir →
          </span>
        </div>
      </div>
    </Link>
  )
}
