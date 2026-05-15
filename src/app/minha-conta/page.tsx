import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileForm } from "./ProfileForm"
import { AvatarUploader } from "@/components/shared/AvatarUploader"
import { EventCard } from "@/components/event/EventCard"
import { centsToBRL, formatDate } from "@/lib/utils"
import {
  Ticket as TicketIcon,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  History,
  Lightbulb,
} from "lucide-react"

export const metadata: Metadata = { title: "Minha conta" }

export default async function MinhaContaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta")

  const nowIso = new Date().toISOString()

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, cpf, role, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
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

  const allOrders = orders ?? []

  const futureOrders = allOrders.filter((o) => {
    const e = Array.isArray(o.events) ? o.events[0] : o.events
    return e && new Date(e.starts_at) >= new Date(nowIso)
  })
  const pastOrders = allOrders.filter((o) => {
    const e = Array.isArray(o.events) ? o.events[0] : o.events
    return e && new Date(e.starts_at) < new Date(nowIso)
  })

  // Sugestões com base no histórico (mesmas categorias)
  const userCategories = new Set<string>()
  const ownedEventIds = new Set<string>()
  for (const o of allOrders) {
    const e = Array.isArray(o.events) ? o.events[0] : o.events
    if (e) {
      ownedEventIds.add(e.id)
      if (e.category) userCategories.add(e.category)
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
      .limit(12)
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
      .limit(8)
    suggestions = (data ?? []) as SuggestionEvent[]
  }

  return (
    <div className="space-y-8">
      {/* Hero do perfil */}
      <div
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "var(--pulse)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6">
          <Avatar className="h-16 w-16">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "Avatar"} />
            ) : null}
            <AvatarFallback
              className="text-xl font-bold"
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
          <div>
            <p
              className="text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--mute)" }}
            >
              Minha conta
            </p>
            <h1
              className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
            >
              {profile?.full_name ? `Olá, ${profile.full_name.split(" ")[0]}` : "Bem-vindo"}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
              {user.email}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            <Mini label="Próximos" value={futureOrders.length.toString()} />
            <Mini label="Histórico" value={pastOrders.length.toString()} />
            <Mini
              label="Sugestões"
              value={suggestions.length.toString()}
              accent="var(--pulse-deep)"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="proximos">
        <TabsList
          className="h-auto w-full justify-start gap-0 rounded-none border-b p-0"
          style={{ backgroundColor: "transparent", borderColor: "var(--rule)" }}
        >
          <TabTrigger value="proximos" icon={<Calendar size={13} />} label="Próximos" />
          <TabTrigger value="historico" icon={<History size={13} />} label="Histórico" />
          <TabTrigger value="sugestoes" icon={<Lightbulb size={13} />} label="Sugestões" />
          <TabTrigger value="dados" icon={<TicketIcon size={13} />} label="Dados" />
        </TabsList>

        <TabsContent value="proximos" className="pt-6">
          {futureOrders.length === 0 ? (
            <EmptyState
              title="Nenhum ingresso futuro"
              desc="Compre um ingresso e ele aparece aqui."
              cta={{ label: "Explorar eventos", href: "/eventos" }}
            />
          ) : (
            <OrdersGrid orders={futureOrders} />
          )}
        </TabsContent>

        <TabsContent value="historico" className="pt-6">
          {pastOrders.length === 0 ? (
            <EmptyState
              title="Você ainda não foi a nenhum evento"
              desc="Seu histórico aparece aqui depois que os eventos acontecerem."
            />
          ) : (
            <OrdersGrid orders={pastOrders} past />
          )}
        </TabsContent>

        <TabsContent value="sugestoes" className="pt-6">
          {suggestions.length === 0 ? (
            <EmptyState
              title="Sem sugestões agora"
              desc="Adicione um evento ao carrinho ou conclua uma compra para receber recomendações."
            />
          ) : (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={14} style={{ color: "var(--pulse-deep)" }} />
                <p className="text-xs" style={{ color: "var(--mute)" }}>
                  {userCategories.size > 0
                    ? "Com base em eventos que você comprou"
                    : "Eventos em destaque"}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((event) => {
                  const lots = event.ticket_lots ?? []
                  const available = lots.filter(
                    (l) => l.quantity_total - l.quantity_sold - l.quantity_reserved > 0
                  )
                  const minPriceCents =
                    available.length > 0
                      ? Math.min(...available.map((l) => l.price_cents))
                      : undefined
                  const availableCount = available.reduce(
                    (s, l) => s + (l.quantity_total - l.quantity_sold - l.quantity_reserved),
                    0
                  )
                  return (
                    <EventCard key={event.id} event={{ ...event, minPriceCents, availableCount }} />
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="dados" className="space-y-8 pt-6">
          <section className="space-y-4">
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Foto do perfil
            </h2>
            <AvatarUploader
              userId={user.id}
              initialUrl={profile?.avatar_url ?? null}
              fullName={profile?.full_name ?? null}
              email={user.email ?? null}
            />
          </section>

          <section>
            <h2
              className="mb-4 text-sm font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Dados pessoais
            </h2>
            <ProfileForm
              userId={user.id}
              initialData={{
                full_name: profile?.full_name ?? "",
                phone: profile?.phone ?? "",
                cpf: profile?.cpf ?? "",
              }}
            />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      className="rounded-xl border px-3 py-2 text-center"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
    >
      <p
        className="font-mono text-lg leading-none font-bold"
        style={{ color: accent ?? "var(--ink)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] tracking-wider uppercase" style={{ color: "var(--mute)" }}>
        {label}
      </p>
    </div>
  )
}

function TabTrigger({
  value,
  icon,
  label,
}: {
  value: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <TabsTrigger
      value={value}
      className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-current"
      style={{ color: "var(--mute)" }}
    >
      {icon}
      {label}
    </TabsTrigger>
  )
}

function EmptyState({
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
      className="rounded-2xl border border-dashed p-12 text-center"
      style={{ borderColor: "var(--rule)" }}
    >
      <TicketIcon size={28} className="mx-auto" style={{ color: "var(--mute-2)" }} />
      <p className="mt-3 text-sm font-medium" style={{ color: "var(--ink)" }}>
        {title}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
        {desc}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          {cta.label}
          <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  )
}

type OrderRow = {
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

function OrdersGrid({ orders, past }: { orders: OrderRow[]; past?: boolean }) {
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
