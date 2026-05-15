"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  TrendingUp,
  Download,
  Banknote,
  Building2,
  Filter,
} from "lucide-react"

type TxType = "sale" | "payout" | "refund"
type TxStatus = "approved" | "pending" | "done"

interface Tx {
  id: string
  type: TxType
  desc: string
  amount_cents: number
  date: string
  method: "PIX" | "Cartão" | "TED"
  status: TxStatus
}

// Dados mockados — substituir por TanStack Query quando a API estiver pronta
const MOCK_TX: Tx[] = [
  {
    id: "1",
    type: "sale",
    desc: "Ingresso · Baile da AXON",
    amount_cents: 13200,
    date: "Hoje, 14:32",
    method: "PIX",
    status: "approved",
  },
  {
    id: "2",
    type: "sale",
    desc: "Ingresso · Baile da AXON",
    amount_cents: 6000,
    date: "Hoje, 11:15",
    method: "Cartão",
    status: "approved",
  },
  {
    id: "3",
    type: "payout",
    desc: "Saque · Bradesco S.A.",
    amount_cents: 500000,
    date: "Ontem, 09:00",
    method: "TED",
    status: "done",
  },
  {
    id: "4",
    type: "sale",
    desc: "Ingresso · Baile da AXON",
    amount_cents: 13200,
    date: "Ontem, 22:10",
    method: "PIX",
    status: "approved",
  },
  {
    id: "5",
    type: "refund",
    desc: "Reembolso · Pedido #4291",
    amount_cents: 13200,
    date: "Ontem, 19:02",
    method: "PIX",
    status: "done",
  },
]

const SUMMARY = {
  available_cents: 1245000,
  pending_cents: 523000,
  total_cents: 4589000,
}

function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

const statusLabel: Record<TxStatus, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  done: "Concluído",
}

const statusStyle: Record<TxStatus, { bg: string; text: string }> = {
  approved: { bg: "var(--success-soft)", text: "var(--success)" },
  pending: { bg: "var(--warning-soft)", text: "var(--warning)" },
  done: { bg: "var(--paper-soft)", text: "var(--mute)" },
}

export default function FinanceiroPage() {
  const [filter, setFilter] = useState<"all" | TxType>("all")

  const txs = useMemo(() => {
    if (filter === "all") return MOCK_TX
    return MOCK_TX.filter((t) => t.type === filter)
  }, [filter])

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            Financeiro
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
            Recebíveis, saques e fluxo de caixa.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info("Exportação CSV em breve.")}>
          <Download size={14} className="mr-1.5" />
          Exportar CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={<Wallet size={16} />}
          tone="pulse"
          label="Saldo disponível"
          value={centsToBRL(SUMMARY.available_cents)}
          hint="Pronto para saque"
          action={
            <Button
              size="sm"
              className="w-full"
              style={{
                backgroundColor: "var(--pulse)",
                color: "var(--pulse-ink)",
                fontWeight: 600,
              }}
              onClick={() => toast.success("Solicitação de saque enviada.")}
            >
              Solicitar saque
            </Button>
          }
        />
        <KpiCard
          icon={<Clock size={16} />}
          tone="warning"
          label="A receber"
          value={centsToBRL(SUMMARY.pending_cents)}
          hint="Cartão · prazo de liberação"
          action={
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => toast.info("Antecipação em breve.")}
            >
              Antecipar recebíveis
            </Button>
          }
        />
        <KpiCard
          icon={<TrendingUp size={16} />}
          tone="ink"
          label="Total transacionado"
          value={centsToBRL(SUMMARY.total_cents)}
          hint="Histórico completo"
        />
      </div>

      {/* Transações + Banco */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Histórico */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              Últimas transações
            </h2>
            <div
              className="flex items-center gap-1 rounded-lg border p-0.5"
              style={{ borderColor: "var(--rule)" }}
            >
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                <Filter size={11} /> Todas
              </FilterChip>
              <FilterChip active={filter === "sale"} onClick={() => setFilter("sale")}>
                Vendas
              </FilterChip>
              <FilterChip active={filter === "payout"} onClick={() => setFilter("payout")}>
                Saques
              </FilterChip>
              <FilterChip active={filter === "refund"} onClick={() => setFilter("refund")}>
                Reembolsos
              </FilterChip>
            </div>
          </div>

          {txs.length === 0 ? (
            <div
              className="rounded-xl border border-dashed p-12 text-center"
              style={{ borderColor: "var(--rule)" }}
            >
              <p className="text-sm" style={{ color: "var(--mute)" }}>
                Nenhuma transação no período.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {txs.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>

        {/* Banco */}
        <div className="space-y-4">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Conta bancária
          </h2>

          <div
            className="space-y-3 rounded-xl border p-4"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--paper-soft)", color: "var(--mute)" }}
              >
                <Building2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  Banco Bradesco S.A.
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
                  Ag. 1234 · CC 12345-6
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--mute-2)" }}>
                  CNPJ 00.000.000/0001-00
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Alterar conta
            </Button>
          </div>

          <div
            className="space-y-2 rounded-xl border p-4"
            style={{
              borderColor: "var(--pulse)",
              backgroundColor: "rgba(200,255,0,0.05)",
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  tone,
  action,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone: "pulse" | "warning" | "ink"
  action?: React.ReactNode
}) {
  const accent =
    tone === "pulse" ? "var(--pulse)" : tone === "warning" ? "var(--warning)" : "var(--ink)"
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-4"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
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
      {action}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
      style={{
        backgroundColor: active ? "var(--ink)" : "transparent",
        color: active ? "var(--paper)" : "var(--mute)",
      }}
    >
      {children}
    </button>
  )
}

function TxRow({ tx }: { tx: Tx }) {
  const isInflow = tx.type === "sale"
  const sign = isInflow ? "+" : "−"
  const accent = isInflow ? "var(--success)" : "var(--ink)"
  const iconBg = isInflow ? "var(--success-soft)" : "var(--danger-soft)"
  const iconColor = isInflow ? "var(--success)" : "var(--danger)"
  const style = statusStyle[tx.status]

  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {isInflow ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
          {tx.desc}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
          {tx.date} · {tx.method}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-bold tabular-nums" style={{ color: accent }}>
          {sign} {centsToBRL(tx.amount_cents)}
        </p>
        <Badge
          className="mt-0.5 text-[10px]"
          style={{ backgroundColor: style.bg, color: style.text, border: "none" }}
        >
          {statusLabel[tx.status]}
        </Badge>
      </div>
    </div>
  )
}
