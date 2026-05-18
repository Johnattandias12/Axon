import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { PageHeader } from "@/components/shared/PageHeader"
import { centsToBRL, formatDate } from "@/lib/utils"
import { listAllAffiliates, listAllReferrals } from "@/lib/supabase/affiliates-admin"
import { AdminAffiliateActions } from "./AdminAffiliateActions"
import { DollarSign, TrendingUp, Users, Clock } from "lucide-react"

export const metadata: Metadata = { title: "Afiliados · Admin" }
export const dynamic = "force-dynamic"

export default async function AdminAfiliadosPage() {
  const admin = createAdminClient()

  let affiliates: Awaited<ReturnType<typeof listAllAffiliates>> = []
  let pendingReferrals: Awaited<ReturnType<typeof listAllReferrals>> = []
  let paidReferrals: Awaited<ReturnType<typeof listAllReferrals>> = []
  let migrationMissing = false

  try {
    ;[affiliates, pendingReferrals, paidReferrals] = await Promise.all([
      listAllAffiliates(admin),
      listAllReferrals(admin, "pending", 100),
      listAllReferrals(admin, "paid", 50),
    ])
  } catch {
    migrationMissing = true
  }

  const totalAffiliates = affiliates.length
  const totalPendingCents = pendingReferrals.reduce((s, r) => s + r.commission_cents, 0)
  const totalPaidCents = paidReferrals.reduce((s, r) => s + r.commission_cents, 0)
  const topAffiliate = affiliates[0]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Afiliados · Admin"
        title="Gestão de afiliados"
        description="Veja indicações por afiliado, marque comissões como pagas e acompanhe o top performer."
      />

      {migrationMissing && (
        <div
          className="flex items-start gap-3 rounded-xl border px-4 py-3 text-xs"
          style={{
            borderColor: "var(--warning)",
            backgroundColor: "var(--warning-soft)",
            color: "var(--ink-4)",
          }}
        >
          <span style={{ color: "var(--warning)" }}>⚠</span>
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: "var(--warning)" }}>
              Setup pendente
            </p>
            <p>
              A migration <code>008_affiliates.sql</code> ainda não foi aplicada — o painel mostra
              dados zerados. Rode no Supabase SQL Editor ou via <code>npx supabase db push</code>{" "}
              pra ativar o programa.
            </p>
          </div>
        </div>
      )}

      {migrationMissing ? null : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi
              icon={<Users size={13} />}
              label="Total afiliados"
              value={String(totalAffiliates)}
            />
            <Kpi
              icon={<Clock size={13} />}
              label="Pendente"
              value={centsToBRL(totalPendingCents)}
              accent="var(--warning)"
            />
            <Kpi
              icon={<DollarSign size={13} />}
              label="Pago"
              value={centsToBRL(totalPaidCents)}
              accent="var(--success)"
            />
            <Kpi
              icon={<TrendingUp size={13} />}
              label="Top performer"
              value={topAffiliate ? topAffiliate.code : "—"}
              hint={
                topAffiliate ? `${topAffiliate.total_referrals} indicações` : "Sem afiliados ainda"
              }
            />
          </div>

          {/* Lista de afiliados */}
          <section className="space-y-3">
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Afiliados cadastrados ({affiliates.length})
            </h2>

            {affiliates.length === 0 ? (
              <EmptyBox text="Ainda não há afiliados. Os primeiros aparecerão aqui assim que entrarem no programa." />
            ) : (
              <div
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
              >
                <div
                  className="hidden grid-cols-[1.4fr_0.9fr_0.6fr_0.7fr_0.9fr_0.8fr] gap-3 border-b px-4 py-2 text-[10px] font-semibold tracking-wider uppercase sm:grid"
                  style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
                >
                  <span>Afiliado</span>
                  <span>Código</span>
                  <span className="text-center">%</span>
                  <span className="text-right">Indicações</span>
                  <span className="text-right">Acumulado</span>
                  <span className="text-right">Ação</span>
                </div>
                {affiliates.map((a) => {
                  const pendingFromThis = pendingReferrals.filter((r) => r.affiliate_id === a.id)
                  const pendingTotal = pendingFromThis.reduce((s, r) => s + r.commission_cents, 0)
                  return (
                    <div
                      key={a.id}
                      className="border-b px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[1.4fr_0.9fr_0.6fr_0.7fr_0.9fr_0.8fr] sm:items-center sm:gap-3 sm:text-xs"
                      style={{ borderColor: "var(--rule)" }}
                    >
                      {/* Mobile card */}
                      <div className="space-y-2 sm:hidden">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-semibold"
                              style={{ color: "var(--ink)" }}
                            >
                              {a.profiles?.full_name ?? a.profiles?.email ?? "Usuário"}
                            </p>
                            <p className="truncate text-[11px]" style={{ color: "var(--mute)" }}>
                              {a.profiles?.email ?? "—"}
                            </p>
                          </div>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold"
                            style={{
                              backgroundColor: "var(--pulse-soft)",
                              color: "var(--pulse-deep)",
                            }}
                          >
                            {a.code}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span style={{ color: "var(--mute)" }}>
                            {a.total_referrals} indicações · {a.commission_pct}% por venda
                          </span>
                          <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                            {centsToBRL(a.total_commission_cents)}
                          </span>
                        </div>
                        {pendingTotal > 0 && (
                          <AdminAffiliateActions
                            affiliateId={a.id}
                            pendingCount={pendingFromThis.length}
                            pendingTotalLabel={centsToBRL(pendingTotal)}
                          />
                        )}
                      </div>

                      {/* Desktop linha */}
                      <div className="hidden min-w-0 sm:block">
                        <p className="truncate font-medium" style={{ color: "var(--ink)" }}>
                          {a.profiles?.full_name ?? a.profiles?.email ?? "Usuário"}
                        </p>
                        <p className="truncate text-[10px]" style={{ color: "var(--mute)" }}>
                          {a.profiles?.email ?? "—"}
                        </p>
                      </div>
                      <span
                        className="hidden rounded-full px-2 py-0.5 text-center font-mono font-bold sm:inline-block"
                        style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
                      >
                        {a.code}
                      </span>
                      <span
                        className="hidden text-center sm:inline"
                        style={{ color: "var(--mute)" }}
                      >
                        {a.commission_pct}%
                      </span>
                      <span
                        className="hidden text-right font-mono sm:inline"
                        style={{ color: "var(--ink)" }}
                      >
                        {a.total_referrals}
                      </span>
                      <span
                        className="hidden text-right font-mono font-bold sm:inline"
                        style={{ color: "var(--ink)" }}
                      >
                        {centsToBRL(a.total_commission_cents)}
                      </span>
                      <div className="hidden justify-end sm:flex">
                        {pendingTotal > 0 ? (
                          <AdminAffiliateActions
                            affiliateId={a.id}
                            pendingCount={pendingFromThis.length}
                            pendingTotalLabel={centsToBRL(pendingTotal)}
                          />
                        ) : (
                          <span className="text-[10px]" style={{ color: "var(--mute-2)" }}>
                            sem pendência
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Indicações pendentes */}
          <section className="space-y-3">
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Indicações pendentes ({pendingReferrals.length})
            </h2>

            {pendingReferrals.length === 0 ? (
              <EmptyBox text="Nenhuma indicação pendente. Comissões viram pendentes quando alguém compra usando o link de um afiliado." />
            ) : (
              <div
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
              >
                {pendingReferrals.map((r) => {
                  const rawEvt = r.orders?.events ?? null
                  const evt = Array.isArray(rawEvt) ? rawEvt[0] : rawEvt
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                      style={{ borderColor: "var(--rule)" }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                            style={{
                              backgroundColor: "var(--pulse-soft)",
                              color: "var(--pulse-deep)",
                            }}
                          >
                            {r.affiliates?.code ?? "—"}
                          </span>
                          <p
                            className="truncate text-xs font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            {r.affiliates?.profiles?.full_name ??
                              r.affiliates?.profiles?.email ??
                              "Afiliado"}
                          </p>
                        </div>
                        <p className="mt-1 truncate text-[11px]" style={{ color: "var(--mute)" }}>
                          {evt?.title ?? "Evento"} ·{" "}
                          {formatDate(r.created_at, { dateStyle: "short" })}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: "var(--ink)" }}
                        >
                          {centsToBRL(r.commission_cents)}
                        </span>
                        <AdminAffiliateActions referralId={r.id} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function Kpi({
  icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: string
  hint?: string
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
      {hint && (
        <p className="mt-0.5 truncate text-[10px]" style={{ color: "var(--mute-2)" }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl border border-dashed p-8 text-center"
      style={{ borderColor: "var(--rule-strong)" }}
    >
      <p className="text-xs" style={{ color: "var(--mute)" }}>
        {text}
      </p>
    </div>
  )
}
