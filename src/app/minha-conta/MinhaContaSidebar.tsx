"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { User as UserIcon, Ticket, Sparkles, ShieldCheck } from "lucide-react"

interface Props {
  isAffiliate: boolean
}

export function MinhaContaSidebar({ isAffiliate }: Props) {
  const pathname = usePathname()

  const items: Array<{ href: string; icon: ReactNode; label: string }> = [
    { href: "/minha-conta", icon: <UserIcon size={15} />, label: "Perfil" },
    { href: "/minha-conta/ingressos", icon: <Ticket size={15} />, label: "Meus ingressos" },
    { href: "/minha-conta/seguranca", icon: <ShieldCheck size={15} />, label: "Segurança" },
  ]
  if (isAffiliate) {
    items.push({
      href: "/minha-conta/afiliados",
      icon: <Sparkles size={15} />,
      label: "Painel de afiliado",
    })
  }

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <div
        className="sticky top-20 rounded-2xl border p-3"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <p
          className="mb-2 px-2 text-[10px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: "var(--mute)" }}
        >
          Minha conta
        </p>
        <nav className="space-y-0.5">
          {items.map((it) => {
            const active =
              pathname === it.href || (it.href !== "/minha-conta" && pathname.startsWith(it.href))
            return (
              <Link
                key={it.href}
                href={it.href}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-black/5"
                style={{
                  color: active ? "var(--ink)" : "var(--ink-4)",
                  backgroundColor: active ? "var(--paper-soft)" : "transparent",
                }}
              >
                <span style={{ color: active ? "var(--pulse-deep)" : "var(--mute)" }}>
                  {it.icon}
                </span>
                {it.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
