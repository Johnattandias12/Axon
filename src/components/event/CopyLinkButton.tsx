"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Copy, Check } from "lucide-react"

interface Props {
  eventSlug: string
  affiliateCode?: string | null
  variant?: "icon" | "pill"
  className?: string
}

/**
 * Botão pequeno para copiar o link direto do evento — separado do share.
 * `icon`: só ícone (40x40), perfeito ao lado de outros botões em mobile.
 * `pill`: ícone + texto "Copiar link".
 */
export function CopyLinkButton({
  eventSlug,
  affiliateCode,
  variant = "icon",
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const url = `${origin}/eventos/${eventSlug}${affiliateCode ? `?via=${affiliateCode}` : ""}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copiado")
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={copy}
        aria-label="Copiar link do evento"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all hover:bg-black/5 ${className}`}
        style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
      >
        {copied ? <Check size={14} style={{ color: "var(--success)" }} /> : <Copy size={14} />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:bg-black/5 ${className}`}
      style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
    >
      {copied ? <Check size={12} style={{ color: "var(--success)" }} /> : <Copy size={12} />}
      {copied ? "Copiado" : "Copiar link"}
    </button>
  )
}
