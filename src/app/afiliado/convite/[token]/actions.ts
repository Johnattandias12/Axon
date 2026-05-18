"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { findInviteByToken, markInviteUsed } from "@/lib/affiliates/invites"
import type { SupabaseClient } from "@supabase/supabase-js"

type AnyClient = SupabaseClient

function affiliatesTable(client: AnyClient) {
  return (client as unknown as { from: (n: string) => ReturnType<AnyClient["from"]> }).from(
    "affiliates"
  )
}

export type AcceptInviteState = { ok: true; code: string } | { ok: false; error: string } | null

const tokenSchema = z.string().regex(/^[a-f0-9]{32}$/, "Token inválido.")

export async function acceptAffiliateInvite(
  _prev: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  const parsed = tokenSchema.safeParse(formData.get("token"))
  if (!parsed.success) return { ok: false, error: "Convite inválido." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Faça login pra aceitar o convite." }

  try {
    const admin = createAdminClient()
    const invite = await findInviteByToken(admin, parsed.data)
    if (!invite) return { ok: false, error: "Convite não encontrado." }
    if (invite.used_at) return { ok: false, error: "Este convite já foi usado." }
    if (new Date(invite.expires_at) < new Date()) {
      return { ok: false, error: "Convite expirado. Peça um novo ao admin." }
    }
    if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
      return { ok: false, error: "Este convite é para outro e-mail." }
    }

    // Já existe affiliate pra esse user? Promove direto.
    const { data: existing } = await affiliatesTable(admin)
      .select("id, code")
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      const ex = existing as { id: string; code: string }
      await affiliatesTable(admin)
        .update({
          status: "active",
          commission_pct: invite.commission_pct,
          approved_by: invite.created_by,
          approved_at: new Date().toISOString(),
        })
        .eq("id", ex.id)
      await markInviteUsed(admin, invite.id, user.id, ex.id)
      return { ok: true, code: ex.code }
    }

    // Cria affiliate novo. Usa generate_affiliate_code (definido na migration 008).
    const { data: codeData } = await (
      admin as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: string | null }>
      }
    ).rpc("generate_affiliate_code", { p_user_id: user.id })

    if (!codeData) {
      return { ok: false, error: "Não foi possível gerar código de afiliado." }
    }

    const { data: inserted, error: insErr } = await affiliatesTable(admin)
      .insert({
        user_id: user.id,
        code: codeData,
        commission_pct: invite.commission_pct,
        status: "active",
        approved_by: invite.created_by,
        approved_at: new Date().toISOString(),
      })
      .select("id, code")
      .single()

    if (insErr || !inserted) {
      return { ok: false, error: insErr?.message ?? "Falha ao criar afiliado." }
    }

    const newAff = inserted as { id: string; code: string }
    await markInviteUsed(admin, invite.id, user.id, newAff.id)
  } catch (err) {
    console.error("[acceptAffiliateInvite]", err)
    return {
      ok: false,
      error: "Algo deu errado. Aplicou as migrations 008 e 009?",
    }
  }

  redirect("/minha-conta/afiliados?welcome=1")
}
