"use client"

import { useState, useTransition } from "react"
import { setPaymentMode } from "./actions"
import { toast } from "sonner"
import { ShieldCheck, CreditCard, Sparkles, Loader2, AlertCircle } from "lucide-react"

interface PaymentModeToggleProps {
  initialMode: "real" | "test"
  hasApiKey: boolean
}

export function PaymentModeToggle({ initialMode, hasApiKey }: PaymentModeToggleProps) {
  const [mode, setMode] = useState<"real" | "test">(initialMode)
  const [pending, startTransition] = useTransition()

  function handleToggle(newMode: "real" | "test") {
    if (newMode === mode) return

    if (newMode === "real" && !hasApiKey) {
      toast.error(
        "PAGARME_API_KEY não está configurada no servidor. Não é possível ativar o modo real."
      )
      return
    }

    startTransition(async () => {
      const res = await setPaymentMode(newMode)
      if (res.ok) {
        setMode(newMode)
        toast.success(
          `Modo de pagamento alterado para: ${newMode === "real" ? "Produção (Real)" : "Simulado (Fictício)"}`
        )
      } else {
        toast.error(`Falha ao alterar modo: ${res.error}`)
      }
    })
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border p-6 shadow-sm transition-all"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className="flex items-center gap-2 text-lg font-semibold"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            <ShieldCheck size={18} className="text-neutral-400" />
            Gateway de Pagamento
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
            Defina o fluxo de checkout dos compradores entre transações reais ou simulação fictícia.
          </p>
        </div>

        {!hasApiKey && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
            style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}
          >
            <AlertCircle size={10} /> API Key Ausente
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Real / Production Mode Card */}
        <button
          type="button"
          onClick={() => handleToggle("real")}
          disabled={pending || !hasApiKey}
          className="group relative flex flex-col items-start rounded-xl border p-4 text-left transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            borderColor: mode === "real" ? "var(--success)" : "var(--rule)",
            backgroundColor:
              mode === "real"
                ? "color-mix(in srgb, var(--success) 4%, var(--paper-pure))"
                : "transparent",
            boxShadow: mode === "real" ? "0 0 16px rgba(0, 185, 107, 0.05)" : "none",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                backgroundColor: mode === "real" ? "var(--success-soft)" : "var(--paper-soft)",
                color: mode === "real" ? "var(--success)" : "var(--mute)",
              }}
            >
              <CreditCard size={16} />
            </div>
            <div>
              <p
                className="text-xs font-bold"
                style={{ color: mode === "real" ? "var(--ink)" : "var(--ink-4)" }}
              >
                Modo Produção (Real)
              </p>
              <span className="text-[10px] font-medium text-neutral-500">Gateway Pagar.me Pix</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
            Processa transações financeiras reais via PIX. Exige que as chaves de API e Webhooks
            estejam corretamente configurados no ambiente.
          </p>
          {mode === "real" && (
            <span
              className="absolute top-4 right-4 h-2.5 w-2.5 animate-pulse rounded-full"
              style={{ backgroundColor: "var(--success)" }}
            />
          )}
        </button>

        {/* Test / Simulado Mode Card */}
        <button
          type="button"
          onClick={() => handleToggle("test")}
          disabled={pending}
          className="group relative flex flex-col items-start rounded-xl border p-4 text-left transition-all hover:scale-[1.01]"
          style={{
            borderColor: mode === "test" ? "var(--pulse)" : "var(--rule)",
            backgroundColor:
              mode === "test"
                ? "color-mix(in srgb, var(--pulse) 4%, var(--paper-pure))"
                : "transparent",
            boxShadow: mode === "test" ? "0 0 16px rgba(200, 255, 0, 0.05)" : "none",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                backgroundColor: mode === "test" ? "var(--pulse-soft)" : "var(--paper-soft)",
                color: mode === "test" ? "var(--pulse)" : "var(--mute)",
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <p
                className="text-xs font-bold"
                style={{ color: mode === "test" ? "var(--ink)" : "var(--ink-4)" }}
              >
                Modo Simulado (Teste)
              </p>
              <span className="text-[10px] font-medium text-neutral-500">Pagamento Fictício</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
            Gera dados de Pix fictícios e permite aprovação instantânea no checkout para fins de
            testes rápidos do fluxo, sem mover dinheiro real.
          </p>
          {mode === "test" && (
            <span
              className="absolute top-4 right-4 h-2.5 w-2.5 animate-pulse rounded-full"
              style={{ backgroundColor: "var(--pulse)" }}
            />
          )}
        </button>
      </div>

      {pending && (
        <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "var(--mute)" }}>
          <Loader2 size={12} className="animate-spin text-neutral-400" />
          <span>Alterando configuração no banco de dados...</span>
        </div>
      )}
    </div>
  )
}
