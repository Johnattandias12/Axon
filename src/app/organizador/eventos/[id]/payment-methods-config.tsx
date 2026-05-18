"use client"

import { useState, useTransition } from "react"
import { updatePaymentMethods } from "./actions"

interface PaymentConfig {
  pix: boolean
  credit_card: boolean
  max_installments: 1 | 2 | 3 | 6 | 12
  convenience_fee_pix_cents: number
  convenience_fee_credit_pct: number
}

interface Props {
  eventId: string
  initialConfig: PaymentConfig
}

const INSTALLMENT_OPTIONS = [
  { value: 1,  label: "Somente à vista (1x)" },
  { value: 2,  label: "Até 2x" },
  { value: 3,  label: "Até 3x" },
  { value: 6,  label: "Até 6x" },
  { value: 12, label: "Até 12x" },
]

// Taxas de conveniência que o comprador paga (calculadas automaticamente)
const CREDIT_CONVENIENCE: Record<number, string> = {
  1:  "5% adicional",
  2:  "8% adicional",
  3:  "10% adicional",
  6:  "14% adicional",
  12: "20% adicional",
}

export function PaymentMethodsConfig({ eventId, initialConfig }: Props) {
  const [cfg, setCfg] = useState<PaymentConfig>(initialConfig)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggle(field: "pix" | "credit_card") {
    // Ao menos um meio precisa estar ativo
    const next = { ...cfg, [field]: !cfg[field] }
    if (!next.pix && !next.credit_card) return
    setCfg(next)
    setSaved(false)
  }

  function save() {
    startTransition(async () => {
      await updatePaymentMethods(eventId, cfg)
      setSaved(true)
    })
  }

  const pixConvenienceReais = (cfg.convenience_fee_pix_cents / 100).toFixed(2)

  return (
    <div className="space-y-6">
      {/* PIX */}
      <div className={`rounded-xl border-2 p-5 transition-colors ${cfg.pix ? "border-lime-400 bg-lime-400/5" : "border-zinc-700 bg-zinc-800/40"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⚡</span>
              <h3 className="font-bold text-white">Pix</h3>
              <span className="text-xs bg-lime-400 text-black font-bold px-2 py-0.5 rounded-full">Recomendado</span>
            </div>
            <p className="text-sm text-zinc-400">
              Aprovação instantânea • Dinheiro disponível em ~2 minutos • Taxa: R$ {pixConvenienceReais} por pedido
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
              <span>✅ Sem risco de chargeback</span>
              <span>✅ Recebimento imediato</span>
              <span>✅ Menor taxa ao comprador</span>
            </div>
          </div>
          <button
            onClick={() => toggle("pix")}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-1 ${cfg.pix ? "bg-lime-400" : "bg-zinc-600"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cfg.pix ? "left-7" : "left-1"}`} />
          </button>
        </div>
      </div>

      {/* CARTÃO */}
      <div className={`rounded-xl border-2 p-5 transition-colors ${cfg.credit_card ? "border-blue-500 bg-blue-500/5" : "border-zinc-700 bg-zinc-800/40"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">💳</span>
              <h3 className="font-bold text-white">Cartão de crédito</h3>
              <span className="text-xs bg-zinc-600 text-zinc-300 font-bold px-2 py-0.5 rounded-full">Opcional</span>
            </div>
            <p className="text-sm text-zinc-400">
              Permite parcelamento • Dinheiro em D+15 • Taxa conveniência cobrada do comprador
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
              <span>⚠️ Risco de chargeback</span>
              <span>⚠️ Recebimento em 15 dias</span>
              <span>✅ Mais opções ao comprador</span>
            </div>
          </div>
          <button
            onClick={() => toggle("credit_card")}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-1 ${cfg.credit_card ? "bg-blue-500" : "bg-zinc-600"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cfg.credit_card ? "left-7" : "left-1"}`} />
          </button>
        </div>

        {/* Opções de parcelamento (só mostra se cartão ativo) */}
        {cfg.credit_card && (
          <div className="mt-4 pt-4 border-t border-zinc-700">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Parcelamento máximo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INSTALLMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setCfg(prev => ({ ...prev, max_installments: opt.value as PaymentConfig["max_installments"] })); setSaved(false) }}
                  className={`text-left p-3 rounded-lg border text-sm transition-colors ${cfg.max_installments === opt.value ? "border-blue-500 bg-blue-500/10 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="block text-xs mt-0.5 opacity-60">{CREDIT_CONVENIENCE[opt.value]} ao comprador</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview de como fica no checkout */}
      <div className="rounded-xl bg-zinc-800/60 border border-zinc-700 p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-3">Preview — como o comprador verá</p>
        <div className="space-y-2 text-sm">
          {cfg.pix && (
            <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span className="text-white font-medium">Pix</span>
                <span className="text-xs bg-lime-400/10 text-lime-400 border border-lime-400/20 px-2 py-0.5 rounded-full">Aprovação imediata</span>
              </div>
              <span className="text-zinc-400 text-xs">+ R$ {pixConvenienceReais}</span>
            </div>
          )}
          {cfg.credit_card && (
            <>
              <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span>💳</span>
                  <span className="text-white font-medium">Cartão 1x</span>
                </div>
                <span className="text-zinc-400 text-xs">+ {CREDIT_CONVENIENCE[1]}</span>
              </div>
              {cfg.max_installments > 1 && (
                <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span>💳</span>
                    <span className="text-white font-medium">Até {cfg.max_installments}x</span>
                  </div>
                  <span className="text-zinc-400 text-xs">+ {CREDIT_CONVENIENCE[cfg.max_installments]}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Botão salvar */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={isPending}
          className="bg-lime-400 text-black font-bold px-6 py-2.5 rounded-lg hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Salvando..." : "Salvar configuração"}
        </button>
        {saved && (
          <span className="text-sm text-lime-400 flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Salvo com sucesso
          </span>
        )}
      </div>

      {/* Aviso importante */}
      {!cfg.pix && cfg.credit_card && (
        <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p>Somente cartão ativo: o repasse ao organizador ocorre em D+15. Recomendamos manter o Pix ativo para recebimento imediato.</p>
        </div>
      )}
    </div>
  )
}
