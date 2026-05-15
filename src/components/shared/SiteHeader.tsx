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
import { ChevronDown, ShoppingBag, Shield, Building2, User as UserIcon } from "lucide-react"

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
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2.5 transition-colors hover:bg-black/5">
                <div className="relative">
                  <Avatar className="h-8 w-8">
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
                  {/* Indicador de role */}
                  <span
                    className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2"
                    style={{
                      backgroundColor:
                        profile?.role === "admin"
                          ? "var(--danger)"
                          : profile?.role === "organizer"
                            ? "var(--pulse)"
                            : "var(--info)",
                      // @ts-expect-error CSS var
                      "--tw-ring-color": "var(--paper)",
                    }}
                    title={
                      profile?.role === "admin"
                        ? "Admin"
                        : profile?.role === "organizer"
                          ? "Organizador"
                          : "Comprador"
                    }
                  >
                    {profile?.role === "admin" ? (
                      <Shield size={7} style={{ color: "var(--paper)" }} />
                    ) : profile?.role === "organizer" ? (
                      <Building2 size={7} style={{ color: "var(--pulse-ink)" }} />
                    ) : (
                      <UserIcon size={7} style={{ color: "var(--paper)" }} />
                    )}
                  </span>
                </div>
                <span
                  className="hidden text-xs font-semibold sm:inline-block"
                  style={{ color: "var(--ink)" }}
                >
                  {profile?.full_name?.split(" ")[0] ?? user.email?.split("@")[0]}
                </span>
                <ChevronDown size={13} style={{ color: "var(--mute)" }} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                {/* Header do dropdown com role */}
                <div
                  className="px-3 py-2.5"
                  style={{ borderBottom: "1px solid var(--rule)" }}
                >
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {profile?.full_name ?? user.email}
                  </p>
                  <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--mute)" }}>
                    {user.email}
                  </p>
                  <span
                    className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                    style={{
                      backgroundColor:
                        profile?.role === "admin"
                          ? "var(--danger-soft)"
                          : profile?.role === "organizer"
                            ? "var(--pulse-soft)"
                            : "var(--info-soft)",
                      color:
                        profile?.role === "admin"
                          ? "var(--danger)"
                          : profile?.role === "organizer"
                            ? "var(--pulse-deep)"
                            : "var(--info)",
                    }}
                  >
                    {profile?.role === "admin" ? (
                      <Shield size={9} />
                    ) : profile?.role === "organizer" ? (
                      <Building2 size={9} />
                    ) : (
                      <UserIcon size={9} />
                    )}
                    {profile?.role === "admin"
                      ? "Admin"
                      : profile?.role === "organizer"
                        ? "Organizador"
                        : "Comprador"}
                  </span>
                </div>
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
