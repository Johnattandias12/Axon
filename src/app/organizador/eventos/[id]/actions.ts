"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface PaymentConfig {
  pix: boolean
  credit_card: boolean
  max_installments: 1 | 2 | 3 | 6 | 12
  convenience_fee_pix_cents: number
  convenience_fee_credit_pct: number
}

export async function updatePaymentMethods(
  eventId: string,
  config: PaymentConfig
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: "Não autenticado." }

  // Valida que o evento pertence ao organizador logado
  const admin = createAdminClient()

  const { data: event, error: eventErr } = await admin
    .from("events")
    .select("id, organizer_id, organizers!inner(user_id)")
    .eq("id", eventId)
    .single()

  if (eventErr || !event) return { ok: false, error: "Evento não encontrado." }

  const organizer = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers
  if (organizer?.user_id !== user.id) {
    return { ok: false, error: "Sem permissão para editar este evento." }
  }

  // Garante pelo menos um método ativo
  if (!config.pix && !config.credit_card) {
    return { ok: false, error: "Pelo menos um meio de pagamento deve estar ativo." }
  }

  const { error: updateErr } = await admin
    .from("events")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ payment_methods: config } as any)
    .eq("id", eventId)

  if (updateErr) return { ok: false, error: updateErr.message }

  revalidatePath(`/organizador/eventos/${eventId}`)
  revalidatePath(`/eventos`, "layout")

  return { ok: true }
}

/**
 * Busca a configuração de pagamento de um evento.
 * Usada no checkout para saber quais métodos exibir.
 */
export async function getEventPaymentMethods(eventId: string): Promise<PaymentConfig> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("events")
    .select("payment_methods")
    .eq("id", eventId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any)?.payment_methods ?? {
    pix: true,
    credit_card: false,
    max_installments: 1,
    convenience_fee_pix_cents: 100,
    convenience_fee_credit_pct: 5,
  }
}
