"use client"

import { useState, useTransition } from "react"
import { updateSystemSetting } from "./actions"
import { toast } from "sonner"
import { Settings, Percent, Wallet, DollarSign, Loader2 } from "lucide-react"

interface PlatformSettingsProps {
  initialCommission: string
  initialMinWithdrawal: string
  initialWithdrawalFee: string
}

export function PlatformSettings({
  initialCommission,
  initialMinWithdrawal,
  initialWithdrawalFee,
}: PlatformSettingsProps) {
  const [commission, setCommission] = useState(initialCommission)
  const [minWithdrawal, setMinWithdrawal] = useState((parseFloat(initialMinWithdrawal) / 100).toFixed(2))
  const [withdrawalFee, setWithdrawalFee] = useState((parseFloat(initialWithdrawalFee) / 100).toFixed(2))

  const [pending, startTransition] = useTransition()

  async function handleSaveSetting(key: string, rawVal: string, successMessage: string) {
    let processedValue = rawVal
    if (key === "min_withdrawal_cents" || key === "withdrawal_fee_cents") {
      const cents = Math.round(parseFloat(rawVal.replace(",", ".")) * 100)
      if (isNaN(cents) || cents < 0) {
        toast.error("Por favor, digite um valor numérico válido.")
        return
      }
      processedValue = cents.toString()
    } else if (key === "default_affiliate_commission") {
      const pct = parseFloat(rawVal.replace(",", "."))
      if (isNaN(pct) || pct < 0 || pct > 100) {
        toast.error("Por favor, digite uma porcentagem entre 0 e 100.")
        return
      }
      processedValue = pct.toString()
    }

    startTransition(async () => {
      const res = await updateSystemSetting(key, processedValue)
      if (res.ok) {
        toast.success(successMessage)
      } else {
        toast.error(`Falha ao salvar configuração: ${res.error}`)
      }
    })
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border p-6 shadow-sm transition-all"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div>
        <h2
          className="flex items-center gap-2 text-lg font-semibold"
          style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
        >
          <Settings size={18} className="text-neutral-400" />
          Configurações da Plataforma
        </h2>
        <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
          Defina as comissões padrão e as taxas de repasses para organizadores e afiliados.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Comissão de afiliados */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Comissão Padrão de Afiliados
          </label>
          <div className="relative flex items-center">
            <Percent size={14} className="absolute left-3 text-neutral-500" />
            <input
              type="text"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="5.0"
              className="w-full rounded-xl border py-2.5 pl-9 pr-24 text-sm font-mono transition-colors outline-none focus:border-[var(--pulse)]"
              style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)", color: "var(--ink)" }}
            />
            <button
              onClick={() =>
                handleSaveSetting(
                  "default_affiliate_commission",
                  commission,
                  `Comissão padrão de afiliados definida para ${commission}%`
                )
              }
              disabled={pending}
              className="absolute right-2 rounded-lg px-2.5 py-1 text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              Salvar
            </button>
          </div>
          <span className="text-[10px] text-neutral-500">
            Define a comissão padrão para novos cadastros de afiliados.
          </span>
        </div>

        {/* Saque mínimo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Saque Mínimo (R$)
          </label>
          <div className="relative flex items-center">
            <Wallet size={14} className="absolute left-3 text-neutral-500" />
            <input
              type="text"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(e.target.value)}
              placeholder="50.00"
              className="w-full rounded-xl border py-2.5 pl-9 pr-24 text-sm font-mono transition-colors outline-none focus:border-[var(--pulse)]"
              style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)", color: "var(--ink)" }}
            />
            <button
              onClick={() =>
                handleSaveSetting(
                  "min_withdrawal_cents",
                  minWithdrawal,
                  `Saque mínimo da plataforma definido para R$ ${minWithdrawal}`
                )
              }
              disabled={pending}
              className="absolute right-2 rounded-lg px-2.5 py-1 text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              Salvar
            </button>
          </div>
          <span className="text-[10px] text-neutral-500">
            Valor mínimo em R$ exigido para os organizadores solicitarem saque.
          </span>
        </div>

        {/* Taxa de saque */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Taxa por Saque (R$)
          </label>
          <div className="relative flex items-center">
            <DollarSign size={14} className="absolute left-3 text-neutral-500" />
            <input
              type="text"
              value={withdrawalFee}
              onChange={(e) => setWithdrawalFee(e.target.value)}
              placeholder="6.50"
              className="w-full rounded-xl border py-2.5 pl-9 pr-24 text-sm font-mono transition-colors outline-none focus:border-[var(--pulse)]"
              style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)", color: "var(--ink)" }}
            />
            <button
              onClick={() =>
                handleSaveSetting(
                  "withdrawal_fee_cents",
                  withdrawalFee,
                  `Taxa por saque definida para R$ ${withdrawalFee}`
                )
              }
              disabled={pending}
              className="absolute right-2 rounded-lg px-2.5 py-1 text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              Salvar
            </button>
          </div>
          <span className="text-[10px] text-neutral-500">
            Taxa fixa cobrada do saldo do organizador para processar a transferência bancária.
          </span>
        </div>
      </div>

      {pending && (
        <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "var(--mute)" }}>
          <Loader2 size={12} className="animate-spin text-neutral-400" />
          <span>Salvando alteração no banco de dados...</span>
        </div>
      )}
    </div>
  )
}
