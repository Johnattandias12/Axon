"use client"

import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

export function HistoryNav() {
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

  // Não renderiza na página principal para manter o design limpo e evitar redundância
  if (pathname === "/") {
    return null
  }

  return (
    <div
      className="mr-4 hidden items-center gap-1 border-r pr-4 sm:flex"
      style={{ borderColor: "var(--rule)" }}
    >
      <button
        onClick={() => handleGo("back")}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
        aria-label="Voltar"
      >
        <ArrowLeft size={16} style={{ color: "var(--mute)" }} />
      </button>
      <button
        onClick={() => handleGo("forward")}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
        aria-label="Avançar"
      >
        <ArrowRight size={16} style={{ color: "var(--mute)" }} />
      </button>
    </div>
  )
}
