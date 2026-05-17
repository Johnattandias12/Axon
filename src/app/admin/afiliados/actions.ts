"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { markReferralPaid, payAllPendingForAffiliate } from "@/lib/supabase/affiliates-admin"

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

export async function adminMarkReferralPaid(referralId: string): Promise<AdminAffActionResult> {
  const user = await assertAdmin()
  if (!user) return { ok: false, error: "Apenas admin." }
  const admin = createAdminClient()
  const { error } = await markReferralPaid(admin, referralId)
  if (error) return { ok: false, error }
  revalidatePath("/admin/afiliados")
  return { ok: true, message: "Indicação marcada como paga." }
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
