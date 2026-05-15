import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { TicketCard } from "@/components/event/TicketCard"
import { TicketPdfButton } from "@/components/event/TicketPdfButton"
import { centsToBRL, formatDate } from "@/lib/utils"
import { ChevronLeft, CheckCircle2, Sparkles } from "lucide-react"

export const metadata: Metadata = { title: "Meu ingresso · AXON" }

export default async function PedidoPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar?redirectTo=/minha-conta/ingressos/${orderId}`)

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal_cents, service_fee_cents, total_cents, paid_at, created_at,
       events(title, slug, starts_at, venue_name, city, state, category, banner_url),
       order_items(quantity, unit_price_cents,
         ticket_lots(name, ticket_type_id, ticket_types(name))
       ),
       tickets(id, qr_hash, holder_name, holder_cpf, is_half_price, status, ticket_lot_id,
         ticket_lots(name, price_cents, ticket_types(name))
       )`
    )
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .single()

  if (!order) notFound()

  const event = Array.isArray(order.events) ? order.events[0] : order.events
  if (!event) notFound()

  const tickets = order.tickets ?? []

  return (
    <div className="space-y-8">
      <Link
        href="/minha-conta"
        className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
        style={{ color: "var(--mute)" }}
      >
        <ChevronLeft size={14} />
        Minha conta
      </Link>

      {/* Success header */}
      <div
        className="axon-fade-up relative overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: "var(--rule)",
          backgroundColor: "var(--paper-pure)",
          backgroundImage:
            "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 8%, var(--paper-pure)) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "var(--pulse)" }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              <CheckCircle2 size={18} />
            </div>
            <p
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: "var(--success)" }}
            >
              Compra confirmada
            </p>
          </div>
          <h1
            className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            Você está dentro!
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--mute)" }}>
            {tickets.length} {tickets.length === 1 ? "ingresso" : "ingressos"} para{" "}
            <strong style={{ color: "var(--ink)" }}>{event.title}</strong>
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href={`/eventos/${event.slug}`}
              className="rounded-xl border px-4 py-2 text-xs font-semibold transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
            >
              Ver evento
            </Link>
            <TicketPdfButton
              eventTitle={event.title}
              eventDate={formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" })}
              eventLocation={[event.venue_name, event.city, event.state].filter(Boolean).join(" · ")}
              orderId={order.id}
              tickets={tickets.map((t) => {
                const lot = Array.isArray(t.ticket_lots) ? t.ticket_lots[0] : t.ticket_lots
                const tt = lot && Array.isArray(lot.ticket_types) ? lot.ticket_types[0] : lot?.ticket_types
                return {
                  id: t.id,
                  qr_hash: t.qr_hash,
                  holder_name: t.holder_name,
                  holder_cpf: t.holder_cpf,
                  type_name: tt?.name ?? "Ingresso",
                  lot_name: lot?.name ?? "",
                  is_half_price: t.is_half_price,
                }
              })}
            />
          </div>
        </div>
      </div>

      {/* Tickets */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={14} style={{ color: "var(--pulse)" }} />
          <h2
            className="text-sm font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Seus ingressos
          </h2>
        </div>
        <div className="space-y-4">
          {tickets.map((ticket, idx) => {
            const lot = Array.isArray(ticket.ticket_lots)
              ? ticket.ticket_lots[0]
              : ticket.ticket_lots
            const ticketType =
              lot && Array.isArray(lot.ticket_types) ? lot.ticket_types[0] : lot?.ticket_types
            return (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                event={event}
                typeName={ticketType?.name ?? "Ingresso"}
                lotName={lot?.name ?? ""}
                pricePaidCents={lot?.price_cents ?? 0}
                index={idx}
                total={tickets.length}
              />
            )
          })}
        </div>
      </div>

      {/* Receipt */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <h3
          className="mb-4 text-sm font-semibold tracking-wider uppercase"
          style={{ color: "var(--mute)" }}
        >
          Resumo da compra
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between" style={{ color: "var(--mute)" }}>
            <dt>Pedido</dt>
            <dd className="font-mono text-xs">{order.id.slice(0, 13)}</dd>
          </div>
          <div className="flex justify-between" style={{ color: "var(--mute)" }}>
            <dt>Data</dt>
            <dd>{formatDate(order.paid_at ?? order.created_at)}</dd>
          </div>
          <div className="flex justify-between" style={{ color: "var(--mute)" }}>
            <dt>Subtotal</dt>
            <dd>{centsToBRL(order.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between" style={{ color: "var(--mute)" }}>
            <dt>Taxa de serviço</dt>
            <dd>{centsToBRL(order.service_fee_cents)}</dd>
          </div>
          <div
            className="flex justify-between border-t pt-2 text-base font-bold"
            style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
          >
            <dt>Total</dt>
            <dd className="font-mono">{centsToBRL(order.total_cents)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
