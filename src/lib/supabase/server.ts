import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

/** Supabase client para Server Components e Route Handlers */
export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]
  const anon = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  // Em build/preview sem env configurado, usamos um stub válido para não quebrar.
  // As consultas falharão silenciosamente — middleware já trata redirects.
  const safeUrl = url && url.length > 0 ? url : "http://localhost:54321"
  const safeAnon = anon && anon.length > 0 ? anon : "stub-anon-key"

  return createServerClient<Database>(safeUrl, safeAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignorado em Server Components sem possibilidade de setar cookies.
          // O middleware garante o refresh da sessão.
        }
      },
    },
  })
}
