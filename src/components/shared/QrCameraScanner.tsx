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

/**
 * Leitor de QR via câmera.
 * Prefere a API nativa BarcodeDetector (Chrome/Android). No iOS Safari (sem BarcodeDetector),
 * cai pro `jsqr` rodando em canvas a ~10fps — funciona em iPhone moderno.
 */
export function QrCameraScanner({ onDetect, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const onDetectRef = useRef(onDetect)
  const pausedRef = useRef(paused)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState<string>("")

  onDetectRef.current = onDetect
  pausedRef.current = paused

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let rafId: number | null = null
    let timerId: number | null = null
    let lastValue: { value: string; at: number } | null = null

    function emit(v: string) {
      const now = Date.now()
      if (!lastValue || lastValue.value !== v || now - lastValue.at > 2000) {
        lastValue = { value: v, at: now }
        onDetectRef.current(v)
      }
    }

    async function start() {
      if (typeof window === "undefined") return
      if (!navigator.mediaDevices?.getUserMedia) {
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
        video.setAttribute("muted", "true")
        video.muted = true
        await video.play()
        setStatus("running")

        // Caminho rápido: BarcodeDetector nativo (Android Chrome, Desktop Chrome/Edge)
        if (window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] })
          const tick = async () => {
            if (cancelled) return
            if (!pausedRef.current && video.readyState >= 2) {
              try {
                const codes = await detector.detect(video)
                if (codes[0]?.rawValue) emit(codes[0].rawValue)
              } catch {
                // frames ruins acontecem
              }
            }
            rafId = requestAnimationFrame(tick)
          }
          rafId = requestAnimationFrame(tick)
          return
        }

        // Fallback iOS Safari: jsqr a ~10fps via canvas
        const jsQR = (await import("jsqr")).default
        if (cancelled) return
        const canvas = canvasRef.current ?? document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          setStatus("error")
          setErrorMsg("Canvas indisponível")
          return
        }

        const loop = () => {
          if (cancelled) return
          if (!pausedRef.current && video.readyState >= 2 && video.videoWidth > 0) {
            const vw = video.videoWidth
            const vh = video.videoHeight
            // Downscale pra performance no celular — máx 480px no lado maior
            const scale = Math.min(1, 480 / Math.max(vw, vh))
            const w = Math.floor(vw * scale)
            const h = Math.floor(vh * scale)
            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w
              canvas.height = h
            }
            ctx.drawImage(video, 0, 0, w, h)
            try {
              const img = ctx.getImageData(0, 0, w, h)
              const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" })
              if (code?.data) emit(code.data)
            } catch {
              // ignora frame ruim
            }
          }
          timerId = window.setTimeout(loop, 100)
        }
        timerId = window.setTimeout(loop, 200)
      } catch (err) {
        const e = err as Error
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setStatus("denied")
        } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
          setStatus("unsupported")
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
      if (timerId !== null) clearTimeout(timerId)
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
        autoPlay
        aria-hidden={status !== "running"}
        style={{ display: status === "running" ? "block" : "none" }}
      />
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
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
              <p className="text-[10px]" style={{ color: "rgba(250,250,247,0.5)" }}>
                iPhone: Ajustes · Safari · Câmera. Android: cadeado da URL · Permissões · Câmera.
              </p>
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
