"use client"

import { useState, useTransition } from "react"
import { setPaymentMode } from "@/app/admin/actions"
import { toast } from "sonner"
import { Sparkles, ShieldCheck, Loader2 } from "lucide-react"

interface HeaderPaymentModeToggleProps {
  initialMode: "real" | "test"
}

export function HeaderPaymentModeToggle({ initialMode }: HeaderPaymentModeToggleProps) {
  const [mode, setMode] = useState<"real" | "test">(initialMode)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const nextMode = mode === "real" ? "test" : "real"
    startTransition(async () => {
      const res = await setPaymentMode(nextMode)
      if (res.ok) {
        setMode(nextMode)
        toast.success(
          `Gateway alterado para: ${nextMode === "real" ? "Real (Pagar.me)" : "Simulado (Fictício)"}`
        )
      } else {
        toast.error(`Erro ao alterar: ${res.error}`)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase transition-all hover:scale-[1.03] disabled:opacity-50"
      style={{
        backgroundColor: mode === "real" ? "var(--success-soft)" : "var(--pulse-soft)",
        color: mode === "real" ? "var(--success)" : "var(--pulse-deep)",
        border: "1px solid",
        borderColor:
          mode === "real"
            ? "color-mix(in srgb, var(--success) 30%, transparent)"
            : "color-mix(in srgb, var(--pulse) 30%, transparent)",
      }}
      title="Clique para alternar o modo de pagamento global do sistema"
    >
      {pending ? (
        <Loader2 size={11} className="animate-spin" />
      ) : mode === "real" ? (
        <ShieldCheck size={11} />
      ) : (
        <Sparkles size={11} />
      )}
      <span>{mode === "real" ? "Pagam. Real" : "Pagam. Simulado"}</span>
    </button>
  )
}
