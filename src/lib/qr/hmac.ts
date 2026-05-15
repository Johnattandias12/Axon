import crypto from "node:crypto"

const FALLBACK_SECRET = "AXN_DEMO_HMAC_SECRET_DO_NOT_USE_IN_PRODUCTION"

/**
 * Gera o payload do QR Code do ingresso AXON.
 * Formato: AXN1.<ticketId-sem-hifens>.<hmac16hex>
 * O segredo vem de QR_HMAC_SECRET ou de um fallback de demo (NÃO usar em produção).
 */
export function generateQrPayload(ticketId: string, eventId: string): string {
  const secret = process.env["QR_HMAC_SECRET"] ?? FALLBACK_SECRET
  const data = `${ticketId}|${eventId}`
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex").slice(0, 16)
  const flat = ticketId.replace(/-/g, "")
  return `AXN1.${flat}.${hmac}`
}

/** Confere se um payload bate com o ticket+event esperados. */
export function verifyQrPayload(payload: string, ticketId: string, eventId: string): boolean {
  return generateQrPayload(ticketId, eventId) === payload
}
