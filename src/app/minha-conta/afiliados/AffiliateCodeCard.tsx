"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Copy, Check, Link2 } from "lucide-react"

interface Props {
  code: string
  commissionPct: number
}

export function AffiliateCodeCard({ code, commissionPct }: Props) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const sampleUrl = origin ? `${origin}/eventos?via=${code}` : `/eventos?via=${code}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(sampleUrl)
      setCopied(true)
      toast.success("Link copiado")
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  return (
    <div
      className="space-y-4 rounded-2xl border p-5"
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "var(--paper-pure)",
        backgroundImage:
          "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 4%, var(--paper-pure)) 100%)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Seu código
          </p>
          <p
            className="mt-1 font-mono text-3xl font-bold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            {code}
          </p>
        </div>
        <div
          className="rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          {commissionPct}% por venda
        </div>
      </div>

      <div className="space-y-1.5">
        <p
          className="text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--mute)" }}
        >
          Link de exemplo
        </p>
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
        >
          <Link2 size={13} style={{ color: "var(--mute)" }} />
          <p className="flex-1 truncate font-mono text-xs" style={{ color: "var(--ink-4)" }}>
            {sampleUrl}
          </p>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-black/5"
            style={{ color: "var(--ink-4)" }}
            aria-label="Copiar link"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <p className="text-[11px]" style={{ color: "var(--mute)" }}>
        Funciona com qualquer URL de evento:{" "}
        <code style={{ color: "var(--ink)" }}>/eventos/[slug]?via={code}</code>. Os botões de
        compartilhamento já incluem seu código quando você está logado.
      </p>
    </div>
  )
}
