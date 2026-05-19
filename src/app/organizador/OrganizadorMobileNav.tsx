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
      className="pb-safe fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-around border-t bg-[var(--paper-pure)] px-2 pt-1 md:hidden"
      style={{ borderColor: "var(--rule)" }}
    >
      {items.map((it) => {
        const active =
          pathname === it.href || (it.href !== "/organizador" && pathname.startsWith(it.href))
        const Icon = it.icon
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors"
          >
            <div
              className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                active ? "bg-[var(--pulse-soft)]" : "bg-transparent"
              }`}
            >
              <Icon size={18} style={{ color: active ? "var(--pulse-deep)" : "var(--mute)" }} />
            </div>
            <span
              className="text-[10px] font-medium"
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
        className="flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors"
      >
        <div className="flex h-8 w-12 items-center justify-center rounded-full bg-transparent">
          <Menu size={18} style={{ color: "var(--mute)" }} />
        </div>
        <span className="text-[10px] font-medium" style={{ color: "var(--mute)" }}>
          Conta
        </span>
      </Link>
    </div>
  )
}
