import {
  RESULT_LABEL,
  RESULT_COLOR,
  type CheckInRow,
  type CheckInStats,
} from "@/lib/check-ins/queries"
import { ScanLine, CheckCircle2, AlertCircle, Activity } from "lucide-react"

interface Props {
  rows: CheckInRow[]
  stats: CheckInStats
}

/**
 * Dashboard reutilizável de check-ins: KPIs, gráfico por hora (24h),
 * top portões e lista paginada por scroll. Server-only (não tem state).
 */
export function CheckInsDashboard({ rows, stats }: Props) {
  const maxByHour = Math.max(1, ...stats.byHour)
  const topGates = Array.from(stats.byGate.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          icon={<ScanLine size={13} />}
          label="Total scans"
          value={stats.total.toLocaleString("pt-BR")}
        />
        <Kpi
          icon={<CheckCircle2 size={13} />}
          label="Válidos"
          value={stats.valid.toLocaleString("pt-BR")}
          accent="var(--success)"
        />
        <Kpi
          icon={<AlertCircle size={13} />}
          label="Rejeitados"
          value={stats.rejected.toLocaleString("pt-BR")}
          accent={stats.rejected > 0 ? "var(--danger)" : "var(--mute)"}
        />
        <Kpi
          icon={<Activity size={13} />}
          label="Taxa válida"
          value={`${stats.validRate}%`}
          accent="var(--pulse-deep)"
        />
      </div>

      {/* Gráfico de barras 24h */}
      {stats.total > 0 && (
        <section
          className="rounded-2xl border p-4 sm:p-5"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3
              className="text-[11px] font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Scans nas últimas 24h
            </h3>
            <span className="text-[10px]" style={{ color: "var(--mute-2)" }}>
              {stats.byHour.reduce((s, n) => s + n, 0)} no período
            </span>
          </div>
          <div className="flex h-24 items-end gap-[3px]">
            {stats.byHour.map((n, i) => {
              const h = Math.round((n / maxByHour) * 100)
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-colors"
                  style={{
                    height: `${Math.max(2, h)}%`,
                    backgroundColor: n > 0 ? "var(--pulse)" : "var(--paper-soft)",
                    opacity: n > 0 ? 0.85 : 0.5,
                  }}
                  title={`-${23 - i}h: ${n}`}
                />
              )
            })}
          </div>
          <div
            className="mt-2 flex justify-between font-mono text-[9px]"
            style={{ color: "var(--mute-2)" }}
          >
            <span>-24h</span>
            <span>-12h</span>
            <span>agora</span>
          </div>
        </section>
      )}

      {/* Top portões */}
      {topGates.length > 0 && (
        <section className="space-y-2">
          <h3
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Portões mais ativos
          </h3>
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            {topGates.map(([gate, count], i) => (
              <div
                key={gate + i}
                className="flex items-center justify-between border-b px-4 py-2 last:border-b-0"
                style={{ borderColor: "var(--rule)" }}
              >
                <span className="font-mono text-xs" style={{ color: "var(--ink)" }}>
                  {gate}
                </span>
                <span
                  className="font-mono text-sm font-bold tabular-nums"
                  style={{ color: "var(--pulse-deep)" }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lista de check-ins */}
      <section className="space-y-3">
        <h3
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--mute)" }}
        >
          Últimos {rows.length} scans
        </h3>
        {rows.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed p-10 text-center"
            style={{ borderColor: "var(--rule-strong)" }}
          >
            <p className="text-sm" style={{ color: "var(--mute)" }}>
              Nenhum check-in ainda. Vai aparecer aqui quando o porteiro escanear o primeiro QR.
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            {rows.map((r) => {
              const ev = Array.isArray(r.events) ? r.events[0] : r.events
              const validator = Array.isArray(r.validators) ? r.validators[0] : r.validators
              const ticket = Array.isArray(r.tickets) ? r.tickets[0] : r.tickets
              const color = RESULT_COLOR[r.result] ?? RESULT_COLOR.cancelled
              const ts = new Date(r.scanned_at)
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-1 gap-2 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
                  style={{ borderColor: "var(--rule)" }}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                        style={{ backgroundColor: color?.bg, color: color?.color }}
                      >
                        {RESULT_LABEL[r.result] ?? r.result}
                      </span>
                      <span
                        className="truncate text-xs font-semibold"
                        style={{ color: "var(--ink)" }}
                      >
                        {ev?.title ?? "Evento removido"}
                      </span>
                    </div>
                    <p className="truncate text-[11px]" style={{ color: "var(--mute)" }}>
                      {ticket?.holder_name ?? "—"}
                      {r.gate ? ` · portão ${r.gate}` : ""}
                      {validator?.full_name || validator?.email
                        ? ` · ${validator.full_name ?? validator.email}`
                        : ""}
                      {r.offline_synced ? " · offline-sync" : ""}
                    </p>
                  </div>
                  <span
                    className="shrink-0 font-mono text-[11px] tabular-nums sm:text-right"
                    style={{ color: "var(--mute)" }}
                    title={ts.toISOString()}
                  >
                    {ts.toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function Kpi({
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
