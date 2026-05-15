import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AxonLogo, AxonSymbol } from "./AxonLogo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown, ShoppingBag } from "lucide-react"

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: {
    full_name: string | null
    role: string
    avatar_url: string | null
  } | null = null
  let cartCount = 0
  if (user) {
    const [{ data: profileData }, { data: cartData }] = await Promise.all([
      supabase.from("profiles").select("full_name, role, avatar_url").eq("id", user.id).single(),
      supabase.from("cart_items").select("quantity").eq("user_id", user.id),
    ])
    profile = profileData
    cartCount = (cartData ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0)
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
        backgroundColor: "color-mix(in srgb, var(--paper) 88%, transparent)",
        borderColor: "var(--rule)",
      }}
    >
      {/* Pulse thread */}
      <div
        className="absolute right-0 bottom-0 left-0 h-[2px] opacity-80"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--pulse) 45%, var(--pulse) 55%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center transition-opacity hover:opacity-80"
          aria-label="AXON"
        >
          {/* Mobile: só o triângulo */}
          <span className="sm:hidden">
            <AxonSymbol size={26} tone="ink" />
          </span>
          {/* Desktop: wordmark */}
          <span className="hidden sm:block">
            <AxonLogo size={20} tone="ink" />
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
          {(profile?.role === "organizer" || profile?.role === "admin") && (
            <Link
              href="/organizador"
              className="text-sm transition-colors"
              style={{ color: "var(--mute)" }}
            >
              Painel
            </Link>
          )}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm font-semibold transition-colors"
              style={{ color: "var(--danger)" }}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <Link
              href="/carrinho"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
              aria-label="Carrinho"
            >
              <ShoppingBag size={15} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold"
                  style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-black/5">
                <Avatar className="h-7 w-7">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "Avatar"} />
                  ) : null}
                  <AvatarFallback
                    className="text-[11px] font-bold"
                    style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown size={13} style={{ color: "var(--mute)" }} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem render={<Link href="/minha-conta" />}>
                  Minha conta
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/carrinho" />}>
                  Carrinho{cartCount > 0 ? ` (${cartCount})` : ""}
                </DropdownMenuItem>
                {(profile?.role === "organizer" || profile?.role === "admin") && (
                  <DropdownMenuItem render={<Link href="/organizador" />}>
                    Painel do organizador
                  </DropdownMenuItem>
                )}
                {profile?.role === "admin" && (
                  <DropdownMenuItem
                    render={<Link href="/admin" />}
                    style={{ color: "var(--danger)" }}
                  >
                    Painel admin
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
