import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PageHeader } from "@/components/shared/PageHeader"
import { centsToBRL, formatDate } from "@/lib/utils"
import {
  ArrowDownRight,
  Banknote,
  Clock,
  DollarSign,
  TrendingUp,
  Wallet,
  Percent,
  Receipt,
} from "lucide-react"

export const metadata: Metadata = { title: "Financeiro · AXON" }
export const dynamic = "force-dynamic"

const SERVICE_FEE_PCT = 10

interface OrderRow {
  id: string
  total_cents: number
  subtotal_cents: number
  service_fee_cents: number
  paid_at: string | null
  payment_method: string | null
  events:
    | { id: string; title: string; slug: string }
    | { id: string; title: string; slug: string }[]
    | null
}

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/organizador/financeiro")

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id, trade_name")
    .eq("user_id", user.id)
    .single()
  if (!organizer) redirect("/organizador/comecar")

  const admin = createAdminClient()

  // Busca eventos do organizador
  const { data: events } = await admin
    .from("events")
    .select("id, title, slug")
    .eq("organizer_id", organizer.id)
  const eventIds = (events ?? []).map((e) => e.id)

  // Vendas pagas
  let orders: OrderRow[] = []
  if (eventIds.length > 0) {
    const { data } = await admin
      .from("orders")
      .select(
        "id, total_cents, subtotal_cents, service_fee_cents, paid_at, payment_method, events(id, title, slug)"
      )
      .in("event_id", eventIds)
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(100)
    orders = (data ?? []) as OrderRow[]
  }

  // Comissões pagas a afiliados (tolerante a migration 008 ausente)
  let totalAffiliateCommissionCents = 0
  let pendingAffiliateCents = 0
  try {
    const { listAllReferrals } = await import("@/lib/supabase/affiliates-admin")
    const refs = await listAllReferrals(admin, undefined, 500)
    for (const r of refs) {
      const ord = r.orders
      if (!ord) continue
      const evtRaw = Array.isArray(ord.events) ? ord.events[0] : ord.events
      if (!evtRaw) continue
      // Só conta se a order pertence a evento desse organizador
      const orderInOurs =
        eventIds.includes((ord as { id: string }).id) || orders.some((o) => o.id === ord.id)
      if (!orderInOurs) continue
      if (r.status === "paid") totalAffiliateCommissionCents += r.commission_cents
      else if (r.status === "pending") pendingAffiliateCents += r.commission_cents
    }
  } catch {
    // Migration 008 não aplicada — sem afiliados
  }

  // KPIs
  const grossCents = orders.reduce((s, o) => s + o.total_cents, 0)
  const subtotalCents = orders.reduce((s, o) => s + o.subtotal_cents, 0)
  const serviceFeeCents = orders.reduce((s, o) => s + o.service_fee_cents, 0)
  // Líquido = subtotal − comissão afiliado paga. O service_fee é cobrado do comprador (10% sobre subtotal),
  // ou seja, o organizador recebe o subtotal inteiro (salvo afiliados).
  const netToOrganizerCents = subtotalCents - totalAffiliateCommissionCents
  const availableCents = Math.max(0, netToOrganizerCents - 0) // placeholder pagamentos
  const pendingCents = pendingAffiliateCents // comissões ainda devidas

  // Breakdown por evento
  const byEvent = new Map<
    string,
    { title: string; slug: string; gross: number; subtotal: number; orders: number }
  >()
  for (const o of orders) {
    const evt = Array.isArray(o.events) ? o.events[0] : o.events
    if (!evt) continue
    const cur = byEvent.get(evt.id) ?? {
      title: evt.title,
      slug: evt.slug,
      gross: 0,
      subtotal: 0,
      orders: 0,
    }
    cur.gross += o.total_cents
    cur.subtotal += o.subtotal_cents
    cur.orders += 1
    byEvent.set(evt.id, cur)
  }
  const eventBreakdown = Array.from(byEvent.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.gross - a.gross)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financeiro"
        title={`Carteira ${organizer.trade_name ?? "do organizador"}`}
        description="Recebíveis, taxa AXON, comissão de afiliados e líquido pra você."
      />

      {orders.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-10 text-center"
          style={{ borderColor: "var(--rule-strong)" }}
        >
          <Wallet size={26} className="mx-auto" style={{ color: "var(--mute)" }} />
          <p className="mt-3 text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Sem vendas ainda
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
            Quando rolarem as primeiras compras, os valores aparecem aqui — receita bruta, taxa
            AXON, comissão de afiliado e líquido pra sua conta.
          </p>
          <Link
            href="/organizador/eventos"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            Ver meus eventos
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi
              icon={<TrendingUp size={13} />}
              label="Receita bruta"
              value={centsToBRL(grossCents)}
              hint={`${orders.length} pedidos pagos`}
            />
            <Kpi
              icon={<Percent size={13} />}
              label="Taxa AXON"
              value={centsToBRL(serviceFeeCents)}
              hint={`${SERVICE_FEE_PCT}% sobre subtotal`}
              accent="var(--mute)"
            />
            <Kpi
              icon={<DollarSign size={13} />}
              label="Comissão afiliados"
              value={centsToBRL(totalAffiliateCommissionCents)}
              hint={
                pendingAffiliateCents > 0 ? `+ ${centsToBRL(pendingAffiliateCents)} pendentes` : "—"
              }
              accent="var(--info)"
            />
            <Kpi
              icon={<Wallet size={13} />}
              label="Líquido a você"
              value={centsToBRL(netToOrganizerCents)}
              hint="subtotal − afiliados pagos"
              accent="var(--pulse-deep)"
            />
          </div>

          {/* Saldo + Saques (placeholder) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <BigCard
              tone="pulse"
              icon={<Wallet size={16} />}
              label="Saldo disponível"
              value={centsToBRL(availableCents)}
              hint="Pronto para saque"
              cta="Solicitar saque"
              ctaDisabled
            />
            <BigCard
              tone="warning"
              icon={<Clock size={16} />}
              label="A receber"
              value={centsToBRL(pendingCents)}
              hint={pendingAffiliateCents > 0 ? "Comissões pendentes a deduzir" : "Sem pendência"}
            />
            <BigCard
              tone="ink"
              icon={<Receipt size={16} />}
              label="Próximo repasse"
              value="D+1"
              hint="Pix · 24/7 · taxa R$ 3,67"
            />
          </div>

          {/* Receita por evento */}
          {eventBreakdown.length > 0 && (
            <section className="space-y-3">
              <h2
                className="text-sm font-semibold tracking-wider uppercase"
                style={{ color: "var(--mute)" }}
              >
                Receita por evento
              </h2>
              <div
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
              >
                {eventBreakdown.map((e) => {
                  const pct = grossCents > 0 ? Math.round((e.gross / grossCents) * 100) : 0
                  return (
                    <div
                      key={e.id}
                      className="border-b px-4 py-3 last:border-b-0"
                      style={{ borderColor: "var(--rule)" }}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <Link
                          href={`/organizador/eventos/${e.id}`}
                          className="truncate text-sm font-semibold hover:underline"
                          style={{ color: "var(--ink)" }}
                        >
                          {e.title}
                        </Link>
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: "var(--ink)" }}
                        >
                          {centsToBRL(e.gross)}
                        </span>
                      </div>
                      <div
                        className="flex items-center justify-between text-[11px]"
                        style={{ color: "var(--mute)" }}
                      >
                        <span>
                          {e.orders} {e.orders === 1 ? "pedido" : "pedidos"} · subtotal{" "}
                          <strong style={{ color: "var(--ink)" }}>{centsToBRL(e.subtotal)}</strong>
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                        style={{ backgroundColor: "var(--paper-soft)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, var(--pulse), var(--pulse-deep))",
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Últimas transações */}
          <section className="space-y-3">
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Últimas vendas
            </h2>
            <div className="space-y-2">
              {orders.slice(0, 20).map((o) => {
                const evt = Array.isArray(o.events) ? o.events[0] : o.events
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 rounded-xl border p-3"
                    style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}
                    >
                      <ArrowDownRight size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                        {evt?.title ?? "Pedido"}
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: "var(--mute)" }}>
                        {o.paid_at ? formatDate(o.paid_at) : "—"} ·{" "}
                        {(o.payment_method ?? "pix").toUpperCase()}
                      </p>
                    </div>
                    <p
                      className="shrink-0 font-mono text-sm font-bold"
                      style={{ color: "var(--success)" }}
                    >
                      + {centsToBRL(o.total_cents)}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* Regras de saque */}
      <div
        className="space-y-2 rounded-xl border p-4"
        style={{
          borderColor: "var(--pulse)",
          backgroundColor: "color-mix(in srgb, var(--pulse) 6%, var(--paper-pure))",
        }}
      >
        <h3
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--ink)" }}
        >
          <Banknote size={13} />
          Regras de saque
        </h3>
        <ul className="space-y-1 text-xs" style={{ color: "var(--mute)" }}>
          <li>• Saques via PIX caem na hora, 24/7.</li>
          <li>• TED em até 1 dia útil.</li>
          <li>• Taxa: R$ 3,67 por saque.</li>
          <li>• Saque mínimo: R$ 50,00.</li>
          <li>• Comissão de afiliado é deduzida automaticamente do líquido.</li>
        </ul>
      </div>
    </div>
  )
}

function Kpi({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  accent?: string
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div className="flex items-center gap-1.5" style={{ color: "var(--mute)" }}>
        {icon}
        <p className="text-[10px] font-semibold tracking-wider uppercase">{label}</p>
      </div>
      <p
        className="mt-1.5 font-mono text-base font-bold tabular-nums sm:text-lg"
        style={{ color: accent ?? "var(--ink)", letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 truncate text-[10px]" style={{ color: "var(--mute-2)" }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function BigCard({
  icon,
  label,
  value,
  hint,
  tone,
  cta,
  ctaDisabled,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone: "pulse" | "warning" | "ink"
  cta?: string
  ctaDisabled?: boolean
}) {
  const accent =
    tone === "pulse" ? "var(--pulse-deep)" : tone === "warning" ? "var(--warning)" : "var(--ink)"
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-4"
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "var(--paper-pure)",
        backgroundImage:
          tone === "pulse"
            ? "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 6%, var(--paper-pure)) 100%)"
            : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--mute)" }}>
          {label}
        </span>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div>
        <p
          className="font-mono text-2xl font-bold tabular-nums"
          style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
        >
          {value}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--mute-2)" }}>
          {hint}
        </p>
      </div>
      {cta && (
        <button
          type="button"
          disabled={ctaDisabled}
          className="rounded-xl px-3 py-2 text-xs font-bold transition-transform hover:scale-[1.02] disabled:opacity-50"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          {cta} {ctaDisabled ? "(em breve)" : ""}
        </button>
      )}
    </div>
  )
}
