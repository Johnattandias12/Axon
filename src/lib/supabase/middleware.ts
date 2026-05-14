import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  // Se as vars não estiverem configuradas (ex: preview sem env vars), passa direto
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas que exigem apenas autenticação
  const authRequired = ["/minha-conta"]
  // Rotas que exigem role organizer ou admin
  const organizerRequired = ["/organizador"]
  // Rotas que exigem role admin
  const adminRequired = ["/admin"]
  // Rotas que exigem role validator, organizer ou admin
  const validatorRequired = ["/scan"]

  const redirectToLogin = () => {
    const url = request.nextUrl.clone()
    url.pathname = "/entrar"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  if (!user) {
    const needsAuth = [
      ...authRequired,
      ...organizerRequired,
      ...adminRequired,
      ...validatorRequired,
    ].some((p) => pathname.startsWith(p))
    if (needsAuth) return redirectToLogin()
    return supabaseResponse
  }

  // Usuário autenticado — verificar role para rotas restritas
  if (
    organizerRequired.some((p) => pathname.startsWith(p)) ||
    adminRequired.some((p) => pathname.startsWith(p)) ||
    validatorRequired.some((p) => pathname.startsWith(p))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = profile?.role ?? "buyer"

    if (adminRequired.some((p) => pathname.startsWith(p)) && role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }

    if (
      organizerRequired.some((p) => pathname.startsWith(p)) &&
      role !== "organizer" &&
      role !== "admin"
    ) {
      // Buyer autenticado tentando acessar /organizador → onboarding
      if (!pathname.startsWith("/organizador/comecar")) {
        const url = request.nextUrl.clone()
        url.pathname = "/organizador/comecar"
        return NextResponse.redirect(url)
      }
    }

    if (
      validatorRequired.some((p) => pathname.startsWith(p)) &&
      role !== "validator" &&
      role !== "organizer" &&
      role !== "admin"
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
