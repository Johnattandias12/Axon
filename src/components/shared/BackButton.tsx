"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

interface Props {
  fallback?: string
  label?: string
  className?: string
}

/**
 * Botão de voltar transparente com hover suave.
 * Usa router.back() — fallback para uma URL específica se quiser.
 */
export function BackButton({ fallback, label = "Voltar", className = "" }: Props) {
  const router = useRouter()

  function handleClick() {
    if (fallback) {
      // Tenta history.back() — se não houver, vai pro fallback
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push(fallback)
      }
    } else {
      router.back()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all hover:scale-[1.03] hover:border-[var(--pulse)] ${className}`}
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "color-mix(in srgb, var(--paper-pure) 60%, transparent)",
        color: "var(--ink-4)",
      }}
    >
      <ChevronLeft
        size={13}
        className="transition-transform group-hover:-translate-x-0.5"
        style={{ color: "var(--pulse-deep)" }}
      />
      {label}
    </button>
  )
}
