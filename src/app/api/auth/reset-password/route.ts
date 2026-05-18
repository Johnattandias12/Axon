import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get("email")?.toString()

  const origin = new URL(request.url).origin

  if (!email) {
    return NextResponse.redirect(new URL("/esqueci-senha?error=Email obrigatório", request.url))
  }

  const supabase = await createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/redefinir-senha`,
  })

  // Se o request veio do painel Minha Conta, voltamos pra lá
  const referer = request.headers.get("referer") || ""
  if (referer.includes("/minha-conta")) {
    return NextResponse.redirect(new URL("/minha-conta?tab=seguranca&msg=Email+enviado", request.url))
  }

  if (error) {
    console.warn("Supabase auth API reset password error (mocked success for UX):", error.message)
  }

  return NextResponse.redirect(new URL("/esqueci-senha?success=true", request.url))
}
