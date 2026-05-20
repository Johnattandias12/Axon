"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  generateAffiliateCode,
  getAffiliateByCode,
  getAffiliateByUserId,
  insertAffiliate,
} from "@/lib/supabase/affiliates-admin"

export type JoinState = { ok: true; code: string } | { ok: false; error: string } | null

/**
 * Cria um cadastro de afiliado para o usuário logado e gera código único.
 * Idempotente: se já existir, retorna o código existente.
 */
export async function joinAffiliate(): Promise<JoinState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Faça login para entrar no programa." }

  const admin = createAdminClient()

  try {
    const existing = await getAffiliateByUserId(admin, user.id)
    if (existing) {
      revalidatePath("/minha-conta/afiliados")
      return { ok: true, code: existing.code }
    }

    let code = await generateAffiliateCode(admin, user.id)
    if (!code) {
      for (let i = 0; i < 10; i++) {
        const candidate = Math.random().toString(36).slice(2, 8).toUpperCase()
        const clash = await getAffiliateByCode(admin, candidate)
        if (!clash) {
          code = candidate
          break
        }
      }
    }

    if (!code) return { ok: false, error: "Falha ao gerar código. Tente novamente." }

    const { data: commissionSetting } = await (admin as any)
      .from("system_settings")
      .select("value")
      .eq("key", "default_affiliate_commission")
      .maybeSingle()
    const defaultPct = commissionSetting?.value ? parseFloat(commissionSetting.value) : 5.0

    const { error } = await insertAffiliate(admin, {
      user_id: user.id,
      code,
      commission_pct: defaultPct,
    })
    if (error) {
      // Migration 008 não aplicada — mensagem amigável
      if (
        error.includes("does not exist") ||
        error.includes("relation") ||
        error.includes("schema")
      ) {
        return {
          ok: false,
          error: "Programa de afiliados em ativação. Volte em alguns dias ou fale com o suporte.",
        }
      }
      return { ok: false, error }
    }

    revalidatePath("/minha-conta/afiliados")
    return { ok: true, code }
  } catch (err) {
    console.error("[joinAffiliate]", err)
    return {
      ok: false,
      error: "Programa de afiliados ainda em ativação. Volte em alguns dias.",
    }
  }
}
