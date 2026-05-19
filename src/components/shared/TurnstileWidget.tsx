"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback?: (token: string) => void
          "error-callback"?: () => void
          "expired-callback"?: () => void
          theme?: "light" | "dark" | "auto"
          size?: "normal" | "compact" | "invisible"
        }
      ) => string
      reset: (id?: string) => void
    }
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void
  size?: "normal" | "compact" | "invisible"
}

/**
 * Widget invisível por padrão — chama onToken quando o desafio passa.
 * Em ausência de NEXT_PUBLIC_TURNSTILE_SITE_KEY, NÃO renderiza nada (modo dev).
 *
 * Hosted script: https://challenges.cloudflare.com/turnstile/v0/api.js
 */
export function TurnstileWidget({ onToken, size = "invisible" }: TurnstileWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env["NEXT_PUBLIC_TURNSTILE_SITE_KEY"]

  useEffect(() => {
    if (!siteKey || !ref.current) return

    const renderWidget = () => {
      if (!ref.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        size,
        theme: "auto",
        callback: (token: string) => onToken(token),
        "error-callback": () => onToken(""),
        "expired-callback": () => onToken(""),
      })
    }

    if (window.turnstile) {
      renderWidget()
      return
    }

    // Inject script uma vez
    const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]")
    if (existing) {
      existing.addEventListener("load", renderWidget, { once: true })
      return
    }
    const s = document.createElement("script")
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__axonTurnstileReady"
    s.async = true
    s.defer = true
    s.dataset["turnstile"] = "1"
    ;(window as unknown as { __axonTurnstileReady?: () => void }).__axonTurnstileReady = () =>
      renderWidget()
    document.head.appendChild(s)

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current)
        } catch {
          /* ignore */
        }
      }
    }
  }, [siteKey, size, onToken])

  // Sem siteKey configurada (dev): não renderiza nada — server-side aceita ausência.
  if (!siteKey) return null

  return <div ref={ref} />
}
