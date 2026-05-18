import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EventCard } from "@/components/event/EventCard"
import { EventCountdown } from "@/components/event/EventCountdown"
import { PremiumTicketCard, type PremiumTicketOrder } from "@/components/event/PremiumTicketCard"
import {
  Ticket as TicketIcon,
  Calendar,
  Sparkles,
  History,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react"

export const metadata: Metadata = { title: "Minha conta" }
export const dynamic = "force-dynamic"

interface OrderEventLike {
  id: string
  title: string
  slug: string
  starts_at: string
  venue_name: string | null
  city: string | null
  state: string | null
  banner_url: string | null
  category: string | null
}

interface OrderRow {
  id: string
  status: string
  total_cents: number
  paid_at: string | null
  created_at: string
  events: OrderEventLike | OrderEventLike[] | null
  tickets: { id: string }[] | null
}

function firstEvent(o: OrderRow): OrderEventLike | null {
  if (!o.events) return null
  return Array.isArray(o.events) ? (o.events[0] ?? null) : o.events
}

function toPremium(o: OrderRow): PremiumTicketOrder | null {
  const ev = firstEvent(o)
  if (!ev) return null
  return {
    id: o.id,
    status: o.status,
    total_cents: o.total_cents,
    paid_at: o.paid_at,
    created_at: o.created_at,
    event: { ...ev },
    ticketCount: (o.tickets ?? []).length,
  }
}

export default async function MinhaContaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta")

  const adminClient = createAdminClient()

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, cpf, role, avatar_url")
      .eq("id", user.id)
      .single(),
    adminClient
      .from("orders")
      .select(
        `id, status, total_cents, paid_at, created_at,
         events(id, title, slug, starts_at, venue_name, city, state, banner_url, category),
         tickets(id)`
      )
      .eq("buyer_id", user.id)
      .in("status", ["paid", "pending"])
      .order("created_at", { ascending: false })
      .limit(40),
  ])

  const allOrders = (orders ?? []) as OrderRow[]
  const now = Date.now()

  const future = allOrders
    .map(toPremium)
    .filter((o): o is PremiumTicketOrder => o !== null)
    .filter((o) => new Date(o.event.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.event.starts_at).getTime() - new Date(b.event.starts_at).getTime())

  const past = allOrders
    .map(toPremium)
    .filter((o): o is PremiumTicketOrder => o !== null)
    .filter((o) => new Date(o.event.starts_at).getTime() < now)
    .sort((a, b) => new Date(b.event.starts_at).getTime() - new Date(a.event.starts_at).getTime())

  // Sugestões de eventos baseadas em categoria
  const userCategories = new Set<string>()
  const ownedEventIds = new Set<string>()
  for (const o of allOrders) {
    const ev = firstEvent(o)
    if (ev) {
      ownedEventIds.add(ev.id)
      if (ev.category) userCategories.add(ev.category)
    }
  }

  type SuggestionEvent = {
    id: string
    slug: string
    title: string
    banner_url: string | null
    category: "show" | "esporte" | "religioso" | "curso" | "outro"
    venue_name: string | null
    city: string | null
    state: string | null
    starts_at: string
    status: "draft" | "published" | "cancelled" | "finished"
    ticket_lots: Array<{
      price_cents: number
      quantity_total: number
      quantity_sold: number
      quantity_reserved: number
    }> | null
  }

  const nowIso = new Date().toISOString()
  let suggestions: SuggestionEvent[] = []
  if (userCategories.size > 0) {
    const { data } = await supabase
      .from("events")
      .select(
        "id, slug, title, banner_url, category, venue_name, city, state, starts_at, status, ticket_lots(price_cents, quantity_total, quantity_sold, quantity_reserved)"
      )
      .eq("status", "published")
      .gte("starts_at", nowIso)
      .in("category", Array.from(userCategories) as Array<SuggestionEvent["category"]>)
      .limit(6)
    suggestions = ((data ?? []) as SuggestionEvent[]).filter((e) => !ownedEventIds.has(e.id))
  } else {
    const { data } = await supabase
      .from("events")
      .select(
        "id, slug, title, banner_url, category, venue_name, city, state, starts_at, status, ticket_lots(price_cents, quantity_total, quantity_sold, quantity_reserved)"
      )
      .eq("status", "published")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(6)
    suggestions = (data ?? []) as SuggestionEvent[]
  }

  // Afiliado ativo?
  let isActiveAffiliate = false
  try {
    const { getAffiliateByUserId } = await import("@/lib/supabase/affiliates-admin")
    const aff = await getAffiliateByUserId(adminClient, user.id)
    isActiveAffiliate = !!aff
  } catch {
    /* migration não aplicada */
  }

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"
  const firstName = profile?.full_name?.split(" ")[0]
  const roleConfig = {
    admin: { label: "Admin", bg: "var(--danger-soft)", color: "var(--danger)" },
    organizer: { label: "Organizador", bg: "var(--pulse-soft)", color: "var(--pulse-deep)" },
    validator: { label: "Validador", bg: "var(--warning-soft)", color: "var(--warning)" },
    buyer: { label: "Comprador", bg: "var(--info-soft)", color: "var(--info)" },
  } as const
  const rk = (profile?.role ?? "buyer") as keyof typeof roleConfig
  const role = roleConfig[rk] ?? roleConfig.buyer

  const nextTicket = future[0]

  return (
    <div className="space-y-8">
      {/* HERO COMPACTO — mobile-first, sem botões enormes */}
      <header
        className="relative overflow-hidden rounded-3xl border p-5 sm:p-7"
        style={{
          borderColor: "var(--rule)",
          backgroundColor: "var(--paper-pure)",
          backgroundImage:
            "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 5%, var(--paper-pure)) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-20 blur-3xl sm:-top-20 sm:-right-20 sm:h-56 sm:w-56"
          style={{ backgroundColor: "var(--pulse)" }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0 sm:h-16 sm:w-16">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "Avatar"} />
            ) : null}
            <AvatarFallback
              className="text-lg font-bold sm:text-xl"
              style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
            >
              {profile?.full_name
                ? profile.full_name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : (user.email?.[0]?.toUpperCase() ?? "U")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase"
              style={{ backgroundColor: role.bg, color: role.color }}
            >
              {role.label}
            </span>
            <h1
              className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              {saudacao}, {firstName ?? "amigo"}
              <span style={{ color: "var(--pulse-deep)" }}>.</span>
            </h1>
            <p className="truncate text-[11px] sm:text-xs" style={{ color: "var(--mute)" }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Atalhos secundários — grid 2-col mobile, row desktop */}
        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Pill href="/minha-conta/seguranca" icon={<ShieldCheck size={12} />} label="Segurança" />
          <Pill href="/eventos" icon={<Calendar size={12} />} label="Eventos" />
          {isActiveAffiliate && (
            <Pill
              href="/minha-conta/afiliados"
              icon={<Sparkles size={12} />}
              label="Afiliados"
              accent
            />
          )}
        </div>
      </header>

      {/* PRÓXIMO INGRESSO EM DESTAQUE com countdown */}
      {nextTicket && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: "var(--pulse-deep)" }} />
              <h2
                className="text-[11px] font-semibold tracking-[0.14em] uppercase"
                style={{ color: "var(--mute)" }}
              >
                Próximo · {nextTicket.event.title}
              </h2>
            </div>
          </div>
          <EventCountdown startsAt={nextTicket.event.starts_at} />
        </section>
      )}

      {/* INGRESSOS PRÓXIMOS — área premium, sempre visível */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon size={14} style={{ color: "var(--pulse-deep)" }} />
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Meus ingressos ({future.length})
            </h2>
          </div>
          {future.length > 0 && (
            <Link
              href="/minha-conta/ingressos"
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--pulse-deep)" }}
            >
              Ver todos <ArrowUpRight size={12} />
            </Link>
          )}
        </div>

        {future.length === 0 ? (
          <EmptyCard
            title="Sem ingressos por enquanto"
            desc="Compre um e ele aparece aqui em destaque, com QR pronto."
            cta={{ label: "Explorar eventos", href: "/eventos" }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {future.slice(0, 4).map((o) => (
              <PremiumTicketCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </section>

      {/* HISTÓRICO — só aparece se tiver */}
      {past.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={14} style={{ color: "var(--mute)" }} />
              <h2
                className="text-sm font-semibold tracking-wider uppercase"
                style={{ color: "var(--mute)" }}
              >
                Histórico ({past.length})
              </h2>
            </div>
            {past.length > 2 && (
              <Link
                href="/minha-conta/ingressos"
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--mute)" }}
              >
                Ver tudo <ArrowUpRight size={12} />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {past.slice(0, 2).map((o) => (
              <PremiumTicketCard key={o.id} order={o} past />
            ))}
          </div>
        </section>
      )}

      {/* SUGESTÕES */}
      {suggestions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "var(--pulse-deep)" }} />
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              {userCategories.size > 0 ? "Pra você" : "Em destaque"}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((event) => {
              const lots = event.ticket_lots ?? []
              const available = lots.filter(
                (l) => l.quantity_total - l.quantity_sold - l.quantity_reserved > 0
              )
              const minPriceCents =
                available.length > 0 ? Math.min(...available.map((l) => l.price_cents)) : undefined
              const availableCount = available.reduce(
                (s, l) => s + (l.quantity_total - l.quantity_sold - l.quantity_reserved),
                0
              )
              return (
                <EventCard key={event.id} event={{ ...event, minPriceCents, availableCount }} />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function Pill({
  href,
  icon,
  label,
  accent = false,
}: {
  href: string
  icon: React.ReactNode
  label: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-black/5"
      style={{
        borderColor: accent ? "var(--pulse)" : "var(--rule)",
        color: accent ? "var(--pulse-deep)" : "var(--ink-4)",
      }}
    >
      {icon}
      {label}
    </Link>
  )
}

function EmptyCard({
  title,
  desc,
  cta,
}: {
  title: string
  desc: string
  cta?: { label: string; href: string }
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-dashed p-8 text-center sm:p-12"
      style={{ borderColor: "var(--rule-strong)" }}
    >
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: "var(--pulse)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
        >
          <TicketIcon size={22} />
        </div>
        <p
          className="mt-4 text-base font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
        >
          {title}
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm" style={{ color: "var(--mute)" }}>
          {desc}
        </p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            {cta.label}
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </div>
  )
}
