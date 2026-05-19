import Link from "next/link"
import Image from "next/image"
import { centsToBRL, formatDate } from "@/lib/utils"
import { CheckCircle2, Ticket as TicketIcon } from "lucide-react"

export type OrderRow = {
  id: string
  status: string
  total_cents: number
  paid_at: string | null
  created_at: string
  events:
    | {
        id: string
        title: string
        slug: string
        starts_at: string
        venue_name: string | null
        city: string | null
        banner_url: string | null
      }
    | {
        id: string
        title: string
        slug: string
        starts_at: string
        venue_name: string | null
        city: string | null
        banner_url: string | null
      }[]
    | null
  tickets: { id: string }[] | null
}

export function OrdersGrid({ orders, past }: { orders: OrderRow[]; past?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {orders.map((order) => {
        const event = Array.isArray(order.events) ? order.events[0] : order.events
        const ticketCount = (order.tickets ?? []).length
        if (!event) return null
        return (
          <Link
            key={order.id}
            href={`/minha-conta/ingressos/${order.id}`}
            className="group relative overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-pure)",
              opacity: past ? 0.85 : 1,
            }}
          >
            <div className="flex gap-4 p-4">
              <div
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl"
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
                    style={{ background: "linear-gradient(135deg, var(--ink), var(--ink-3))" }}
                  >
                    <TicketIcon size={20} style={{ color: "var(--pulse)" }} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {order.status === "paid" && (
                    <CheckCircle2 size={12} style={{ color: "var(--success)" }} />
                  )}
                  <p
                    className="text-[10px] font-semibold tracking-wider uppercase"
                    style={{
                      color: past
                        ? "var(--mute)"
                        : order.status === "paid"
                          ? "var(--success)"
                          : "var(--mute)",
                    }}
                  >
                    {past ? "Encerrado" : order.status === "paid" ? "Confirmado" : "Pendente"}
                  </p>
                </div>
                <p
                  className="mt-0.5 line-clamp-2 text-sm font-semibold"
                  style={{ color: "var(--ink)" }}
                >
                  {event.title}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: "var(--mute)" }}>
                  {formatDate(event.starts_at, { dateStyle: "medium" })}
                  {event.city ? ` · ${event.city}` : ""}
                </p>
                <div
                  className="mt-2 flex items-center justify-between border-t pt-2"
                  style={{ borderColor: "var(--rule)" }}
                >
                  <span className="text-[10px] font-medium" style={{ color: "var(--mute)" }}>
                    {ticketCount} {ticketCount === 1 ? "ingresso" : "ingressos"}
                  </span>
                  <span className="font-mono text-xs font-bold" style={{ color: "var(--ink)" }}>
                    {centsToBRL(order.total_cents)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
