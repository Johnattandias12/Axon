import type { ReactNode } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LayoutDashboard, Users, Calendar, Building2, LogOut, Shield } from "lucide-react"
import { AxonLogo } from "@/components/shared/AxonLogo"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/admin")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/")

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <aside
        className="hidden w-60 shrink-0 flex-col border-r md:flex"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <div
          className="flex h-14 items-center gap-2 border-b px-4"
          style={{ borderColor: "var(--rule)" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ backgroundColor: "var(--ink)" }}
            >
              <AxonLogo size={12} className="text-[var(--pulse)]" />
            </div>
            <span className="text-sm font-black tracking-[-0.04em]" style={{ color: "var(--ink)" }}>
              AXON
            </span>
          </Link>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-[var(--danger-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--danger)]">
            <Shield size={9} />
            ADMIN
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          <NavItem href="/admin" icon={<LayoutDashboard size={15} />} label="Dashboard" />
          <NavItem href="/admin/usuarios" icon={<Users size={15} />} label="Usuários" />
          <NavItem href="/admin/eventos" icon={<Calendar size={15} />} label="Eventos" />
          <NavItem
            href="/admin/organizadores"
            icon={<Building2 size={15} />}
            label="Organizadores"
          />
        </nav>

        <div className="border-t p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="mb-2 px-3 py-1">
            <p className="text-[11px] font-semibold" style={{ color: "var(--ink)" }}>
              {profile?.full_name ?? user.email}
            </p>
            <p className="text-[10px]" style={{ color: "var(--mute)" }}>
              Administrador
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/5"
              style={{ color: "var(--mute)" }}
            >
              <LogOut size={15} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 items-center border-b px-4 md:hidden"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ backgroundColor: "var(--ink)" }}
            >
              <AxonLogo size={12} className="text-[var(--pulse)]" />
            </div>
          </Link>
          <span className="ml-3 text-sm font-bold" style={{ color: "var(--ink)" }}>
            Admin
          </span>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/5"
      style={{ color: "var(--ink-4)" }}
    >
      {icon}
      {label}
    </Link>
  )
}
