import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LayoutDashboard, Calendar, LogOut } from "lucide-react"

export default async function OrganizadorLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/entrar?redirectTo=/organizador")

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      {/* Sidebar */}
      <aside
        className="hidden w-56 shrink-0 flex-col border-r md:flex"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <div
          className="flex h-14 items-center border-b px-4"
          style={{ borderColor: "var(--rule)" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/symbol-axon.svg" alt="AXON" width={22} height={22} />
            <span
              className="text-sm font-bold"
              style={{ color: "var(--ink)", letterSpacing: "-0.04em" }}
            >
              AXON
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          <NavItem href="/organizador" icon={<LayoutDashboard size={15} />} label="Dashboard" />
          <NavItem href="/organizador/eventos" icon={<Calendar size={15} />} label="Eventos" />
        </nav>

        <div className="border-t p-3" style={{ borderColor: "var(--rule)" }}>
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
        {/* Mobile header */}
        <header
          className="flex h-14 items-center border-b px-4 md:hidden"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/symbol-axon.svg" alt="AXON" width={22} height={22} />
          </Link>
          <span className="ml-3 text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Painel
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
