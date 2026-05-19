import { NextResponse } from "next/server"
import { dispatchPasswordReset } from "@/lib/email/auth-via-admin"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
})

/**
 * Endpoint server-side de redefinição de senha.
 * Gera link via Supabase Admin + envia via Resend (template AXON).
 * Aceita form-encoded (browser redirect) OU JSON (fetch do client).
 *
 * Resposta:
 *  - form: 303 redirect com ?success=true | ?error=msg
 *  - JSON: { ok: true } | { ok: false, error }
 */
export async function POST(request: Request) {
  const ct = request.headers.get("content-type") || ""
  const isJson = ct.includes("application/json")

  let email: string | undefined
  if (isJson) {
    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 })
    }
    email = parsed.data.email
  } else {
    const formData = await request.formData()
    email = formData.get("email")?.toString().trim().toLowerCase()
  }

  if (!email) {
    if (isJson) return NextResponse.json({ ok: false, error: "Email obrigatório" }, { status: 400 })
    return NextResponse.redirect(
      new URL("/esqueci-senha?error=Email%20obrigat%C3%B3rio", request.url),
      303
    )
  }

  const result = await dispatchPasswordReset(email.trim().toLowerCase())

  if (!result.ok) {
    const safeErr = encodeURIComponent(
      "Não foi possível enviar o link agora. Tente de novo em alguns minutos."
    )
    console.error("[reset-password] dispatch failed:", result.error)
    if (isJson) return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    // Para o referer de minha-conta, volta com query de erro
    const referer = request.headers.get("referer") || ""
    if (referer.includes("/minha-conta")) {
      return NextResponse.redirect(
        new URL(`/minha-conta?tab=seguranca&error=${safeErr}`, request.url),
        303
      )
    }
    return NextResponse.redirect(new URL(`/esqueci-senha?error=${safeErr}`, request.url), 303)
  }

  if (isJson) return NextResponse.json({ ok: true })

  const referer = request.headers.get("referer") || ""
  if (referer.includes("/minha-conta")) {
    return NextResponse.redirect(
      new URL("/minha-conta?tab=seguranca&msg=Email%20enviado", request.url),
      303
    )
  }
  return NextResponse.redirect(new URL("/esqueci-senha?success=true", request.url), 303)
}
