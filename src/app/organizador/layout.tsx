import type { ReactNode } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogOut, ExternalLink } from "lucide-react"
import { AxonLogo } from "@/components/shared/AxonLogo"
import { OrganizadorSidebarNav } from "./OrganizadorSidebarNav"

export default async function OrganizadorLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/entrar?redirectTo=/organizador")

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
          <Link href="/" className="flex items-center">
            <AxonLogo size={16} tone="ink" />
          </Link>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase"
            style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
          >
            Organizador
          </span>
        </div>

        <OrganizadorSidebarNav />

        <div className="border-t p-3" style={{ borderColor: "var(--rule)" }}>
          <Link
            href="/minha-conta"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/5"
            style={{ color: "var(--mute)" }}
          >
            <ExternalLink size={14} />
            Minha conta
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--danger-soft)]"
              style={{ color: "var(--mute)" }}
            >
              <LogOut size={14} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 items-center justify-between border-b px-4 md:hidden"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <AxonLogo size={16} tone="ink" />
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase"
              style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
            >
              Organizador
            </span>
          </Link>
          <Link
            href="/minha-conta"
            className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
            style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
          >
            Minha conta
          </Link>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
