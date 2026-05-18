import crypto from "node:crypto"

/**
 * Confere a assinatura HMAC-SHA256 do webhook Pagar.me v5.
 *
 * Header: `X-Hub-Signature` no formato `sha256=<hex>` (ou só `<hex>`).
 * Body: raw body bytes (NÃO o JSON parseado).
 *
 * Use timingSafeEqual pra prevenir timing attacks.
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
