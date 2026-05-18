"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { LayoutDashboard, Calendar, Wallet, ScanLine } from "lucide-react"

const items: Array<{ href: string; icon: ReactNode; label: string }> = [
  { href: "/organizador", icon: <LayoutDashboard size={15} />, label: "Dashboard" },
  { href: "/organizador/eventos", icon: <Calendar size={15} />, label: "Eventos" },
  { href: "/organizador/check-ins", icon: <ScanLine size={15} />, label: "Check-ins" },
  { href: "/organizador/financeiro", icon: <Wallet size={15} />, label: "Financeiro" },
]

export function OrganizadorSidebarNav() {
  const pathname = usePathname()
  return (
    <nav className="flex-1 space-y-0.5 p-3">
      {items.map((it) => {
        const active =
          pathname === it.href || (it.href !== "/organizador" && pathname.startsWith(it.href))
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5"
            style={{
              color: active ? "var(--ink)" : "var(--ink-4)",
              backgroundColor: active ? "var(--paper-soft)" : "transparent",
            }}
          >
            <span style={{ color: active ? "var(--pulse-deep)" : "var(--mute)" }}>{it.icon}</span>
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
