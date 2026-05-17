"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface Props {
  payload: string
  size?: number
}

/**
 * Renderiza o QR Code do ingresso client-side via lib `qrcode`.
 * Mais confiável que SSR (evita problemas de hidratação com SVG inline)
 * e dá feedback de loading.
 */
export function TicketQrCode({ payload, size = 256 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const QRCode = (await import("qrcode")).default
        if (cancelled || !canvasRef.current) return
        await QRCode.toCanvas(canvasRef.current, payload, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: size,
          color: { dark: "#0a0a0b", light: "#ffffff" },
        })
        setReady(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao gerar QR")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [payload, size])

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="h-full w-full"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s ease" }}
      />
      {!ready && !error && (
        <Loader2
          size={28}
          className="absolute animate-spin"
          style={{ color: "var(--pulse-deep)" }}
        />
      )}
      {error && (
        <p className="absolute px-2 text-center text-[10px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  )
}
