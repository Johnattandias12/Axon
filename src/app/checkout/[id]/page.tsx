import { redirect } from "next/navigation"

/**
 * Checkout legado — em modo MVP demonstração, redirecionamos
 * para a página pública do evento, que tem o botão de compra demo.
 * Aqui [id] pode ser slug ou id; tentamos redirecionar para /eventos/[id].
 */
export default async function CheckoutLegacy({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/eventos/${id}`)
}
