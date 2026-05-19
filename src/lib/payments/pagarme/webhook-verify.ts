import crypto from "node:crypto"

/**
 * Verificação Basic Auth do webhook Pagar.me v5.
 *
 * Pagar.me v5 envia `Authorization: Basic base64(user:password)` em cada chamada
 * de webhook. user e password são definidos por nós no momento de criar o webhook
 * no painel — armazenados em PAGARME_WEBHOOK_USER e PAGARME_WEBHOOK_PASSWORD.
 *
 * Usa timingSafeEqual pra prevenir timing attacks.
 */
export function verifyPagarmeBasicAuth(
  authHeader: string | null | undefined,
  expectedUser: string,
  expectedPassword: string
): boolean {
  if (!authHeader || !expectedUser || !expectedPassword) return false

  const m = /^Basic\s+([A-Za-z0-9+/=_-]+)$/i.exec(authHeader)
  if (!m || !m[1]) return false

  let decoded: string
  try {
    decoded = Buffer.from(m[1], "base64").toString("utf8")
  } catch {
    return false
  }

  const idx = decoded.indexOf(":")
  if (idx < 0) return false
  const user = decoded.slice(0, idx)
  const pass = decoded.slice(idx + 1)

  return timingSafeEqualStr(user, expectedUser) && timingSafeEqualStr(pass, expectedPassword)
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8")
  const bb = Buffer.from(b, "utf8")
  if (ab.length !== bb.length) return false
  try {
    return crypto.timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

/**
 * Compat: confere HMAC-SHA256 do webhook (caso o user opte por modo signature
 * em algum projeto que ainda use). Mantida pra retro-compat — webhook handler
 * tenta Basic Auth PRIMEIRO; cai pra HMAC se Basic Auth não estiver configurado.
 */
export function verifyPagarmeSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false

  const provided = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")

  if (provided.length !== expected.length) return false

  try {
    return crypto.timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}
