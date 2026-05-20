import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyTurnstile, clientIpFromHeaders } from "@/lib/turnstile"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().optional(),
})

/**
 * Endpoint server-side de redefinição de senha.
 *
 * Estratégia: usa supabase.auth.resetPasswordForEmail() — Supabase envia pelo
 * SMTP builtin do projeto (grátis, ~4 emails/hora no free tier). Funciona sem
 * domínio próprio nem Resend verificado. Quando o domínio ficar pronto,
 * trocar de volta pra dispatchPasswordReset (lib/email/auth-via-admin.ts) que
 * usa template AXON via Resend.
 *
 * Resposta:
 *  - form: 303 redirect com ?success=true | ?error=msg
 *  - JSON: { ok: true } | { ok: false, error }
 */
export async function POST(request: Request) {
  const ct = request.headers.get("content-type") || ""
  const isJson = ct.includes("application/json")

  let email: string | undefined
  let turnstileToken: string | undefined
  if (isJson) {
    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 })
    }
    email = parsed.data.email
    turnstileToken = parsed.data.turnstileToken
  } else {
    const formData = await request.formData()
    email = formData.get("email")?.toString().trim().toLowerCase()
    turnstileToken = formData.get("turnstileToken")?.toString()
  }

  // Captcha (skip silenciosamente em dev sem secret configurado)
  const captcha = await verifyTurnstile(turnstileToken, clientIpFromHeaders(request.headers))
  if (!captcha.ok) {
    if (isJson)
      return NextResponse.json(
        { ok: false, error: "Verificação anti-bot falhou. Tente recarregar." },
        { status: 400 }
      )
    return NextResponse.redirect(
      new URL("/esqueci-senha?error=Verifica%C3%A7%C3%A3o%20anti-bot%20falhou", request.url),
      303
    )
  }

  if (!email) {
    if (isJson) return NextResponse.json({ ok: false, error: "Email obrigatório" }, { status: 400 })
    return NextResponse.redirect(
      new URL("/esqueci-senha?error=Email%20obrigat%C3%B3rio", request.url),
      303
    )
  }

  const supabase = await createClient()
  const appUrl = (process.env["NEXT_PUBLIC_APP_URL"] || new URL(request.url).origin).replace(
    /\/$/,
    ""
  )
  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${appUrl}/api/auth/callback?next=/redefinir-senha` }
  )

  // Trata "user not found" como sucesso silencioso (evita user enumeration).
  const isNotFound = resetErr && /not.*found|does not exist/i.test(resetErr.message)
  const failed = resetErr && !isNotFound

  if (failed) {
    const safeErr = encodeURIComponent(
      "Não foi possível enviar o link agora. Tente de novo em alguns minutos."
    )
    console.error("[reset-password] supabase error:", resetErr.message)
    if (isJson) return NextResponse.json({ ok: false, error: resetErr.message }, { status: 500 })
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
