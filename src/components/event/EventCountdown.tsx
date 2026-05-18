"use client"

import { useEffect, useState } from "react"
import { Clock, Sparkles } from "lucide-react"

interface Props {
  startsAt: string
  compact?: boolean
}

function diff(target: number) {
  const ms = Math.max(0, target - Date.now())
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return { ms, days, hours, mins, secs }
}

/**
 * Banner com contagem regressiva ao vivo até o evento.
 * Compacto = só linha de texto. Expandido = card com unidades.
 */
export function EventCountdown({ startsAt, compact = false }: Props) {
  const target = new Date(startsAt).getTime()
  const [t, setT] = useState(() => diff(target))

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  if (t.ms === 0) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
        style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}
      >
        <Sparkles size={12} />
        Evento começou!
      </div>
    )
  }

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--mute)" }}>
        <Clock size={11} style={{ color: "var(--pulse-deep)" }} />
        {t.days > 0
          ? `${t.days}d ${t.hours}h`
          : t.hours > 0
            ? `${t.hours}h ${t.mins}min`
            : `${t.mins}min`}
      </span>
    )
  }

  const isClose = t.days <= 3

  return (
    <div
      className="relative flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-2xl border p-3 sm:gap-3 sm:p-5"
      style={{
        borderColor: isClose ? "var(--pulse)" : "var(--rule)",
        backgroundColor: "var(--paper-pure)",
        backgroundImage:
          "linear-gradient(135deg, transparent 0%, color-mix(in srgb, var(--pulse) 6%, transparent) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl sm:-top-12 sm:-right-12 sm:h-32 sm:w-32"
        style={{
          backgroundColor: "var(--pulse)",
          opacity: isClose ? 0.25 : 0.12,
        }}
        aria-hidden="true"
      />

      <div className="relative flex min-w-0 items-center gap-2 sm:gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          <Clock size={16} className="sm:hidden" />
          <Clock size={18} className="hidden sm:block" />
        </div>
        <div className="min-w-0">
          <p
            className="text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            {isClose ? "Falta pouco!" : "Contagem regressiva"}
          </p>
          <p className="truncate text-xs font-semibold sm:text-sm" style={{ color: "var(--ink)" }}>
            {isClose
              ? t.days === 0
                ? "Hoje é o dia"
                : t.days === 1
                  ? "Amanhã!"
                  : `Falta${t.days === 1 ? "" : "m"} ${t.days} dias`
              : "até o evento"}
          </p>
        </div>
      </div>

      <div className="relative flex shrink-0 gap-1 sm:gap-2">
        <Unit value={t.days} label="d" />
        <Sep />
        <Unit value={t.hours} label="h" />
        <Sep />
        <Unit value={t.mins} label="m" />
        <Sep />
        <Unit value={t.secs} label="s" />
      </div>
    </div>
  )
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="flex min-w-[36px] flex-col items-center rounded-lg px-1.5 py-1 sm:min-w-[52px] sm:px-2 sm:py-1.5"
      style={{ backgroundColor: "var(--paper-soft)" }}
    >
      <span
        className="font-mono text-base leading-none font-bold tabular-nums sm:text-xl"
        style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
      >
        {value.toString().padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[9px] tracking-wider uppercase" style={{ color: "var(--mute)" }}>
        {label}
      </span>
    </div>
  )
}

function Sep() {
  return (
    <span
      className="self-center font-mono text-base font-bold sm:text-lg"
      style={{ color: "var(--pulse-deep)" }}
    >
      :
    </span>
  )
}
