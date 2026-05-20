"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

interface Props {
  back?: string | { label?: string; href?: string }
  eyebrow?: string
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
}

/**
 * Cabeçalho de página unificado: botão voltar transparente + breadcrumb +
 * título grande + ações à direita.
 * Aplicável a qualquer rota interna pra dar consistência de UX.
 */
export function PageHeader({ eyebrow, title, description, actions, className = "" }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function handleGo(direction: "back" | "forward") {
    if (!pathname) {
      if (direction === "back") {
        router.back()
      } else {
        router.forward()
      }
      return
    }

    const organizerTabs = [
      "/organizador",
      "/organizador/eventos",
      "/organizador/check-ins",
      "/organizador/financeiro",
    ]
    const adminTabs = [
      "/admin",
      "/admin/eventos",
      "/admin/organizadores",
      "/admin/usuarios",
      "/admin/suporte",
      "/admin/afiliados",
      "/admin/check-ins",
    ]
    const accountTabs = ["/minha-conta", "/minha-conta/ingressos", "/minha-conta/seguranca"]

    let tabs: string[] = []
    if (pathname.startsWith("/organizador")) {
      tabs = organizerTabs
    } else if (pathname.startsWith("/admin")) {
      tabs = adminTabs
    } else if (pathname.startsWith("/minha-conta")) {
      tabs = accountTabs
    }

    if (tabs.length > 0) {
      let currentIndex = tabs.findIndex((tab) => pathname === tab)
      if (currentIndex === -1) {
        currentIndex = tabs.findIndex(
          (tab) =>
            tab !== "/organizador" &&
            tab !== "/admin" &&
            tab !== "/minha-conta" &&
            pathname.startsWith(tab)
        )
      }

      if (currentIndex !== -1) {
        if (direction === "back") {
          const prevIndex = currentIndex - 1
          if (prevIndex >= 0) {
            router.push(tabs[prevIndex]!)
            return
          }
        } else {
          const nextIndex = currentIndex + 1
          if (nextIndex < tabs.length) {
            router.push(tabs[nextIndex]!)
            return
          }
        }
      }
    }

    if (direction === "back") {
      router.back()
    } else {
      router.forward()
    }
  }

  return (
    <div className={`mb-6 space-y-3 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          {eyebrow && (
            <div className="flex items-center gap-2">
              <span
                className="h-px w-6"
                style={{ background: "linear-gradient(90deg, transparent, var(--pulse))" }}
              />
              <p
                className="text-[10px] font-semibold tracking-[0.14em] uppercase"
                style={{ color: "var(--mute)" }}
              >
                {eyebrow}
              </p>
            </div>
          )}
          {title && (
            <h1
              className="text-2xl font-bold tracking-tight md:text-3xl"
              style={{ color: "var(--ink)", letterSpacing: "-0.035em" }}
            >
              {title}
            </h1>
          )}
          {description && (
            <p className="text-sm" style={{ color: "var(--mute)" }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      {/* Barra de controle de histórico abaixo da caixa de títulos */}
      <div
        className="mt-4 flex items-center justify-between border-t pt-3"
        style={{ borderColor: "var(--rule-strong)" }}
      >
        <button
          type="button"
          onClick={() => handleGo("back")}
          className="group flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold transition-all hover:scale-[1.02] hover:border-white/20 active:scale-[0.98]"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-pure)",
            color: "var(--ink-3)",
          }}
        >
          <ChevronLeft
            size={14}
            className="transition-transform group-hover:-translate-x-0.5"
            style={{ color: "var(--pulse)" }}
          />
          Voltar
        </button>

        <button
          type="button"
          onClick={() => handleGo("forward")}
          className="group flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold transition-all hover:scale-[1.02] hover:border-white/20 active:scale-[0.98]"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-pure)",
            color: "var(--ink-3)",
          }}
        >
          Avançar
          <ChevronRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
            style={{ color: "var(--pulse)" }}
          />
        </button>
      </div>
    </div>
  )
}

export function PageBackLink({
  href,
  label = "Voltar",
  className = "",
}: {
  href: string
  label?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md transition-all hover:scale-[1.03] hover:border-[var(--pulse)] ${className}`}
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "color-mix(in srgb, var(--paper-pure) 60%, transparent)",
        color: "var(--ink-4)",
      }}
    >
      <ChevronLeft
        size={12}
        className="transition-transform group-hover:-translate-x-0.5"
        style={{ color: "var(--pulse-deep)" }}
      />
      {label}
    </Link>
  )
}
