import crypto from "node:crypto"

const FALLBACK_SECRET = "AXN_DEMO_HMAC_SECRET_DO_NOT_USE_IN_PRODUCTION"

function getSecret(): string {
  const secret = process.env["QR_HMAC_SECRET"]
  if (secret && secret.length >= 16) return secret
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "QR_HMAC_SECRET ausente ou curto demais. Configure um segredo de pelo menos 16 chars antes de subir pra produção."
    )
  }
  return FALLBACK_SECRET
}

/**
 * Gera o payload do QR Code do ingresso AXON.
 * Formato: AXN1.<ticketId-sem-hifens>.<hmac16hex>
 */
export function generateQrPayload(ticketId: string, eventId: string): string {
  const secret = getSecret()
  const data = `${ticketId}|${eventId}`
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex").slice(0, 16)
  const flat = ticketId.replace(/-/g, "")
  return `AXN1.${flat}.${hmac}`
}

/** Confere se um payload bate com o ticket+event esperados (timing-safe). */
export function verifyQrPayload(payload: string, ticketId: string, eventId: string): boolean {
  const expected = generateQrPayload(ticketId, eventId)
  if (payload.length !== expected.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(payload), Buffer.from(expected))
  } catch {
    return false
  }
}
