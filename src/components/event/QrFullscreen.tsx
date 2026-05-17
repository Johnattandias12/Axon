"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Maximize2, Sun } from "lucide-react"
import { TicketQrCode } from "./TicketQrCode"

interface Props {
  payload: string
  holderName: string
  eventTitle: string
}

/**
 * Botão que abre o QR em fullscreen, com brilho máximo e instruções claras.
 * Usado na entrada do evento — útil quando o porteiro escaneia em local com pouca luz
 * ou pra dar destaque visual.
 */
export function QrFullscreen({ payload, holderName, eventTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const modal = open && (
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center px-4 py-6"
      style={{ backgroundColor: "#ffffff" }}
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: "#0a0a0b", color: "#fafaf7" }}
        aria-label="Fechar QR Code"
      >
        <X size={18} />
      </button>

      <div className="mb-4 flex items-center gap-1.5">
        <Sun size={14} style={{ color: "#9ccf00" }} />
        <p className="text-xs font-semibold" style={{ color: "#0a0a0b" }}>
          Brilho no máximo · Apresente na entrada
        </p>
      </div>

      <div
        className="rounded-2xl border-4 p-4"
        style={{ borderColor: "#c8ff00", backgroundColor: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <TicketQrCode payload={payload} size={320} />
      </div>

      <div className="mt-6 max-w-xs text-center">
        <p
          className="text-lg font-bold tracking-tight"
          style={{ color: "#0a0a0b", letterSpacing: "-0.02em" }}
        >
          {holderName}
        </p>
        <p className="mt-1 text-sm" style={{ color: "#6b6b70" }}>
          {eventTitle}
        </p>
        <p className="mt-3 font-mono text-[10px] break-all" style={{ color: "#9ca3af" }}>
          {payload}
        </p>
      </div>

      <p className="mt-4 text-xs" style={{ color: "#6b6b70" }}>
        Toque em qualquer lugar para fechar
      </p>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95"
        style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
        aria-label="Ampliar QR Code"
      >
        <Maximize2 size={11} />
        Ampliar QR
      </button>
      {mounted && modal && createPortal(modal, document.body)}
    </>
  )
}
