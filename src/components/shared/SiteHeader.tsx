import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDown } from "lucide-react"

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: { full_name: string | null; role: string } | null = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single()
    profile = data
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "U")

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-sm"
      style={{
        backgroundColor: "color-mix(in srgb, var(--paper) 92%, transparent)",
        borderColor: "var(--rule)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/brand/symbol-axon.svg" alt="AXON" width={24} height={24} />
          <span
            className="hidden text-sm font-bold tracking-tight sm:block"
            style={{ color: "var(--ink)", letterSpacing: "-0.04em" }}
          >
            AXON
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/eventos"
            className="text-sm transition-colors"
            style={{ color: "var(--mute)" }}
          >
            Eventos
          </Link>
          {profile?.role === "organizer" || profile?.role === "admin" ? (
            <Link
              href="/organizador"
              className="text-sm transition-colors"
              style={{ color: "var(--mute)" }}
            >
              Painel
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-black/5">
                <Avatar className="h-7 w-7">
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown size={14} style={{ color: "var(--mute)" }} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link href="/minha-conta" />}>
                  Minha conta
                </DropdownMenuItem>
                {(profile?.role === "organizer" || profile?.role === "admin") && (
                  <DropdownMenuItem render={<Link href="/organizador" />}>
                    Painel do organizador
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <form action="/api/auth/logout" method="POST">
                  <DropdownMenuItem
                    render={<button type="submit" className="w-full text-left" />}
                    style={{ color: "var(--danger)" }}
                  >
                    Sair
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              render={<Link href="/entrar" />}
              size="sm"
              style={{
                backgroundColor: "var(--ink)",
                color: "var(--paper)",
                fontWeight: 600,
                fontSize: "0.8125rem",
              }}
            >
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
