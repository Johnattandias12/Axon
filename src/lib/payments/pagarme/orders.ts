import { pagarme } from "./client"
import { PagarmeOrderSchema, type PagarmeOrder } from "./types"
import type { SupabaseClient } from "@supabase/supabase-js"

type AnyClient = SupabaseClient

/**
 * Quebra um telefone BR em {country_code, area_code, number} no formato exigido
 * pela Pagar.me v5. Aceita "84999999999", "5584999999999", "(84) 99999-9999".
 * Fallback safe: se faltar DDD ou número, devolve celular default sandbox.
 */
function parseBrPhone(raw: string): { country_code: string; area_code: string; number: string } {
  const digits = (raw || "").replace(/\D/g, "")
  let rest = digits
  let cc = "55"
  if (rest.length > 11) {
    cc = rest.slice(0, rest.length - 11)
    rest = rest.slice(rest.length - 11)
  }
  const area = rest.slice(0, 2)
  const number = rest.slice(2)
  if (area.length !== 2 || number.length < 8) {
    return { country_code: "55", area_code: "11", number: "999999999" }
  }
  return { country_code: cc, area_code: area, number }
}

export interface CreatePixOrderInput {
  orderId: string // nossa UUID
  buyerName: string
  buyerEmail: string
  buyerCpf: string
  /**
   * Telefone do cliente — Pagar.me v5 EXIGE pelo menos um phone, senão a charge
   * volta com status='failed' e gateway_response.errors com mensagem
   * "At least one customer phone is required."
   *
   * Aceita só dígitos (ex: "84999999999") ou com DDI (ex: "5584999999999").
   */
  buyerPhone: string
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
      phones: { mobile_phone: parseBrPhone(input.buyerPhone) },
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

/** Persiste o gateway_order_id na nossa order + salva PIX QR na metadata pra recarregar checkout. */
export async function linkOrderToGateway(
  admin: AnyClient,
  orderId: string,
  pagarmeOrderId: string,
  pix?: { qr_code?: string; qr_code_url?: string; expires_at?: string }
): Promise<void> {
  // Lê metadata atual pra fazer merge (não sobrescrever holders)
  const { data } = await admin
    .from("orders")
    .select("metadata")
    .eq("id", orderId)
    .single<{ metadata: Record<string, unknown> | null }>()

  const newMetadata = {
    ...(data?.metadata ?? {}),
    ...(pix?.qr_code ? { pix_qr: pix.qr_code } : {}),
    ...(pix?.qr_code_url ? { pix_qr_url: pix.qr_code_url } : {}),
    ...(pix?.expires_at ? { pix_expires_at: pix.expires_at } : {}),
  }

  await admin
    .from("orders")
    .update({
      gateway_order_id: pagarmeOrderId,
      payment_method: "pix",
      status: "pending",
      reserved_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      metadata: newMetadata,
    })
    .eq("id", orderId)
}
