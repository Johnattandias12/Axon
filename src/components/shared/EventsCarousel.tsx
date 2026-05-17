import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { centsToBRL, formatDate } from "@/lib/utils"
import { EventsCarouselScroller } from "./EventsCarouselScroller"

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #1a2200 0%, #0d1500 50%, #050b00 100%)",
  "linear-gradient(135deg, #0a0a0b 0%, #14140d 50%, #1f1e08 100%)",
  "linear-gradient(160deg, #0a0a0b 0%, #1c2400 60%, #0a0a0b 100%)",
  "linear-gradient(135deg, #16161a 0%, #0a0a0b 50%, #050507 100%)",
] as const

const CATEGORY_LABEL: Record<string, string> = {
  show: "Show",
  esporte: "Esporte",
  religioso: "Religioso",
  curso: "Curso",
  outro: "Evento",
}

export async function EventsCarousel() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from("events")
    .select(
      `id, slug, title, banner_url, category, venue_name, city, state, starts_at,
       ticket_lots(price_cents, quantity_total, quantity_sold, quantity_reserved)`
    )
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(8)

  const items = (events ?? []).map((event, idx) => {
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
    const totalCount = lots.reduce((sum, l) => sum + l.quantity_total, 0)
    const isUrgent = totalCount > 0 && availableCount > 0 && availableCount / totalCount < 0.15

    const price =
      minPriceCents === undefined
        ? "Em breve"
        : minPriceCents === 0
          ? "Gratuito"
          : `A partir de ${centsToBRL(minPriceCents)}`

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      categoryLabel: CATEGORY_LABEL[event.category] ?? "Evento",
      bannerUrl: event.banner_url,
      gradient: FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]!,
      dateLabel: formatDate(event.starts_at, { dateStyle: "medium" }),
      location: [event.city, event.state].filter(Boolean).join(", ") || event.venue_name || "",
      price,
      isUrgent,
    }
  })

  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed p-10 text-center"
        style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
      >
        <p className="text-sm">
          Nenhum evento publicado por enquanto.{" "}
          <Link
            href="/organizador/comecar"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: "var(--ink)" }}
          >
            Seja o primeiro a publicar.
          </Link>
        </p>
      </div>
    )
  }

  return <EventsCarouselScroller items={items} />
}
