"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Json } from "@/types/supabase"
import { sendEventCreated } from "@/lib/email/send"

export interface PaymentConfig {
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    .update({ payment_methods: config as unknown as Json })
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
  const { data } = await admin.from("events").select("payment_methods").eq("id", eventId).single()

  return (
    (data?.payment_methods as PaymentConfig | null) ?? {
      pix: true,
      credit_card: false,
      max_installments: 1,
      convenience_fee_pix_cents: 100,
      convenience_fee_credit_pct: 5,
    }
  )
}

export async function triggerEventCreatedEmailAction(
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Não autenticado." }

  const admin = createAdminClient()

  // Busca detalhes do evento e do organizador
  const { data: event, error: eventErr } = await admin
    .from("events")
    .select("title, starts_at, venue_name, organizers(user_id, name)")
    .eq("id", eventId)
    .single()

  if (eventErr || !event) return { ok: false, error: "Evento não encontrado." }

  const organizer = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers
  if (organizer?.user_id !== user.id) {
    return { ok: false, error: "Sem permissão." }
  }

  // Busca e-mail do organizador com segurança
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(user.id)
  if (userErr || !userData?.user?.email) {
    return { ok: false, error: "E-mail do organizador não encontrado." }
  }

  const dateFormatted = new Date(event.starts_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://axonia.vercel.app"

  await sendEventCreated({
    to: userData.user.email,
    organizerName: organizer.name || "Organizador",
    eventTitle: event.title,
    eventDate: dateFormatted,
    eventLocation: event.venue_name || "",
    eventUrl: `${baseUrl}/eventos/${eventId}`,
    userId: user.id,
  })

  return { ok: true }
}
