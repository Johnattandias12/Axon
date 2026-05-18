import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { centsToBRL, formatDate } from "@/lib/utils"
import { SiteHeader } from "@/components/shared/SiteHeader"
import { CartItemRow } from "@/components/cart/CartItemRow"
import { CheckoutForm } from "@/components/cart/CheckoutForm"
import { PageBackLink } from "@/components/shared/PageHeader"
import { ShoppingBag, Calendar, MapPin, Sparkles, ArrowRight } from "lucide-react"

export const metadata: Metadata = { title: "Carrinho · AXON" }

export default async function CarrinhoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/carrinho")

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase
      .from("cart_items")
      .select(
        `id, quantity, added_at, ticket_lot_id,
       ticket_lots(id, name, price_cents, is_half_price, quantity_total, quantity_sold, quantity_reserved,
         ticket_types(name),
         events(id, slug, title, starts_at, venue_name, city, state, banner_url, status))`
      )
      .eq("user_id", user.id)
      .order("added_at", { ascending: false }),
    supabase.from("profiles").select("full_name, cpf").eq("id", user.id).single(),
  ])

  const list = items ?? []

  // Calcula totais
  let subtotal = 0
  for (const item of list) {
    const lot = Array.isArray(item.ticket_lots) ? item.ticket_lots[0] : item.ticket_lots
    if (lot) subtotal += lot.price_cents * item.quantity
  }
  const fee = Math.round(subtotal * 0.1)
  const total = subtotal + fee
  const totalItems = list.reduce((s, i) => s + i.quantity, 0)

  // Agrupa por evento
  const byEvent = new Map<
    string,
    { event: NonNullable<Awaited<ReturnType<typeof getEvent>>>; items: typeof list }
  >()
  function getEvent(it: (typeof list)[number]) {
    const lot = Array.isArray(it.ticket_lots) ? it.ticket_lots[0] : it.ticket_lots
    if (!lot) return null
    return Array.isArray(lot.events) ? lot.events[0] : lot.events
  }
  for (const item of list) {
    const evt = getEvent(item)
    if (!evt) continue
    const cur = byEvent.get(evt.id)
    if (cur) cur.items.push(item)
    else byEvent.set(evt.id, { event: evt, items: [item] })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 space-y-3">
          <PageBackLink href="/eventos" label="Continuar comprando" />
          <div className="flex items-center gap-2">
            <span
              className="h-px w-8"
              style={{ background: "linear-gradient(90deg, transparent, var(--pulse))" }}
            />
            <p
              className="text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--mute)" }}
            >
              Carrinho
            </p>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--ink)", letterSpacing: "-0.035em" }}
          >
            {totalItems > 0
              ? totalItems === 1
                ? "1 noite na sua mão"
                : `${totalItems} noites na sua mão`
              : "Seu carrinho"}
          </h1>
        </div>

        {list.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {Array.from(byEvent.values()).map(({ event, items: evItems }) => (
                <EventGroup key={event.id} event={event} items={evItems} />
              ))}
            </div>

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
                  className="absolute top-0 right-0 left-0 h-[2px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, var(--pulse) 50%, transparent 100%)",
                  }}
                  aria-hidden="true"
                />
                <div className="border-b p-5" style={{ borderColor: "var(--rule)" }}>
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={14} style={{ color: "var(--pulse-deep)" }} />
                    <p
                      className="text-xs font-semibold tracking-wider uppercase"
                      style={{ color: "var(--mute)" }}
                    >
                      Resumo
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-5 text-sm">
                  <Row
                    label={`Subtotal · ${totalItems} ${totalItems === 1 ? "ingresso" : "ingressos"}`}
                    value={centsToBRL(subtotal)}
                    muted
                  />
                  <Row label="Taxa AXON (10%)" value={centsToBRL(fee)} muted />
                  <div className="my-2 border-t" style={{ borderColor: "var(--rule)" }} />
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold" style={{ color: "var(--ink)" }}>
                      Total
                    </span>
                    <span
                      className="font-mono text-2xl font-bold"
                      style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
                    >
                      {centsToBRL(total)}
                    </span>
                  </div>
                </div>

                <div className="border-t p-5" style={{ borderColor: "var(--rule)" }}>
                  <CheckoutForm
                    defaultName={profile?.full_name ?? ""}
                    defaultCpf={profile?.cpf ?? ""}
                  />
                </div>

                <div
                  className="flex items-center justify-center gap-1.5 border-t bg-[var(--paper-soft)] p-3 text-[10px]"
                  style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
                >
                  <Sparkles size={10} />
                  Modo demonstração — sem cobrança real
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: muted ? "var(--mute)" : "var(--ink)" }}>{label}</span>
      <span
        className={muted ? "" : "font-mono"}
        style={{ color: muted ? "var(--mute)" : "var(--ink)" }}
      >
        {value}
      </span>
    </div>
  )
}

interface CartEvent {
  id: string
  slug: string
  title: string
  starts_at: string
  venue_name: string | null
  city: string | null
  state: string | null
  banner_url: string | null
  status: string
}

function EventGroup({
  event,
  items,
}: {
  event: CartEvent
  items: Array<{
    id: string
    quantity: number
    ticket_lots:
      | {
          id: string
          name: string
          price_cents: number
          is_half_price: boolean
          ticket_types: { name: string } | { name: string }[] | null
        }
      | {
          id: string
          name: string
          price_cents: number
          is_half_price: boolean
          ticket_types: { name: string } | { name: string }[] | null
        }[]
      | null
  }>
}) {
  return (
    <section
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      {/* Event header */}
      <div
        className="flex items-center gap-4 border-b p-4"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
      >
        <div
          className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg"
          style={{ backgroundColor: "var(--paper-pure)" }}
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
              <Calendar size={16} style={{ color: "var(--pulse)" }} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/eventos/${event.slug}`}
            className="text-sm font-semibold transition-colors hover:opacity-70"
            style={{ color: "var(--ink)" }}
          >
            {event.title}
          </Link>
          <p
            className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]"
            style={{ color: "var(--mute)" }}
          >
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(event.starts_at, { dateStyle: "medium", timeStyle: "short" })}
            </span>
            {(event.venue_name ?? event.city) && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {[event.venue_name, event.city].filter(Boolean).join(" · ")}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--rule)" }}>
        {items.map((item) => {
          const lot = Array.isArray(item.ticket_lots) ? item.ticket_lots[0] : item.ticket_lots
          if (!lot) return null
          const tt = Array.isArray(lot.ticket_types) ? lot.ticket_types[0] : lot.ticket_types
          return (
            <CartItemRow
              key={item.id}
              itemId={item.id}
              typeName={tt?.name ?? "Ingresso"}
              lotName={lot.name}
              pricePerUnit={lot.price_cents}
              isHalfPrice={lot.is_half_price}
              quantity={item.quantity}
            />
          )
        })}
      </div>
    </section>
  )
}

function EmptyCart() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border p-12 text-center"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: "var(--pulse)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
        >
          <ShoppingBag size={24} />
        </div>
        <h2
          className="mt-4 text-xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
        >
          Carrinho leve. Noite vazia.
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: "var(--mute)" }}>
          Encontra teu evento. Entra.
        </p>
        <Link
          href="/eventos"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02]"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          Bora ver
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
