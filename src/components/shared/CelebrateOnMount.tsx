"use client"

import { useEffect } from "react"

/**
 * Dispara confetes ao montar a página (uma vez por sessão por ID).
 * Cores AXON: pulse, paper, ink. Vagamente direcionado pra cima e fora.
 */
export function CelebrateOnMount({ id, message }: { id: string; message?: string }) {
  useEffect(() => {
    const key = `axon-celebrated-${id}`
    if (typeof window === "undefined") return
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, "1")

    let cancelled = false
    ;(async () => {
      const confetti = (await import("canvas-confetti")).default
      if (cancelled) return

      const duration = 2200
      const end = Date.now() + duration
      const colors = ["#c8ff00", "#a2d900", "#ecffa8", "#fafaf7", "#0a0a0b"]

      // Burst inicial
      confetti({
        particleCount: 90,
        spread: 100,
        origin: { y: 0.6 },
        colors,
        scalar: 1.05,
        ticks: 220,
      })

      // Burst lateral contínuo
      function loop() {
        const timeLeft = end - Date.now()
        if (timeLeft <= 0) return
        const particleCount = Math.max(2, 50 * (timeLeft / duration))
        confetti({
          startVelocity: 28,
          spread: 360,
          ticks: 60,
          origin: {
            x: Math.random(),
            y: Math.random() - 0.2,
          },
          colors,
          particleCount,
          shapes: ["circle", "square"],
        })
        if (!cancelled) requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)

      if (message && typeof window !== "undefined") {
        const { toast } = await import("sonner")
        toast.success(message, { duration: 3500 })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, message])

  return null
}
