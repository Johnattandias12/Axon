"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

export function HistoryNav() {
  const router = useRouter()

  return (
    <div className="hidden sm:flex items-center gap-1 mr-4 border-r pr-4" style={{ borderColor: "var(--rule)" }}>
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
