"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Share2, Link2, Check, MessageCircle, Send } from "lucide-react"

interface Props {
  eventTitle: string
  eventSlug: string
  buyerName?: string | null
  /** se passado, adiciona ?via={code} para tracking de afiliado */
  affiliateCode?: string | null
  variant?: "ghost" | "solid"
  className?: string
}

/**
 * Botão "Compartilhar evento" com:
 * - Native share (mobile) quando disponível
 * - Popover com WhatsApp, Telegram, X, copy link
 * - Texto pré-preenchido tipo "Fulano te convida pra {evento}"
 * - Suporte a affiliate tracking via ?via=
 */
export function ShareEventButtons({
  eventTitle,
  eventSlug,
  buyerName,
  affiliateCode,
  variant = "ghost",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const url = `${origin}/eventos/${eventSlug}${affiliateCode ? `?via=${affiliateCode}` : ""}`
  const inviter = buyerName ? buyerName.split(" ")[0] : null
  const message = inviter
    ? `${inviter} te convida pra ${eventTitle}. Garante seu ingresso: ${url}`
    : `${eventTitle}. Garante seu ingresso na AXON: ${url}`

  async function handleClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: eventTitle, text: message, url })
        return
      } catch {
        // user cancelled — fall through pro popover
      }
    }
    setOpen((v) => !v)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copiado")
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`

  const baseBtn =
    variant === "solid"
      ? "rounded-xl px-4 py-2.5 text-xs font-bold transition-transform hover:scale-[1.02]"
      : "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-black/5"

  const btnStyle =
    variant === "solid"
      ? { backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }
      : { borderColor: "var(--rule)", color: "var(--ink-4)" }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 ${baseBtn}`}
        style={btnStyle}
        aria-label="Compartilhar evento"
      >
        <Share2 size={13} />
        Compartilhar
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-pure)",
          }}
          role="menu"
        >
          <div className="border-b p-3" style={{ borderColor: "var(--rule)" }}>
            <p
              className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Compartilhar
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold" style={{ color: "var(--ink)" }}>
              {eventTitle}
            </p>
          </div>

          <div className="p-1.5">
            <ShareItem
              icon={<MessageCircle size={15} style={{ color: "#25d366" }} />}
              label="WhatsApp"
              href={waUrl}
            />
            <ShareItem
              icon={<Send size={15} style={{ color: "#229ed9" }} />}
              label="Telegram"
              href={tgUrl}
            />
            <ShareItem
              icon={
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ color: "var(--ink)" }}
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              }
              label="X (Twitter)"
              href={xUrl}
            />
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-black/5"
              style={{ color: "var(--ink)" }}
            >
              {copied ? (
                <Check size={15} style={{ color: "var(--success)" }} />
              ) : (
                <Link2 size={15} style={{ color: "var(--mute)" }} />
              )}
              <span className="flex-1 text-left">{copied ? "Copiado!" : "Copiar link"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ShareItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-black/5"
      style={{ color: "var(--ink)" }}
    >
      {icon}
      <span className="flex-1">{label}</span>
    </a>
  )
}
