"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, CameraOff, Loader2 } from "lucide-react"

interface DetectedBarcode {
  rawValue: string
}

interface BarcodeDetectorCtor {
  new (opts: { formats: string[] }): {
    detect: (src: CanvasImageSource) => Promise<DetectedBarcode[]>
  }
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor
  }
}

type Status = "idle" | "requesting" | "running" | "denied" | "unsupported" | "error"

interface Props {
  onDetect: (value: string) => void
  paused?: boolean
}

/** Leitor contínuo de QR via câmera. Usa BarcodeDetector quando disponível. */
export function QrCameraScanner({ onDetect, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const onDetectRef = useRef(onDetect)
  const pausedRef = useRef(paused)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState<string>("")

  // Mantém callbacks sempre atualizados sem reiniciar o efeito
  onDetectRef.current = onDetect
  pausedRef.current = paused

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let rafId: number | null = null
    let lastValue: { value: string; at: number } | null = null

    async function start() {
      if (typeof window === "undefined") return
      if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported")
        return
      }

      setStatus("requesting")
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current
        if (!video) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        video.srcObject = stream
        video.setAttribute("playsinline", "true")
        await video.play()
        setStatus("running")

        const detector = new window.BarcodeDetector!({ formats: ["qr_code"] })

        const tick = async () => {
          if (cancelled) return
          if (!pausedRef.current && video.readyState >= 2) {
            try {
              const codes = await detector.detect(video)
              if (codes[0]?.rawValue) {
                const v = codes[0].rawValue
                const now = Date.now()
                if (!lastValue || lastValue.value !== v || now - lastValue.at > 2000) {
                  lastValue = { value: v, at: now }
                  onDetectRef.current(v)
                }
              }
            } catch {
              // Frames ruins acontecem — ignorar
            }
          }
          rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
      } catch (err) {
        const e = err as Error
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setStatus("denied")
        } else {
          setStatus("error")
          setErrorMsg(e.message)
        }
      }
    }

    start()

    return () => {
      cancelled = true
      if (rafId !== null) cancelAnimationFrame(rafId)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
        aria-hidden={status !== "running"}
        style={{ display: status === "running" ? "block" : "none" }}
      />
      {status !== "running" && (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center"
          style={{ color: "rgba(250,250,247,0.7)" }}
        >
          {status === "requesting" && (
            <>
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--pulse)" }} />
              <p className="text-xs">Pedindo acesso à câmera…</p>
            </>
          )}
          {status === "denied" && (
            <>
              <CameraOff size={32} style={{ color: "var(--danger)" }} />
              <p className="text-xs font-semibold" style={{ color: "var(--danger)" }}>
                Câmera bloqueada
              </p>
              <p className="text-[10px]">Libere o acesso nas configurações do navegador.</p>
            </>
          )}
          {status === "unsupported" && (
            <>
              <Camera size={32} style={{ color: "rgba(250,250,247,0.4)" }} />
              <p className="text-xs">Câmera indisponível neste dispositivo.</p>
              <p className="text-[10px]">Use o campo abaixo para colar o código manualmente.</p>
            </>
          )}
          {status === "error" && (
            <>
              <CameraOff size={32} style={{ color: "var(--danger)" }} />
              <p className="text-xs font-semibold" style={{ color: "var(--danger)" }}>
                Erro na câmera
              </p>
              {errorMsg && <p className="text-[10px]">{errorMsg}</p>}
            </>
          )}
          {status === "idle" && (
            <>
              <Camera size={32} style={{ color: "rgba(250,250,247,0.4)" }} />
              <p className="text-xs">Iniciando…</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
