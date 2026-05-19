"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Download, Search, FileDown, ListChecks, Copy } from "lucide-react"

export interface GuestRow {
  ticket_id: string
  status: string
  type_name: string
  lot_name: string
  price_cents: number
  is_half_price: boolean
  holder_name: string
  holder_cpf: string
  buyer_email: string
  buyer_name: string
  order_id: string
  payment_method: string
  paid_at: string | null
  used_at: string | null
}

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

async function copyToClipboard(text: string, label = "ID") {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copiado.`)
  } catch {
    toast.error("Não foi possível copiar.")
  }
}

interface Props {
  eventId: string
  eventTitle: string
  rows: GuestRow[]
}

const COLUMNS = [
  { key: "ticket_id", label: "ticket_id" },
  { key: "status", label: "status" },
  { key: "type_name", label: "tipo" },
  { key: "lot_name", label: "lote" },
  { key: "price_cents", label: "preco_centavos" },
  { key: "is_half_price", label: "meia" },
  { key: "holder_name", label: "titular" },
  { key: "holder_cpf", label: "documento" },
  { key: "buyer_email", label: "comprador_email" },
  { key: "buyer_name", label: "comprador_nome" },
  { key: "order_id", label: "order_id" },
  { key: "payment_method", label: "metodo_pagamento" },
  { key: "paid_at", label: "pago_em" },
  { key: "used_at", label: "usado_em" },
] as const

function escCsv(v: unknown): string {
  const s = (v ?? "").toString().replace(/"/g, '""')
  return /[",\n]/.test(s) ? `"${s}"` : s
}

function rowToCsv(r: GuestRow): string {
  return COLUMNS.map(({ key }) => {
    const v = r[key as keyof GuestRow]
    if (typeof v === "boolean") return v ? "sim" : "nao"
    return escCsv(v ?? "")
  }).join(",")
}

function downloadCsv(rows: GuestRow[], filename: string) {
  const header = COLUMNS.map((c) => c.label).join(",")
  const body = rows.map(rowToCsv).join("\n")
  const bom = "﻿"
  const blob = new Blob([bom + header + "\n" + body], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function GuestsListClient({ eventId, eventTitle, rows }: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "used">("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter === "valid" && r.status !== "valid") return false
      if (statusFilter === "used" && r.status !== "used") return false
      if (!q) return true
      return (
        r.holder_name.toLowerCase().includes(q) ||
        r.holder_cpf.toLowerCase().includes(q) ||
        r.buyer_email.toLowerCase().includes(q) ||
        r.lot_name.toLowerCase().includes(q)
      )
    })
  }, [rows, search, statusFilter])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.ticket_id))

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleAllFiltered() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const r of filtered) next.delete(r.ticket_id)
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const r of filtered) next.add(r.ticket_id)
        return next
      })
    }
  }

  function exportSelected() {
    const ids = selected
    const sel = rows.filter((r) => ids.has(r.ticket_id))
    if (sel.length === 0) return
    const slug = eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 32)
    downloadCsv(sel, `axon-convidados-${slug}-${sel.length}.csv`)
  }
  function exportAllFiltered() {
    if (filtered.length === 0) return
    const slug = eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 32)
    downloadCsv(filtered, `axon-convidados-${slug}-todos.csv`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            style={{ color: "var(--mute)" }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF, e-mail ou lote..."
            className="h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:border-[var(--pulse)]"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-soft)",
              color: "var(--ink)",
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            label="Todos"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            count={rows.length}
          />
          <FilterPill
            label="Válidos"
            active={statusFilter === "valid"}
            onClick={() => setStatusFilter("valid")}
            count={rows.filter((r) => r.status === "valid").length}
          />
          <FilterPill
            label="Usados"
            active={statusFilter === "used"}
            onClick={() => setStatusFilter("used")}
            count={rows.filter((r) => r.status === "used").length}
          />
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              className="h-4 w-4 cursor-pointer rounded border"
              style={{ accentColor: "var(--pulse-deep)" }}
            />
            <span style={{ color: "var(--mute)" }}>Selecionar página ({filtered.length})</span>
          </label>
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[11px] font-bold"
            style={{
              backgroundColor: selected.size > 0 ? "var(--pulse-soft)" : "var(--paper-soft)",
              color: selected.size > 0 ? "var(--pulse-deep)" : "var(--mute)",
            }}
          >
            {selected.size} selecionado{selected.size === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportSelected}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5 disabled:opacity-50"
            style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
          >
            <ListChecks size={12} />
            Exportar selecionados
          </button>
          <button
            type="button"
            onClick={exportAllFiltered}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-transform hover:scale-[1.02] disabled:opacity-50"
            style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
          >
            <FileDown size={12} />
            Exportar todos visíveis (CSV)
          </button>
          <a
            href={`/api/organizador/eventos/${eventId}/export?type=sales`}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5"
            style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
          >
            <Download size={12} />
            CSV completo
          </a>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-10 text-center"
          style={{ borderColor: "var(--rule-strong)" }}
        >
          <p className="text-sm" style={{ color: "var(--mute)" }}>
            {rows.length === 0
              ? "Ainda sem convidados — os primeiros ingressos vendidos aparecem aqui."
              : "Nenhum convidado bate com o filtro."}
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div
            className="hidden grid-cols-[28px_2fr_1.4fr_1fr_0.6fr_0.9fr] gap-3 border-b px-4 py-2 text-[10px] font-semibold tracking-wider uppercase sm:grid"
            style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
          >
            <span />
            <span>Titular · ID</span>
            <span>Lote</span>
            <span>CPF</span>
            <span className="text-center">Status</span>
            <span className="text-right">Comprado em</span>
          </div>
          {filtered.map((r) => {
            const isSel = selected.has(r.ticket_id)
            const isUsed = r.status === "used"
            const isCancelled = r.status === "cancelled"
            return (
              <label
                key={r.ticket_id}
                className="block cursor-pointer border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-black/[0.02] sm:grid sm:grid-cols-[28px_2fr_1.4fr_1fr_0.6fr_0.9fr] sm:items-center sm:gap-3"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: isSel ? "var(--pulse-soft)" : undefined,
                }}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggleOne(r.ticket_id)}
                  className="h-4 w-4 cursor-pointer rounded"
                  style={{ accentColor: "var(--pulse-deep)" }}
                />
                <div className="mt-1 min-w-0 sm:mt-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {r.holder_name || "—"}
                    {r.is_half_price && (
                      <span
                        className="ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase"
                        style={{
                          backgroundColor: "var(--info-soft)",
                          color: "var(--info)",
                        }}
                      >
                        Meia
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[10px]" style={{ color: "var(--mute)" }}>
                    {r.buyer_name && r.buyer_name !== r.holder_name ? `${r.buyer_name} · ` : ""}
                    {r.buyer_email || "—"}
                  </p>
                  {/* IDs e timestamp pra rastreio */}
                  <div
                    className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px]"
                    style={{ color: "var(--mute-2)" }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        copyToClipboard(r.ticket_id, "Ticket ID")
                      }}
                      className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-black/5"
                      title={`Ticket ID: ${r.ticket_id}`}
                    >
                      #{r.ticket_id.slice(0, 8)}
                      <Copy size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        copyToClipboard(r.order_id, "Order ID")
                      }}
                      className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-black/5"
                      title={`Order ID: ${r.order_id}`}
                    >
                      pedido {r.order_id.slice(0, 6)}
                      <Copy size={9} />
                    </button>
                    {r.payment_method && (
                      <span className="rounded bg-black/5 px-1 py-0.5 uppercase">
                        {r.payment_method}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1 truncate text-[11px] sm:mt-0" style={{ color: "var(--ink-4)" }}>
                  {r.type_name} · {r.lot_name}
                </p>
                <p
                  className="mt-1 truncate font-mono text-[11px] sm:mt-0"
                  style={{ color: "var(--mute)" }}
                >
                  {r.holder_cpf || "—"}
                </p>
                <span
                  className="mt-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase sm:mx-auto sm:mt-0"
                  style={{
                    backgroundColor: isUsed
                      ? "var(--success-soft)"
                      : isCancelled
                        ? "var(--danger-soft)"
                        : "var(--paper-soft)",
                    color: isUsed
                      ? "var(--success)"
                      : isCancelled
                        ? "var(--danger)"
                        : "var(--mute)",
                  }}
                >
                  {isUsed ? "Usado" : isCancelled ? "Cancelado" : "Válido"}
                </span>
                <span
                  className="mt-1 font-mono text-[10px] tabular-nums sm:mt-0 sm:text-right"
                  style={{ color: "var(--mute)" }}
                  title={r.paid_at ? new Date(r.paid_at).toISOString() : "Não pago ainda"}
                >
                  {r.paid_at ? dateTimeFmt.format(new Date(r.paid_at)) : "—"}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterPill({
  label,
  active,
  onClick,
  count,
}: {
  label: string
  active: boolean
  onClick: () => void
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
      style={{
        backgroundColor: active ? "var(--ink)" : "var(--paper-soft)",
        color: active ? "var(--pulse)" : "var(--mute)",
      }}
    >
      {label}
      <span
        className="rounded-full px-1.5 font-mono text-[10px]"
        style={{
          backgroundColor: active ? "var(--pulse-soft)" : "transparent",
          color: active ? "var(--pulse-deep)" : "var(--mute-2)",
        }}
      >
        {count}
      </span>
    </button>
  )
}
