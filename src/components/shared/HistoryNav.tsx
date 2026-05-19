"use client"

import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

export function HistoryNav() {
  const router = useRouter()
  const pathname = usePathname()

  // Não renderiza na página principal para manter o design limpo e evitar redundância
  if (pathname === "/") {
    return null
  }

  return (
    <div
      className="mr-4 hidden items-center gap-1 border-r pr-4 sm:flex"
      style={{ borderColor: "var(--rule)" }}
    >
      <button
        onClick={() => router.back()}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
        aria-label="Voltar"
      >
        <ArrowLeft size={16} style={{ color: "var(--mute)" }} />
      </button>
      <button
        onClick={() => router.forward()}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
        aria-label="Avançar"
      >
        <ArrowRight size={16} style={{ color: "var(--mute)" }} />
      </button>
    </div>
  )
}
