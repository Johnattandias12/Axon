"use server"

import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { buyDemo, type BuyDemoState } from "./actions"
import { createPixChargeAction } from "./pagarme-actions"

export type BuyTicketState = BuyDemoState

/**
 * Wrapper unificado que decide:
 *  - se PAGARME_API_KEY existir → cria order PIX REAL no gateway, redireciona pra /checkout/[id]
 *  - senão → fluxo demo (gera tickets imediatamente, redireciona pra /checkout/[id])
 *
 * Em ambos os casos, o destino é /checkout/[id], que renderiza PIX QR (real ou demo) e
 * faz polling de status. O webhook (Pagar.me) é quem promove order pra paid no modo real;
 * no demo, o buyDemo já cria os tickets e marca como paid_at (status pending por design
 * pra UX mostrar a tela de PIX antes de redirecionar pra ingresso).
 */
export async function buyTicket(prev: BuyTicketState, formData: FormData): Promise<BuyTicketState> {
  // Modo demo (sem API key): mantém comportamento atual
  if (!process.env["PAGARME_API_KEY"]) {
    return buyDemo(prev, formData)
  }

  try {
    const res = await createPixChargeAction(formData)
    if (!res.ok) return { ok: false, error: res.error }
    // sucesso: redireciona pra checkout/[orderId] que renderiza o QR
    redirect(`/checkout/${res.orderId}`)
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error("[buyTicket] erro inesperado:", err)
    return { ok: false, error: "Não foi possível processar a compra. Tente novamente." }
  }
}
