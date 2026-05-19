import { NextResponse } from "next/server"
import { dispatchMagicLink } from "@/lib/email/auth-via-admin"
import { verifyTurnstile, clientIpFromHeaders } from "@/lib/turnstile"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().optional(),
})

/**
 * Envia magic link de login via Resend (template AXON).
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

  const result = await dispatchMagicLink(email)

  if (!result.ok) {
    console.error("[magic-link] dispatch failed:", result.error)
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
