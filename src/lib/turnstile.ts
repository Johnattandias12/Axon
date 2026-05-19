/**
 * Cloudflare Turnstile — verificação server-side de captcha invisível.
 *
 * Doc: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Modo dev: se TURNSTILE_SECRET_KEY ausente, pula a verificação (retorna ok=true
 * com warning no console). Em prod (NODE_ENV=production), exige a key.
 *
 * Test keys (always-pass, sem widget real) — úteis pra dev local:
 *   site:   1x00000000000000000000AA
 *   secret: 1x0000000000000000000000000000000AA
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export interface TurnstileVerifyResult {
  ok: boolean
  error?: string
  challengeTs?: string
  hostname?: string
  action?: string
}

interface CfResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  action?: string
  "error-codes"?: string[]
}

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string | null
): Promise<TurnstileVerifyResult> {
  const secret = process.env["TURNSTILE_SECRET_KEY"]

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "turnstile_not_configured" }
    }
    console.warn("[turnstile] TURNSTILE_SECRET_KEY ausente — pulando verificação (dev)")
    return { ok: true }
  }

  if (!token) {
    return { ok: false, error: "missing_token" }
  }

  const body = new URLSearchParams()
  body.set("secret", secret)
  body.set("response", token)
  if (remoteIp) body.set("remoteip", remoteIp)

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    })
    const json = (await res.json()) as CfResponse
    if (!json.success) {
      const codes = (json["error-codes"] ?? []).join(",")
      return { ok: false, error: codes || "challenge_failed" }
    }
    const result: TurnstileVerifyResult = { ok: true }
    if (json.challenge_ts) result.challengeTs = json.challenge_ts
    if (json.hostname) result.hostname = json.hostname
    if (json.action) result.action = json.action
    return result
  } catch (err) {
    console.error("[turnstile] verify failed:", err)
    return { ok: false, error: "verify_request_failed" }
  }
}

/** Extrai o IP do header padrão (Vercel/Cloudflare) com fallback. */
export function clientIpFromHeaders(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]?.trim() ?? null
  return h.get("cf-connecting-ip") || h.get("x-real-ip") || null
}
