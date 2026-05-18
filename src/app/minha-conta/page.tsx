import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfileForm } from "./ProfileForm"
import { AvatarUploader } from "@/components/shared/AvatarUploader"
import { EventCard } from "@/components/event/EventCard"
import { EventCountdown } from "@/components/event/EventCountdown"
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
      .select("full_name, phone, cpf, role, avatar_url, birth_date")
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

  return (
    <div className="space-y-8">
      {/* Hero do perfil */}
      <div
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-10"
        style={{
          borderColor: "var(--rule)",
          backgroundColor: "var(--paper-pure)",
          backgroundImage:
            "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 4%, var(--paper-pure)) 100%)",
        }}
      >
        {/* Glow decorativo */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: "var(--pulse)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-8 blur-3xl"
          style={{ backgroundColor: "var(--pulse-deep)" }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Avatar grande */}
          <div className="relative">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "Avatar"} />
              ) : null}
              <AvatarFallback
                className="text-2xl font-bold sm:text-3xl"
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
            {/* Pulse ring sutil */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-offset-2"
              style={
                {
                  "--tw-ring-color": "color-mix(in srgb, var(--pulse) 50%, transparent)",
                  "--tw-ring-offset-color": "var(--paper-pure)",
                } as React.CSSProperties
              }
            />
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="h-px w-6"
                style={{ background: "linear-gradient(90deg, transparent, var(--pulse))" }}
              />
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                style={{ backgroundColor: role.bg, color: role.color }}
              >
                {role.label}
              </span>
            </div>
            <h1
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: "var(--ink)", letterSpacing: "-0.035em" }}
            >
              {saudacao}, {firstName ?? "amigo"}
              <span style={{ color: "var(--pulse-deep)" }}>.</span>
            </h1>
            <p className="text-sm" style={{ color: "var(--mute)" }}>
              {user.email}
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-col">
            <Link
              href="/eventos"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-transform hover:scale-[1.03] sm:flex-initial"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              <Calendar size={14} />
              Explorar eventos
            </Link>
            <Link
              href="/carrinho"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5 sm:flex-initial"
              style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
            >
              <TicketIcon size={14} />
              Meu carrinho
            </Link>
            <Link
              href="/minha-conta/afiliados"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5 sm:flex-initial"
              style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
            >
              <Sparkles size={14} />
              Programa de afiliados
            </Link>
          </div>
        </div>

        {/* Stats em linha */}
        <div
          className="relative mt-6 grid grid-cols-3 gap-2 border-t pt-5 sm:gap-3"
          style={{ borderColor: "var(--rule)" }}
        >
          <Mini
            label="Próximos"
            value={futureOrders.length.toString()}
            accent="var(--pulse-deep)"
          />
          <Mini label="Histórico" value={pastOrders.length.toString()} />
          <Mini label="Sugestões" value={suggestions.length.toString()} accent="var(--info)" />
        </div>
      </div>

      <Tabs defaultValue="proximos" className="flex flex-col gap-6">
        <div className="-mx-1 [scrollbar-width:none] overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden">
          <TabsList
            className="h-auto w-max min-w-full justify-start gap-0 rounded-none border-b p-0"
            style={{ backgroundColor: "transparent", borderColor: "var(--rule)" }}
          >
            <TabTrigger value="proximos" icon={<Calendar size={13} />} label="Próximos" />
            <TabTrigger value="historico" icon={<History size={13} />} label="Histórico" />
            <TabTrigger value="sugestoes" icon={<Sparkles size={13} />} label="Sugestões" />
            <TabTrigger value="dados" icon={<TicketIcon size={13} />} label="Dados" />
            <TabTrigger value="seguranca" icon={<Lightbulb size={13} />} label="Segurança" />
          </TabsList>
        </div>

        <TabsContent value="proximos" className="pt-6">
          {futureOrders.length === 0 ? (
            <EmptyState
              title="Nenhum ingresso futuro"
              desc="Compre um ingresso e ele aparece aqui."
              cta={{ label: "Explorar eventos", href: "/eventos" }}
            />
          ) : (
            <div className="space-y-5">
              {/* Countdown do próximo evento */}
              {(() => {
                const next = futureOrders
                  .map((o) => {
                    const e = Array.isArray(o.events) ? o.events[0] : o.events
                    return e
                  })
                  .filter((e): e is NonNullable<typeof e> => !!e)
                  .sort(
                    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
                  )[0]
                if (!next) return null
                return (
                  <div className="space-y-2">
                    <p
                      className="text-[11px] font-semibold tracking-[0.12em] uppercase"
                      style={{ color: "var(--mute)" }}
                    >
                      Próximo evento · {next.title}
                    </p>
                    <EventCountdown startsAt={next.starts_at} />
                  </div>
                )
              })()}
              <OrdersGrid orders={futureOrders} />
            </div>
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
                birth_date: profile?.birth_date ?? "",
              }}
            />
          </section>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-8 pt-6">
          <section>
            <h2
              className="mb-4 text-sm font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Segurança e Acesso
            </h2>
            <div className="max-w-md rounded-xl border p-5" style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Mudar senha</p>
              <p className="text-xs mt-1 mb-4" style={{ color: "var(--mute)" }}>
                Se você faz login com email e senha, pode enviar um link de redefinição para o seu email.
              </p>
              <form action="/api/auth/reset-password" method="POST">
                <input type="hidden" name="email" value={user.email} />
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  style={{ backgroundColor: "var(--paper-pure)", color: "var(--ink)", border: "1px solid var(--rule)" }}
                >
                  Enviar link de redefinição
                </Button>
              </form>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      className="rounded-2xl border px-2 py-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] sm:px-3"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
    >
      <p
        className="font-mono text-xl leading-none font-bold sm:text-2xl"
        style={{ color: accent ?? "var(--ink)", letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
      <p
        className="mt-1.5 text-[10px] font-medium tracking-wider uppercase"
        style={{ color: "var(--mute)" }}
      >
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
      className="flex shrink-0 items-center gap-1.5 rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-semibold transition-colors data-[state=active]:border-current data-[state=active]:text-foreground sm:px-3 sm:py-4 sm:text-[15px]"
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
      className="relative overflow-hidden rounded-3xl border border-dashed p-14 text-center"
      style={{ borderColor: "var(--rule-strong)" }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: "var(--pulse)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
        >
          <TicketIcon size={26} />
        </div>
        <p
          className="mt-4 text-lg font-bold tracking-tight"
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
