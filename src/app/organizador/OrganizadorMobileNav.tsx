"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Wallet, ScanLine, Menu } from "lucide-react"

const items = [
  { href: "/organizador", icon: LayoutDashboard, label: "Painel" },
  { href: "/organizador/eventos", icon: Calendar, label: "Eventos" },
  { href: "/organizador/check-ins", icon: ScanLine, label: "Scan" },
  { href: "/organizador/financeiro", icon: Wallet, label: "Carteira" },
]

export function OrganizadorMobileNav() {
  const pathname = usePathname()

  return (
    <div
      className="pb-safe fixed right-0 bottom-0 left-0 z-50 flex h-14 items-center justify-around border-t px-2 pt-0.5 backdrop-blur-md md:hidden"
      style={{
        borderColor: "rgba(255, 255, 255, 0.08)",
        backgroundColor: "color-mix(in srgb, var(--paper-pure) 75%, transparent)",
      }}
    >
      {items.map((it) => {
        const active =
          pathname === it.href || (it.href !== "/organizador" && pathname.startsWith(it.href))
        const Icon = it.icon
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-0.5 transition-colors"
          >
            <div
              className={`flex h-7 w-10 items-center justify-center rounded-lg transition-colors ${
                active ? "bg-[var(--pulse-soft)]" : "bg-transparent"
              }`}
            >
              <Icon size={16} style={{ color: active ? "var(--pulse-deep)" : "var(--mute)" }} />
            </div>
            <span
              className="text-[9px] font-medium"
              style={{ color: active ? "var(--ink)" : "var(--mute)" }}
            >
              {it.label}
            </span>
          </Link>
        )
      })}

      {/* Menu Extra para "Minha Conta" */}
      <Link
        href="/minha-conta"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-0.5 transition-colors"
      >
        <div className="flex h-7 w-10 items-center justify-center rounded-lg bg-transparent">
          <Menu size={16} style={{ color: "var(--mute)" }} />
        </div>
        <span className="text-[9px] font-medium" style={{ color: "var(--mute)" }}>
          Conta
        </span>
      </Link>
    </div>
  )
}
