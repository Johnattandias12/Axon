"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { markReferralPaid, payAllPendingForAffiliate } from "@/lib/supabase/affiliates-admin"
import { createInvite, deleteInvite as deleteInviteHelper } from "@/lib/affiliates/invites"
import type { SupabaseClient } from "@supabase/supabase-js"

export type AdminAffActionResult = { ok: true; message: string } | { ok: false; error: string }

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  return profile?.role === "admin" ? user : null
}

type AnyClient = SupabaseClient

function affiliatesTable(client: AnyClient) {
  return (client as unknown as { from: (n: string) => ReturnType<AnyClient["from"]> }).from(
    "affiliates"
  )
}

// ─── Indicações: liberar pagamento (credita wallet via trigger SQL) ──

export async function adminMarkReferralPaid(referralId: string): Promise<AdminAffActionResult> {
  const user = await assertAdmin()
  if (!user) return { ok: false, error: "Apenas admin." }
  const admin = createAdminClient()
  const { error } = await markReferralPaid(admin, referralId)
  if (error) return { ok: false, error }
  revalidatePath("/admin/afiliados")
  return { ok: true, message: "Indicação marcada como paga. Crédito liberado pra wallet." }
}

export async function adminPayAllPending(affiliateId: string): Promise<AdminAffActionResult> {
  const user = await assertAdmin()
  if (!user) return { ok: false, error: "Apenas admin." }
  const admin = createAdminClient()
  const { error, updated } = await payAllPendingForAffiliate(admin, affiliateId)
  if (error) return { ok: false, error }
  revalidatePath("/admin/afiliados")
  return { ok: true, message: `${updated} indicação(ões) marcadas como pagas.` }
}

// ─── Convites: admin gera + envia link ──────────────────────────────

const createInviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  commissionPct: z.coerce.number().min(0.5, "Mínimo 0,5%").max(50, "Máximo 50%"),
  note: z.string().max(280).optional(),
})

export type CreateInviteState =
  | { ok: true; token: string; inviteUrl: string }
  | { ok: false; error: string }
  | null

export async function createAffiliateInvite(
  _prev: CreateInviteState,
  formData: FormData
): Promise<CreateInviteState> {
  const user = await assertAdmin()
  if (!user) return { ok: false, error: "Apenas admin." }

  const parsed = createInviteSchema.safeParse({
    email: formData.get("email"),
    commissionPct: formData.get("commissionPct"),
    note: formData.get("note"),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await createInvite(admin, {
      email: parsed.data.email,
      commissionPct: parsed.data.commissionPct,
      ...(parsed.data.note ? { note: parsed.data.note } : {}),
      createdBy: user.id,
    })
    if (error || !data) {
      return { ok: false, error: error?.message ?? "Falha ao criar convite." }
    }
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
    const inviteUrl = `${appUrl}/afiliado/convite/${data.token}`
    revalidatePath("/admin/afiliados")
    return { ok: true, token: data.token, inviteUrl }
  } catch (err) {
    console.error("[createAffiliateInvite]", err)
    return {
      ok: false,
      error: "Não foi possível criar o convite. Aplicou a migration 009?",
    }
  }
}

// ─── Aprovar / rejeitar / ajustar % ────────────────────────────────

const idSchema = z.object({ id: z.string().uuid() })

export async function approveAffiliate(formData: FormData): Promise<AdminAffActionResult> {
  const user = await assertAdmin()
  if (!user) return { ok: false, error: "Apenas admin." }
  const parsed = idSchema.safeParse({ id: formData.get("id") })
  if (!parsed.success) return { ok: false, error: "ID inválido." }

  try {
    const admin = createAdminClient()
    const { error } = await affiliatesTable(admin)
      .update({
        status: "active",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/admin/afiliados")
    return { ok: true, message: "Afiliado aprovado." }
  } catch (err) {
    console.error("[approveAffiliate]", err)
    return { ok: false, error: "Migration 009 não aplicada." }
  }
}

export async function rejectAffiliate(formData: FormData): Promise<AdminAffActionResult> {
  const user = await assertAdmin()
  if (!user) return { ok: false, error: "Apenas admin." }
  const parsed = idSchema.safeParse({ id: formData.get("id") })
  if (!parsed.success) return { ok: false, error: "ID inválido." }

  try {
    const admin = createAdminClient()
    const { error } = await affiliatesTable(admin)
      .update({
        status: "rejected",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/admin/afiliados")
    return { ok: true, message: "Afiliado rejeitado." }
  } catch (err) {
    console.error("[rejectAffiliate]", err)
    return { ok: false, error: "Falha ao rejeitar." }
  }
}

const updateCommissionSchema = z.object({
  id: z.string().uuid(),
  commissionPct: z.coerce.number().min(0.5).max(50),
})

export async function updateAffiliateCommission(formData: FormData): Promise<AdminAffActionResult> {
  const user = await assertAdmin()
  if (!user) return { ok: false, error: "Apenas admin." }
  const parsed = updateCommissionSchema.safeParse({
    id: formData.get("id"),
    commissionPct: formData.get("commissionPct"),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  try {
    const admin = createAdminClient()
    const { error } = await affiliatesTable(admin)
      .update({ commission_pct: parsed.data.commissionPct })
      .eq("id", parsed.data.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/admin/afiliados")
    return { ok: true, message: "Comissão atualizada." }
  } catch (err) {
    console.error("[updateAffiliateCommission]", err)
    return { ok: false, error: "Falha ao atualizar." }
  }
}

export async function deleteAffiliateInvite(formData: FormData): Promise<AdminAffActionResult> {
  const user = await assertAdmin()
  if (!user) return { ok: false, error: "Apenas admin." }
  const parsed = idSchema.safeParse({ id: formData.get("id") })
  if (!parsed.success) return { ok: false, error: "ID inválido." }
  try {
    const admin = createAdminClient()
    const { error } = await deleteInviteHelper(admin, parsed.data.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/admin/afiliados")
    return { ok: true, message: "Convite removido." }
  } catch (err) {
    console.error("[deleteAffiliateInvite]", err)
    return { ok: false, error: "Falha ao apagar convite." }
  }
}
