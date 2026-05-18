import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { formatDate, centsToBRL } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Pencil, Ticket, Users, Globe, Gift } from "lucide-react"
import { PublishButton } from "./PublishButton"
import { PageBackLink } from "@/components/shared/PageHeader"
import { EventAnalyticsCard } from "@/components/organizer/EventAnalyticsCard"
import { PaymentMethodsConfig } from "./payment-methods-config"

export const metadata: Metadata = { title: "Evento" }

interface Props {
  params: Promise<{ id: string }>
}

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  cancelled: "Cancelado",
  finished: "Encerrado",
}

const statusStyle: Record<string, { bg: string; text: string }> = {
  draft: { bg: "var(--paper-soft)", text: "var(--mute)" },
  published: { bg: "var(--success-soft)", text: "var(--success)" },
  cancelled: { bg: "var(--danger-soft)", text: "var(--danger)" },
  finished: { bg: "var(--ink-3)", text: "var(--paper)" },
}

export default async function EventoDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar")

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!organizer) redirect("/organizador/comecar")

  const { data: event } = await supabase
    .from("events")
    .select(
      `*, ticket_types ( id, name, position, ticket_lots ( id, name, price_cents, quantity_total, quantity_sold, quantity_reserved, is_half_price, position ) )`
    )
    .eq("id", id)
    .eq("organizer_id", organizer.id)
    .single()

  if (!event) notFound()

  const types = (event.ticket_types ?? []).sort((a, b) => a.position - b.position)
  const allLots = types.flatMap((t) => t.ticket_lots ?? [])
  const totalLots = allLots.reduce((s, l) => s + l.quantity_total, 0)
  const halfLots = allLots.filter((l) => l.is_half_price).reduce((s, l) => s + l.quantity_total, 0)
  const halfPct = totalLots > 0 ? Math.round((halfLots / totalLots) * 100) : 0
  const halfOk = halfPct >= 40

  const style = statusStyle[event.status] ?? { bg: "var(--paper-soft)", text: "var(--mute)" }

  return (
    <div className="space-y-6">
      <PageBackLink href="/organizador/eventos" label="Meus eventos" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge
              className="text-xs"
              style={{ backgroundColor: style.bg, color: style.text, border: "none" }}
            >
              {statusLabel[event.status] ?? event.status}
            </Badge>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            {event.title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
            {formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" })}
            {event.city && ` · ${event.city}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.status === "published" && (
            <Button
              render={<Link href={`/eventos/${event.slug}`} target="_blank" />}
              variant="outline"
              size="sm"
            >
              <Globe size={14} className="mr-1.5" />
              Ver página
            </Button>
          )}
          <Button
            render={<Link href={`/organizador/eventos/${id}/editar`} />}
            variant="outline"
            size="sm"
          >
            <Pencil size={14} className="mr-1.5" />
            Editar
          </Button>
        </div>
      </div>

      <Separator style={{ backgroundColor: "var(--rule)" }} />

      {/* Analytics */}
      {event.status === "published" && <EventAnalyticsCard eventId={id} />}

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ActionCard
          href={`/organizador/eventos/${id}/lotes`}
          icon={<Ticket size={16} />}
          label="Ingressos"
          sub={`${allLots.length} lotes`}
        />
        <ActionCard
          href={`/organizador/eventos/${id}/equipe`}
          icon={<Users size={16} />}
          label="Equipe"
          sub="Validadores"
        />
        <ActionCard
          href={`/organizador/eventos/${id}/cortesia`}
          icon={<Gift size={16} />}
          label="Cortesias"
          sub="Lista VIP"
        />
      </div>

      {/* Meia-entrada */}
      <div
        className="space-y-2 rounded-xl border p-4"
        style={{
          borderColor: halfOk || totalLots === 0 ? "var(--rule)" : "var(--warning)",
          backgroundColor: halfOk || totalLots === 0 ? "var(--paper-soft)" : "rgba(232,148,0,0.05)",
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Quota de meia-entrada
          </p>
          <span
            className="font-mono text-sm font-bold"
            style={{ color: halfOk ? "var(--success)" : "var(--warning)" }}
          >
            {halfPct}% {halfOk ? "✓" : "— mín. 40%"}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--rule)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(halfPct, 100)}%`,
              backgroundColor: halfOk ? "var(--success)" : "var(--warning)",
            }}
          />
        </div>
        <p className="text-xs" style={{ color: "var(--mute)" }}>
          {halfLots} de {totalLots} ingressos são meia-entrada · Lei 12.933/2013
        </p>
      </div>

      {/* Resumo de lotes */}
      {types.length > 0 && (
        <div className="space-y-3">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Tipos de ingresso
          </h2>
          {types.map((type) => (
            <div
              key={type.id}
              className="space-y-3 rounded-xl border p-4"
              style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                {type.name}
              </p>
              {(type.ticket_lots ?? [])
                .sort((a, b) => a.position - b.position)
                .map((lot) => {
                  const avail = lot.quantity_total - lot.quantity_sold - lot.quantity_reserved
                  return (
                    <div key={lot.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span style={{ color: "var(--ink)" }}>{lot.name}</span>
                        {lot.is_half_price && (
                          <span
                            className="ml-2 rounded px-1.5 py-0.5 text-xs"
                            style={{
                              backgroundColor: "var(--warning-soft)",
                              color: "var(--warning)",
                            }}
                          >
                            Meia
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: "var(--ink)" }}>
                          {lot.price_cents === 0 ? "Grátis" : centsToBRL(lot.price_cents)}
                        </p>
                        <p className="text-xs" style={{ color: "var(--mute)" }}>
                          {lot.quantity_sold} vendidos · {avail} disponíveis
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      )}

      {/* Meios de Pagamento */}
      <div
        className="space-y-4 rounded-xl border p-5"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
            💳 Meios de pagamento
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
            Defina como os compradores poderão pagar neste evento. As taxas são exibidas de forma transparente no checkout.
          </p>
        </div>
        <PaymentMethodsConfig
          eventId={id}
          initialConfig={(event as any).payment_methods ?? {
            pix: true,
            credit_card: false,
            max_installments: 1,
            convenience_fee_pix_cents: 100,
            convenience_fee_credit_pct: 5,
          }}
        />
      </div>

      {/* Publicar */}
      {event.status === "draft" && (
        <div
          className="flex items-center justify-between gap-4 rounded-xl border p-4"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              Publicar evento
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
              {!halfOk && totalLots > 0
                ? "Adicione meia-entrada suficiente (≥40%) antes de publicar."
                : totalLots === 0
                  ? "Adicione pelo menos um lote antes de publicar."
                  : "Tudo certo. Publique para que os compradores vejam."}
            </p>
          </div>
          <PublishButton eventId={id} disabled={!halfOk || totalLots === 0} />
        </div>
      )}
    </div>
  )
}

function ActionCard({
  href,
  icon,
  label,
  sub,
}: {
  href: string
  icon: React.ReactNode
  label: string
  sub: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:bg-black/3"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div style={{ color: "var(--mute)" }}>{icon}</div>
      <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
        {label}
      </p>
      <p className="text-xs" style={{ color: "var(--mute)" }}>
        {sub}
      </p>
    </Link>
  )
}
