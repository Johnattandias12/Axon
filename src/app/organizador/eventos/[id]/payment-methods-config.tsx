"use client"

import { useState, useTransition } from "react"
import { updatePaymentMethods } from "./actions"
import { Zap, CreditCard, CheckCircle2, AlertTriangle } from "lucide-react"

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
  { value: 1, label: "Somente à vista (1x)" },
  { value: 2, label: "Até 2x" },
  { value: 3, label: "Até 3x" },
  { value: 6, label: "Até 6x" },
  { value: 12, label: "Até 12x" },
]

// Taxas de conveniência que o comprador paga (calculadas automaticamente)
const CREDIT_CONVENIENCE: Record<number, string> = {
  1: "5% adicional",
  2: "8% adicional",
  3: "10% adicional",
  6: "14% adicional",
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
      <div
        className={`rounded-xl border-2 p-5 transition-colors ${cfg.pix ? "border-lime-400 bg-lime-400/5" : "border-zinc-700 bg-zinc-800/40"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Zap size={20} className="text-lime-400" />
              <h3 className="font-bold text-white">Pix</h3>
              <span className="rounded-full bg-lime-400 px-2 py-0.5 text-xs font-bold text-black">
                Recomendado
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              Aprovação instantânea • Dinheiro disponível em ~2 minutos • Taxa: R${" "}
              {pixConvenienceReais} por pedido
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-lime-400" /> Sem risco de chargeback
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-lime-400" /> Recebimento imediato
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-lime-400" /> Menor taxa ao comprador
              </span>
            </div>
          </div>
          <button
            onClick={() => toggle("pix")}
            className={`relative mt-1 h-6 w-12 flex-shrink-0 rounded-full transition-colors ${cfg.pix ? "bg-lime-400" : "bg-zinc-600"}`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${cfg.pix ? "left-7" : "left-1"}`}
            />
          </button>
        </div>
      </div>

      {/* CARTÃO */}
      <div
        className={`rounded-xl border-2 p-5 transition-colors ${cfg.credit_card ? "border-blue-500 bg-blue-500/5" : "border-zinc-700 bg-zinc-800/40"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-400" />
              <h3 className="font-bold text-white">Cartão de crédito</h3>
              <span className="rounded-full bg-zinc-600 px-2 py-0.5 text-xs font-bold text-zinc-300">
                Opcional
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              Permite parcelamento • Dinheiro em D+15 • Taxa conveniência cobrada do comprador
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400" /> Risco de chargeback
              </span>
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400" /> Recebimento em 15 dias
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-lime-400" /> Mais opções ao comprador
              </span>
            </div>
          </div>
          <button
            onClick={() => toggle("credit_card")}
            className={`relative mt-1 h-6 w-12 flex-shrink-0 rounded-full transition-colors ${cfg.credit_card ? "bg-blue-500" : "bg-zinc-600"}`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${cfg.credit_card ? "left-7" : "left-1"}`}
            />
          </button>
        </div>

        {/* Opções de parcelamento (só mostra se cartão ativo) */}
        {cfg.credit_card && (
          <div className="mt-4 border-t border-zinc-700 pt-4">
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Parcelamento máximo
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {INSTALLMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setCfg((prev) => ({
                      ...prev,
                      max_installments: opt.value as PaymentConfig["max_installments"],
                    }))
                    setSaved(false)
                  }}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${cfg.max_installments === opt.value ? "border-blue-500 bg-blue-500/10 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="mt-0.5 block text-xs opacity-60">
                    {CREDIT_CONVENIENCE[opt.value]} ao comprador
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview de como fica no checkout */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4">
        <p className="mb-3 text-xs font-bold tracking-wider text-zinc-500 uppercase">
          Preview — como o comprador verá
        </p>
        <div className="space-y-2 text-sm">
          {cfg.pix && (
            <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-lime-400" />
                <span className="font-medium text-white">Pix</span>
                <span className="rounded-full border border-lime-400/20 bg-lime-400/10 px-2 py-0.5 text-xs text-lime-400">
                  Aprovação imediata
                </span>
              </div>
              <span className="text-xs text-zinc-400">+ R$ {pixConvenienceReais}</span>
            </div>
          )}
          {cfg.credit_card && (
            <>
              <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-400" />
                  <span className="font-medium text-white">Cartão 1x</span>
                </div>
                <span className="text-xs text-zinc-400">+ {CREDIT_CONVENIENCE[1]}</span>
              </div>
              {cfg.max_installments > 1 && (
                <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-blue-400" />
                    <span className="font-medium text-white">Até {cfg.max_installments}x</span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    + {CREDIT_CONVENIENCE[cfg.max_installments]}
                  </span>
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
          className="rounded-lg bg-lime-400 px-6 py-2.5 font-bold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar configuração"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-lime-400">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Salvo com sucesso
          </span>
        )}
      </div>

      {/* Aviso importante */}
      {!cfg.pix && cfg.credit_card && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-amber-400" />
          <p>
            Somente cartão ativo: o repasse ao organizador ocorre em D+15. Recomendamos manter o Pix
            ativo para recebimento imediato.
          </p>
        </div>
      )}
    </div>
  )
}
