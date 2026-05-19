import { NextResponse } from "next/server"
import crypto from "crypto"
// Importaremos o Supabase e as funções de email aqui futuramente
// import { createClient } from "@supabase/supabase-js"
// import { sendTicketConfirmation } from "@/lib/email/send"

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("pagarme-signature")
    const secret = process.env.PAGARME_WEBHOOK_SECRET

    // 1. Verificação de Segurança (Assinatura do Webhook)
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac("sha1", secret)
        .update(rawBody)
        .digest("hex")

      if (`sha1=${expectedSignature}` !== signature) {
        console.error("[Pagar.me Webhook] Assinatura inválida!")
        return new NextResponse("Invalid signature", { status: 400 })
      }
    } else {
      console.warn("[Pagar.me Webhook] Rodando sem validação de assinatura (Chave não configurada no .env).")
    }

    const event = JSON.parse(rawBody)
    console.log("[Pagar.me Webhook] Recebido evento:", event.type, "Pedido:", event.data?.id)

    // 2. Processamento do Evento
    if (event.type === "order.paid") {
      const order = event.data
      const orderId = order.code // O 'code' é o nosso UUID do pedido no banco
      
      console.log(`✅ Pedido pago confirmado: ${orderId}`)
      
      // A Fazer: 
      // - Atualizar o status do pedido no Supabase para 'paid'
      // - Gerar os QR Codes (HMAC)
      // - Disparar a função sendTicketConfirmation() com os ingressos
    }

    if (event.type === "order.canceled" || event.type === "order.payment_failed") {
      const order = event.data
      const orderId = order.code
      console.log(`❌ Pedido cancelado/falho: ${orderId}`)
      
      // A Fazer:
      // - Atualizar status do pedido no Supabase para 'canceled'
      // - Liberar o estoque (devolver os ingressos pro lote)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Pagar.me Webhook] Erro:", error)
    return new NextResponse("Webhook error", { status: 500 })
  }
}
