import { z } from "zod"

/**
 * Tipos mínimos do Pagar.me v5 — só o que a gente recebe nos webhooks
 * e o que criamos nas calls. Não tenta cobrir 100% da API.
 */

export const PagarmeOrderStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "canceled",
  "expired",
  "processing",
])

export const PagarmeChargeStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "canceled",
  "overpaid",
  "underpaid",
  "processing",
  "chargedback",
])

export const PagarmeChargeSchema = z.object({
  id: z.string(),
  status: PagarmeChargeStatusSchema,
  amount: z.number(),
  payment_method: z.string(),
  paid_at: z.string().optional().nullable(),
  last_transaction: z
    .object({
      qr_code: z.string().optional(),
      qr_code_url: z.string().optional(),
      expires_at: z.string().optional(),
      url: z.string().optional(),
    })
    .partial()
    .optional()
    .nullable(),
})

export const PagarmeOrderSchema = z.object({
  id: z.string(),
  code: z.string().optional().nullable(),
  status: PagarmeOrderStatusSchema,
  amount: z.number(),
  customer: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      document: z.string().optional(),
    })
    .partial()
    .optional(),
  charges: z.array(PagarmeChargeSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type PagarmeOrder = z.infer<typeof PagarmeOrderSchema>
export type PagarmeCharge = z.infer<typeof PagarmeChargeSchema>

/**
 * Wrapper de webhook event: vem com `id`, `type`, `data` (o objeto modificado).
 * `id` é a chave de idempotência — único por evento.
 */
export const PagarmeWebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  created_at: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
})

export type PagarmeWebhookEvent = z.infer<typeof PagarmeWebhookEventSchema>

/** Tipos de evento que processamos. */
export const HANDLED_EVENT_TYPES = [
  "order.paid",
  "order.payment_failed",
  "order.canceled",
  "order.expired",
  "charge.paid",
  "charge.refunded",
  "charge.chargedback",
] as const

export type HandledEventType = (typeof HANDLED_EVENT_TYPES)[number]

export function isHandledEvent(type: string): type is HandledEventType {
  return (HANDLED_EVENT_TYPES as readonly string[]).includes(type)
}
