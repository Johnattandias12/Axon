import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TicketCard } from "@/components/event/TicketCard"
import { TicketActions } from "@/components/event/TicketActions"
import { TicketPdfButton } from "@/components/event/TicketPdfButton"
import { ShareEventButtons } from "@/components/event/ShareEventButtons"
import { CopyLinkButton } from "@/components/event/CopyLinkButton"
import { CelebrateOnMount } from "@/components/shared/CelebrateOnMount"
import { PageBackLink } from "@/components/shared/PageHeader"
import { EventCountdown } from "@/components/event/EventCountdown"
import { centsToBRL, formatDate } from "@/lib/utils"
import { CheckCircle2, Sparkles, AlertCircle } from "lucide-react"

export const metadata: Metadata = { title: "Meu ingresso · AXON" }
export const dynamic = "force-dynamic"

/**
 * Detalhe do pedido (pós-compra).
 * Resiliente a migrations não aplicadas — divide em queries pequenas
 * com .select específicos para não quebrar se transfer_token/refund_requested_at
 * ainda não existirem no schema produtivo.
 */
export default async function PedidoPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar?redirectTo=/minha-conta/ingressos/${orderId}`)

  const admin = createAdminClient()

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select(
      "id, buyer_id, status, subtotal_cents, service_fee_cents, total_cents, paid_at, created_at, event_id"
    )
    .eq("id", orderId)
    .maybeSingle()

  if (orderErr) console.error("[order page] orderErr:", orderErr)

  if (!order || order.buyer_id !== user.id) {
    return <OrderNotFound orderId={orderId} reason={orderErr?.message} />
  }

  const { data: event, error: eventErr } = await admin
    .from("events")
    .select("id, title, slug, starts_at, venue_name, city, state, category, banner_url")
    .eq("id", order.event_id)
    .maybeSingle()
  if (eventErr) console.error("[order page] eventErr:", eventErr)
  if (!event) return <OrderNotFound orderId={orderId} reason="Evento não encontrado." />

  // Tickets básicos primeiro (sem colunas de migration 007)
  const { data: ticketsRaw, error: ticketsErr } = await admin
    .from("tickets")
    .select("id, qr_hash, holder_name, holder_cpf, is_half_price, status, ticket_lot_id")
    .eq("order_id", order.id)

  if (ticketsErr) console.error("[order page] ticketsErr:", ticketsErr)

  const tickets = ticketsRaw ?? []

  // Lots + types em queries separadas (mais barato e estável)
  const lotIds = Array.from(
    new Set(tickets.map((t) => t.ticket_lot_id).filter(Boolean))
  ) as string[]
  let lotMap = new Map<
    string,
    { name: string; price_cents: number; ticket_type_id: string | null }
  >()
  let typeMap = new Map<string, string>()
  if (lotIds.length > 0) {
    const { data: lots } = await admin
      .from("ticket_lots")
      .select("id, name, price_cents, ticket_type_id")
      .in("id", lotIds)
    for (const l of lots ?? []) lotMap.set(l.id, l)

    const typeIds = Array.from(
      new Set((lots ?? []).map((l) => l.ticket_type_id).filter(Boolean))
    ) as string[]
    if (typeIds.length > 0) {
      const { data: types } = await admin.from("ticket_types").select("id, name").in("id", typeIds)
      for (const t of types ?? []) typeMap.set(t.id, t.name)
    }
  }

  // Transfer + refund (opcionais — só carrega se as colunas existirem)
  const ticketExtras = new Map<
    string,
    { transferToken: string | null; refundRequestedAt: string | null }
  >()
  try {
    const { data: extras } = await admin
      .from("tickets")
      .select("id, transfer_token, refund_requested_at")
      .eq("order_id", order.id)
    for (const e of extras ?? []) {
      ticketExtras.set(e.id, {
        transferToken: e.transfer_token ?? null,
        refundRequestedAt: e.refund_requested_at ?? null,
      })
    }
  } catch {
    // Migration 007 não aplicada — segue sem transfer/refund
  }

  const justBought = order.paid_at && Date.now() - new Date(order.paid_at).getTime() < 2 * 60 * 1000

  return (
    <div className="space-y-6 sm:space-y-8">
      {justBought && (
        <CelebrateOnMount id={order.id} message="Compra confirmada — bora pro evento!" />
      )}
      <PageBackLink href="/minha-conta" label="Minha conta" />

      {/* Success header */}
      <div
        className="axon-fade-up relative overflow-hidden rounded-3xl border p-5 sm:p-8"
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
            Você está dentro.
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--mute)" }}>
            {tickets.length} {tickets.length === 1 ? "ingresso" : "ingressos"} para{" "}
            <strong style={{ color: "var(--ink)" }}>{event.title}</strong>
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href={`/eventos/${event.slug}`}
              className="cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02] hover:bg-black/5 active:scale-95"
              style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
            >
              Ver evento
            </Link>
            <TicketPdfButton
              eventTitle={event.title}
              eventDate={formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" })}
              eventLocation={[event.venue_name, event.city, event.state]
                .filter(Boolean)
                .join(" · ")}
              orderId={order.id}
              tickets={tickets.map((t) => {
                const lot = lotMap.get(t.ticket_lot_id ?? "")
                const typeName = lot?.ticket_type_id ? typeMap.get(lot.ticket_type_id) : null
                return {
                  id: t.id,
                  qr_hash: t.qr_hash,
                  holder_name: t.holder_name,
                  holder_cpf: t.holder_cpf,
                  type_name: typeName ?? "Ingresso",
                  lot_name: lot?.name ?? "",
                  is_half_price: t.is_half_price,
                }
              })}
            />
            <CopyLinkButton eventSlug={event.slug} />
            <ShareEventButtons
              eventTitle={event.title}
              eventSlug={event.slug}
              buyerName={tickets[0]?.holder_name ?? null}
            />
          </div>
        </div>
      </div>

      <EventCountdown startsAt={event.starts_at} />

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
            const lot = lotMap.get(ticket.ticket_lot_id ?? "")
            const typeName = lot?.ticket_type_id ? typeMap.get(lot.ticket_type_id) : null
            const extras = ticketExtras.get(ticket.id)
            return (
              <div key={ticket.id} className="space-y-2">
                <TicketCard
                  ticket={ticket}
                  event={event}
                  typeName={typeName ?? "Ingresso"}
                  lotName={lot?.name ?? ""}
                  pricePaidCents={lot?.price_cents ?? 0}
                  index={idx}
                  total={tickets.length}
                />
                <div
                  className="rounded-xl border p-3"
                  style={{
                    borderColor: "var(--rule)",
                    backgroundColor: "var(--paper-pure)",
                  }}
                >
                  <TicketActions
                    ticketId={ticket.id}
                    status={ticket.status}
                    hasTransferToken={!!extras?.transferToken}
                    hasRefundRequest={!!extras?.refundRequestedAt}
                  />
                </div>
              </div>
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

function OrderNotFound({ orderId, reason }: { orderId: string; reason?: string }) {
  return (
    <div className="mx-auto max-w-md space-y-5 py-16 text-center">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}
      >
        <AlertCircle size={26} />
      </div>
      <h1
        className="text-xl font-bold tracking-tight"
        style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
      >
        Pedido não localizado
      </h1>
      <p className="text-sm" style={{ color: "var(--mute)" }}>
        Não encontramos o pedido <code className="font-mono">{orderId.slice(0, 13)}</code> na sua
        conta. Se você acabou de comprar, dê um instante e atualize a página. Se o problema
        persistir, fale com a gente.
      </p>
      {reason && (
        <p className="font-mono text-[11px]" style={{ color: "var(--mute-2)" }}>
          {reason}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/minha-conta"
          className="cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02] hover:bg-black/5 active:scale-95"
          style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
        >
          Minha conta
        </Link>
        <Link
          href="/eventos"
          className="cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          Ver eventos
        </Link>
      </div>
    </div>
  )
}
