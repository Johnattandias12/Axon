import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PageHeader } from "@/components/shared/PageHeader"
import { JoinAffiliateButton } from "./JoinAffiliateButton"
import { AffiliateCodeCard } from "./AffiliateCodeCard"
import { centsToBRL, formatDate } from "@/lib/utils"
import { Users, DollarSign, Link2, TrendingUp } from "lucide-react"
import { getAffiliateByUserId, getReferralsForAffiliate } from "@/lib/supabase/affiliates-admin"

export const metadata: Metadata = { title: "Afiliados · AXON" }

export default async function AfiliadosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta/afiliados")

  const admin = createAdminClient()
  const affiliate = await getAffiliateByUserId(admin, user.id)

  const referrals = affiliate ? await getReferralsForAffiliate(admin, affiliate.id, 50) : []
  const pending = referrals.filter((r) => r.status === "pending")

  // Buscar cliques
  const { count: clicksCount } = affiliate 
    ? await admin.from("affiliate_clicks").select("*", { count: 'exact', head: true }).eq("affiliate_id", affiliate.id)
    : { count: 0 }
  
  const clicks = clicksCount || 0
  const ctr = clicks > 0 ? ((affiliate!.total_referrals / clicks) * 100).toFixed(1) : "0.0"

  return (
    <div className="space-y-8">
      <PageHeader
        back={{ href: "/minha-conta", label: "Minha conta" }}
        eyebrow="Programa de afiliados"
        title="Indique e ganhe"
        description={
          affiliate
            ? `Você ganha ${affiliate.commission_pct}% sobre cada ingresso vendido pelo seu link.`
            : "Compartilhe eventos da AXON com seu link único e ganhe comissão a cada venda."
        }
      />

      {!affiliate ? (
        <div
          className="space-y-5 rounded-3xl border p-8 text-center"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-pure)",
            backgroundImage:
              "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 6%, var(--paper-pure)) 100%)",
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            <DollarSign size={24} />
          </div>
          <div>
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              Vire afiliado AXON
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--mute)" }}>
              Você ganha 5% sobre cada ingresso vendido por meio do seu link único.
              O valor não é em dinheiro vivo, ele se converte em Créditos na Plataforma
              para você usar como quiser.
            </p>
          </div>
          <JoinAffiliateButton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={<TrendingUp size={13} />}
              label="Cliques (Visitas)"
              value={String(clicks)}
            />
            <Stat
              icon={<TrendingUp size={13} />}
              label="CTR (Conversão)"
              value={`${ctr}%`}
            />
            <Stat
              icon={<Users size={13} />}
              label="Indicações"
              value={String(affiliate.total_referrals)}
            />
            <Stat
              icon={<DollarSign size={13} />}
              label="Acumulado"
              value={centsToBRL(affiliate.total_commission_cents)}
              accent="var(--pulse-deep)"
            />
            <Stat
              icon={<Link2 size={13} />}
              label="Comissão"
              value={`${affiliate.commission_pct}%`}
            />
          </div>

          <AffiliateCodeCard code={affiliate.code} commissionPct={affiliate.commission_pct} />

          <section className="space-y-3">
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Histórico de indicações
            </h2>

            {referrals.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed p-10 text-center"
                style={{ borderColor: "var(--rule-strong)" }}
              >
                <p className="text-sm" style={{ color: "var(--mute)" }}>
                  Ainda sem indicações. Compartilhe seu link nos próximos eventos.
                </p>
              </div>
            ) : (
              <div
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
              >
                <div
                  className="hidden grid-cols-[1.5fr_1fr_0.8fr_0.7fr] gap-3 border-b px-4 py-2 text-[10px] font-semibold tracking-wider uppercase sm:grid"
                  style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
                >
                  <span>Evento</span>
                  <span>Data</span>
                  <span>Comissão</span>
                  <span className="text-right">Status</span>
                </div>
                {referrals.map((r) => {
                  const order = Array.isArray(r.orders) ? r.orders[0] : r.orders
                  const evt = order && Array.isArray(order.events) ? order.events[0] : order?.events
                  const statusLabel =
                    r.status === "paid" ? "Pago" : r.status === "pending" ? "Pendente" : "Cancelado"
                  const statusColor =
                    r.status === "paid"
                      ? "var(--success)"
                      : r.status === "pending"
                        ? "var(--warning)"
                        : "var(--mute)"
                  return (
                    <div
                      key={r.id}
                      className="border-b px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[1.5fr_1fr_0.8fr_0.7fr] sm:gap-3 sm:text-xs"
                      style={{ borderColor: "var(--rule)" }}
                    >
                      {/* Mobile: card */}
                      <div className="space-y-1.5 sm:hidden">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="line-clamp-2 text-sm font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            {evt?.title ?? "—"}
                          </p>
                          <span
                            className="shrink-0 text-[10px] font-bold tracking-wider uppercase"
                            style={{ color: statusColor }}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--mute)" }}>
                            {formatDate(r.created_at, { dateStyle: "short" })}
                          </span>
                          <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                            {centsToBRL(r.commission_cents)}
                          </span>
                        </div>
                      </div>

                      {/* Desktop: linha da grid */}
                      <span className="hidden truncate sm:inline" style={{ color: "var(--ink)" }}>
                        {evt?.title ?? "—"}
                      </span>
                      <span className="hidden sm:inline" style={{ color: "var(--mute)" }}>
                        {formatDate(r.created_at, { dateStyle: "short" })}
                      </span>
                      <span
                        className="hidden font-mono font-semibold sm:inline"
                        style={{ color: "var(--ink)" }}
                      >
                        {centsToBRL(r.commission_cents)}
                      </span>
                      <span
                        className="hidden text-right text-[10px] font-bold tracking-wider uppercase sm:inline"
                        style={{ color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-xs" style={{ color: "var(--mute-2)" }}>
              Os valores acumulados ficam disponíveis instantaneamente como créditos para compras de ingressos na AXON.
            </p>
          </section>
        </>
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
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
        className="mt-1.5 font-mono text-lg font-bold tabular-nums"
        style={{ color: accent ?? "var(--ink)", letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
    </div>
  )
}
