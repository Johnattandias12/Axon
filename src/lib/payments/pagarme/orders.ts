import { pagarme } from "./client"
import { PagarmeOrderSchema, type PagarmeOrder } from "./types"
import type { SupabaseClient } from "@supabase/supabase-js"

type AnyClient = SupabaseClient

export interface CreatePixOrderInput {
  orderId: string // nossa UUID
  buyerName: string
  buyerEmail: string
  buyerCpf: string
  amountCents: number
  description: string
  expiresInMinutes?: number
  // Items (Pagar.me requer pelo menos 1)
  items: Array<{
    amount: number // centavos
    description: string
    quantity: number
    code?: string
  }>
  // Split — recipient + valores. Cada split soma com o resto até o total.
  // O recipient AXON recebe `service_fee_cents`; o organizador recebe o subtotal.
  split?: Array<{
    recipient_id: string
    amount: number // centavos
    type: "flat" | "percentage"
    options?: {
      charge_processing_fee?: boolean
      charge_remainder_fee?: boolean
      liable?: boolean
    }
  }>
}

export interface PixOrderResult {
  pagarme_order_id: string
  charge_id: string
  qr_code: string
  qr_code_url?: string
  expires_at: string
}

/**
 * Cria uma order na Pagar.me com pagamento Pix.
 * Não toca no banco — só faz a call. Quem chama atualiza orders.gateway_order_id.
 */
export async function createPagarmePixOrder(input: CreatePixOrderInput): Promise<PixOrderResult> {
  const expiresIn = input.expiresInMinutes ?? 15

  const payload = {
    code: input.orderId,
    customer: {
      name: input.buyerName,
      email: input.buyerEmail,
      type: "individual" as const,
      document_type: "CPF" as const,
      document: input.buyerCpf.replace(/\D/g, ""),
    },
    items: input.items.map((i) => ({
      amount: i.amount,
      description: i.description.slice(0, 256),
      quantity: i.quantity,
      ...(i.code ? { code: i.code } : {}),
    })),
    payments: [
      {
        payment_method: "pix" as const,
        pix: {
          expires_in: expiresIn * 60, // segundos
          additional_information: [{ name: "Pedido", value: input.orderId.slice(0, 8) }],
        },
        ...(input.split ? { split: input.split } : {}),
      },
    ],
    metadata: {
      axon_order_id: input.orderId,
    },
  }

  const raw = await pagarme.post<unknown>("/orders", payload)
  const order = PagarmeOrderSchema.parse(raw) as PagarmeOrder

  const charge = (order.charges ?? [])[0]
  if (!charge) throw new Error("Pagar.me retornou order sem charge")

  const last = charge.last_transaction
  if (!last?.qr_code || !last?.expires_at) {
    throw new Error("Pagar.me retornou charge Pix sem qr_code/expires_at")
  }

  const result: PixOrderResult = {
    pagarme_order_id: order.id,
    charge_id: charge.id,
    qr_code: last.qr_code,
    expires_at: last.expires_at,
  }
  if (last.qr_code_url) result.qr_code_url = last.qr_code_url
  return result
}

/**
 * Consulta uma order Pagar.me. Útil pra reconciliar/debug se webhook atrasar.
 */
export async function getPagarmeOrder(pagarmeOrderId: string): Promise<PagarmeOrder> {
  const raw = await pagarme.get<unknown>(`/orders/${pagarmeOrderId}`)
  return PagarmeOrderSchema.parse(raw)
}

/**
 * Cancela uma order na Pagar.me (libera reservas no nosso lado via webhook).
 */
export async function cancelPagarmeOrder(pagarmeOrderId: string): Promise<void> {
  await pagarme.delete(`/orders/${pagarmeOrderId}`)
}

/** Persiste o gateway_order_id na nossa order pra reconciliação. */
export async function linkOrderToGateway(
  admin: AnyClient,
  orderId: string,
  pagarmeOrderId: string
): Promise<void> {
  await admin
    .from("orders")
    .update({
      gateway_order_id: pagarmeOrderId,
      payment_method: "pix",
      status: "pending",
      reserved_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    .eq("id", orderId)
}
