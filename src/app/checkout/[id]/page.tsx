import { redirect } from "next/navigation"
import { CheckoutClient } from "./CheckoutClient"
import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/shared/SiteHeader"

// Exportamos a página do checkout real
export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Garante que o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/entrar?redirectTo=/checkout/" + id)
  }

  // Neste cenário de MVP, vamos simular que resgatamos o pedido pendente do banco.
  // Você passará o subtotal e a taxa real para o cliente.
  const subtotal = 10000 // R$ 100,00
  const fee = 899 // R$ 8,99 (Taxa de 8.99%)
  const total = subtotal + fee

  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)]">
      <SiteHeader />
      <main className="flex-1">
        <CheckoutClient 
          orderId={id} 
          subtotal={subtotal} 
          fee={fee} 
          total={total} 
          pixPayload={null} // Null fará o Client gerar o Payload de teste
        />
      </main>
    </div>
  )
}
