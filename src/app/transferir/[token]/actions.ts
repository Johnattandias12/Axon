"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type ClaimResult = { ok: true; orderId: string } | { ok: false; error: string } | null

const claimSchema = z.object({
  token: z.string().uuid(),
  holderName: z.string().min(2).max(120),
  holderCpf: z.string().min(3).max(14),
})

export async function claimTransfer(_prev: ClaimResult, formData: FormData): Promise<ClaimResult> {
  const parsed = claimSchema.safeParse({
    token: formData.get("token"),
    holderName: String(formData.get("holderName") ?? "").trim(),
    holderCpf: String(formData.get("holderCpf") ?? "").replace(/\D/g, ""),
  })
  if (!parsed.success) return { ok: false, error: "Dados inválidos." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Faça login pra pegar o ingresso." }

  const admin = createAdminClient()
  const { data: ticket } = await admin
    .from("tickets")
    .select("id, status, transfer_token, transfer_expires_at, order_id, orders(buyer_id)")
    .eq("transfer_token", parsed.data.token)
    .maybeSingle()

  if (!ticket) return { ok: false, error: "Link inválido ou já reivindicado." }
  if (ticket.status !== "paused")
    return { ok: false, error: "Esse ingresso não está mais em transferência." }
  if (ticket.transfer_expires_at && new Date(ticket.transfer_expires_at) < new Date()) {
    return { ok: false, error: "O link expirou." }
  }

  const oldOrder = Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders
  const previousOwnerId = oldOrder?.buyer_id ?? null

  if (previousOwnerId === user.id) {
    return { ok: false, error: "Você não pode transferir pra você mesmo." }
  }

  const { error } = await admin
    .from("tickets")
    .update({
      status: "valid",
      transfer_token: null,
      transfer_expires_at: null,
      transferred_from: previousOwnerId,
      transferred_at: new Date().toISOString(),
      holder_name: parsed.data.holderName,
      holder_cpf: parsed.data.holderCpf,
    })
    .eq("id", ticket.id)

  if (error) return { ok: false, error: error.message }

  // Não muda o buyer_id da order. O destinatário não vê em /minha-conta
  // (compra original continua com quem comprou). Mas o QR já é dele.
  // TODO: futuro — criar tabela ticket_holders pra rastreio mais limpo.

  redirect(`/transferir/${parsed.data.token}/sucesso`)
}
