import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PageHeader } from "@/components/shared/PageHeader"
import { GuestsListClient, type GuestRow } from "./GuestsListClient"
import { Users } from "lucide-react"

export const metadata: Metadata = { title: "Convidados · Organizador" }
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

interface RawTicket {
  id: string
  holder_name: string | null
  holder_cpf: string | null
  is_half_price: boolean
  status: string
  used_at: string | null
  orders:
    | {
        id: string
        payment_method: string | null
        paid_at: string | null
        profiles:
          | { email: string | null; full_name: string | null }
          | Array<{ email: string | null; full_name: string | null }>
          | null
      }
    | Array<{
        id: string
        payment_method: string | null
        paid_at: string | null
        profiles:
          | { email: string | null; full_name: string | null }
          | Array<{ email: string | null; full_name: string | null }>
          | null
      }>
    | null
  ticket_lots:
    | {
        name: string | null
        price_cents: number
        ticket_types: { name: string | null } | { name: string | null }[] | null
      }
    | Array<{
        name: string | null
        price_cents: number
        ticket_types: { name: string | null } | { name: string | null }[] | null
      }>
    | null
}

export default async function ConvidadosPage({ params }: PageProps) {
  const { id: eventId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar?redirectTo=/organizador/eventos/${eventId}/convidados`)

  const admin = createAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin"

  const { data: event } = await admin
    .from("events")
    .select("id, title, organizer_id, starts_at, venue_name, city, state")
    .eq("id", eventId)
    .maybeSingle()

  if (!event) {
    return (
      <div className="space-y-4">
        <PageHeader
          back={{ href: "/organizador/eventos", label: "Eventos" }}
          title="Evento não encontrado"
        />
      </div>
    )
  }

  // Ownership check
  if (!isAdmin) {
    const { data: organizer } = await admin
      .from("organizers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
    if (!organizer || (organizer as { id: string }).id !== event.organizer_id) {
      redirect("/organizador")
    }
  }

  const { data: tickets } = await admin
    .from("tickets")
    .select(
      `id, holder_name, holder_cpf, is_half_price, status, used_at,
       orders(id, payment_method, paid_at,
         profiles!buyer_id(email, full_name)),
       ticket_lots(name, price_cents, ticket_types(name))`
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })

  function firstOrSelf<T>(v: T | T[] | null | undefined): T | undefined {
    if (!v) return undefined
    return Array.isArray(v) ? v[0] : v
  }
  const rows: GuestRow[] = ((tickets as RawTicket[] | null) ?? []).map((t) => {
    const order = firstOrSelf(t.orders)
    const lot = firstOrSelf(t.ticket_lots)
    const tt = lot ? firstOrSelf(lot.ticket_types) : undefined
    const buyer = order ? firstOrSelf(order.profiles) : undefined
    return {
      ticket_id: t.id,
      status: t.status,
      type_name: tt?.name ?? "",
      lot_name: lot?.name ?? "",
      price_cents: lot?.price_cents ?? 0,
      is_half_price: t.is_half_price,
      holder_name: t.holder_name ?? "",
      holder_cpf: t.holder_cpf ?? "",
      buyer_email: buyer?.email ?? "",
      buyer_name: buyer?.full_name ?? "",
      order_id: order?.id ?? "",
      payment_method: order?.payment_method ?? "",
      paid_at: order?.paid_at ?? null,
      used_at: t.used_at ?? null,
    }
  })

  const total = rows.length
  const used = rows.filter((r) => r.status === "used").length
  const half = rows.filter((r) => r.is_half_price).length

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/organizador/eventos/${eventId}`, label: event.title }}
        eyebrow="Convidados"
        title={`${total} ${total === 1 ? "ingresso" : "ingressos"}`}
        description={
          total === 0
            ? "Quando alguém comprar, aparece aqui pronto pra exportar."
            : `${used} já passaram pela porta · ${half} meia-entrada`
        }
        actions={
          <Link
            href={`/organizador/eventos/${eventId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
          >
            <Users size={12} />
            Visão geral
          </Link>
        }
      />

      <GuestsListClient eventId={eventId} eventTitle={event.title} rows={rows} />
    </div>
  )
}
