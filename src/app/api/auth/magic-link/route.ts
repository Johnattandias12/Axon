import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyTurnstile, clientIpFromHeaders } from "@/lib/turnstile"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().optional(),
})

/**
 * Envia magic link de login via Supabase Auth (SMTP builtin do projeto).
 *
 * Estratégia: usa supabase.auth.signInWithOtp() — Supabase entrega o email
 * pelo SMTP builtin (grátis, sem domínio próprio). Quando o domínio AXON
 * ficar pronto e o Resend voltar, trocar pra dispatchMagicLink em
 * lib/email/auth-via-admin.ts (template AXON personalizado).
 *
 * Aceita JSON: { email }.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 })
  }

  const email = parsed.data.email.trim().toLowerCase()

  const captcha = await verifyTurnstile(
    parsed.data.turnstileToken,
    clientIpFromHeaders(request.headers)
  )
  if (!captcha.ok) {
    return NextResponse.json(
      { ok: false, error: "Verificação anti-bot falhou. Tente recarregar." },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const appUrl = (process.env["NEXT_PUBLIC_APP_URL"] || new URL(request.url).origin).replace(
    /\/$/,
    ""
  )

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${appUrl}/api/auth/callback?next=/`,
    },
  })

  if (error) {
    console.error("[magic-link] supabase error:", error.message)
    return NextResponse.json(
      {
        ok: false,
        error: "Não foi possível enviar o link. Tente de novo em alguns minutos.",
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
