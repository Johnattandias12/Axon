"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  X,
  Calendar,
  ShoppingBag,
  User as UserIcon,
  Building2,
  Shield,
  ShieldCheck,
  Ticket,
  LogOut,
  LogIn,
} from "lucide-react"

interface Props {
  isAuthed: boolean
  email?: string
  fullName?: string | null
  role?: string
  avatarUrl?: string | null
  cartCount?: number
}

/**
 * Drawer mobile do site. Hamburger no header → painel lateral
 * com avatar, role, links principais e logout/login.
 * Trava scroll do body quando aberto.
 */
export function SiteMobileNav({
  isAuthed,
  email = "",
  fullName = null,
  role = "buyer",
  avatarUrl = null,
  cartCount = 0,
}: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const initials = fullName
    ? fullName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : (email?.[0]?.toUpperCase() ?? "U")

  const roleConfig = {
    admin: { label: "Admin", bg: "var(--danger-soft)", color: "var(--danger)", icon: Shield },
    organizer: {
      label: "Organizador",
      bg: "var(--pulse-soft)",
      color: "var(--pulse-deep)",
      icon: Building2,
    },
    validator: {
      label: "Validador",
      bg: "var(--warning-soft)",
      color: "var(--warning)",
      icon: UserIcon,
    },
    buyer: { label: "Comprador", bg: "var(--info-soft)", color: "var(--info)", icon: UserIcon },
  } as const
  const rk =
    (role as keyof typeof roleConfig) in roleConfig ? (role as keyof typeof roleConfig) : "buyer"
  const r = roleConfig[rk]
  const RoleIcon = r.icon

  const drawer = (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className="fixed top-0 right-0 z-[1001] flex h-full w-[300px] max-w-[85vw] flex-col overflow-y-auto border-l shadow-2xl transition-transform duration-300 ease-out md:hidden"
        style={{
          backgroundColor: "var(--paper)",
          borderColor: "var(--rule)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-hidden={!open}
      >
        <div
          className="flex h-14 items-center justify-between border-b px-4"
          style={{ borderColor: "var(--rule)" }}
        >
          <span
            className="text-[11px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: "var(--mute)" }}
          >
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: "var(--ink)" }}
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card de usuário */}
        {isAuthed ? (
          <div
            className="m-4 rounded-2xl border p-4"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-pure)",
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName ?? "Avatar"} /> : null}
                <AvatarFallback
                  className="text-base font-bold"
                  style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  {fullName ?? email}
                </p>
                <p className="truncate text-[10px]" style={{ color: "var(--mute)" }}>
                  {email}
                </p>
              </div>
            </div>
            <span
              className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
              style={{ backgroundColor: r.bg, color: r.color }}
            >
              <RoleIcon size={9} />
              {r.label}
            </span>
          </div>
        ) : (
          <div className="m-4 space-y-3">
            <Link
              href="/entrar"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              <LogIn size={14} />
              Entrar / Criar conta
            </Link>
          </div>
        )}

        <nav className="flex flex-col gap-1 px-4">
          <NavItem
            href="/eventos"
            icon={<Calendar size={15} />}
            label="Eventos"
            onClose={() => setOpen(false)}
          />
          {isAuthed && (
            <>
              <NavItem
                href="/minha-conta/ingressos"
                icon={<Ticket size={15} />}
                label="Meus ingressos"
                onClose={() => setOpen(false)}
              />
              <NavItem
                href="/carrinho"
                icon={<ShoppingBag size={15} />}
                label="Carrinho"
                badge={cartCount > 0 ? String(cartCount) : undefined}
                onClose={() => setOpen(false)}
              />
              <NavItem
                href="/minha-conta"
                icon={<UserIcon size={15} />}
                label="Minha conta"
                onClose={() => setOpen(false)}
              />
              <NavItem
                href="/minha-conta/seguranca"
                icon={<ShieldCheck size={15} />}
                label="Segurança"
                onClose={() => setOpen(false)}
              />
              {(role === "organizer" || role === "admin") && (
                <NavItem
                  href="/organizador"
                  icon={<Building2 size={15} />}
                  label="Painel do organizador"
                  onClose={() => setOpen(false)}
                />
              )}
              {role === "admin" && (
                <NavItem
                  href="/admin"
                  icon={<Shield size={15} />}
                  label="Painel admin"
                  onClose={() => setOpen(false)}
                  accent="var(--danger)"
                />
              )}
            </>
          )}
        </nav>

        <div className="mt-auto p-4">
          {isAuthed && (
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--danger-soft)]"
                style={{ borderColor: "var(--rule)", color: "var(--danger)" }}
              >
                <LogOut size={14} />
                Sair
              </button>
            </form>
          )}
          <p className="mt-3 text-center text-[10px]" style={{ color: "var(--mute-2)" }}>
            AXON · axonia.vercel.app
          </p>
        </div>
      </aside>
    </>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border md:hidden"
        style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
        aria-label="Abrir menu"
      >
        <Menu size={16} />
      </button>
      {mounted && createPortal(drawer, document.body)}
    </>
  )
}

function NavItem({
  href,
  icon,
  label,
  badge,
  accent,
  onClose,
}: {
  href: string
  icon: React.ReactNode
  label: string
  badge?: string
  accent?: string
  onClose: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-black/5"
      style={{ color: accent ?? "var(--ink)" }}
    >
      <span style={{ color: accent ?? "var(--mute)" }}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span
          className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
