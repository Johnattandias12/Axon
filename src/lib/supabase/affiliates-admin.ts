import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Helper isolado para as tabelas de afiliado.
 * As tabelas só existem após `supabase/migrations/008_affiliates.sql`
 * ser aplicada e `npx supabase gen types` rodar — até lá, os tipos
 * gerados não as conhecem. Esse helper encapsula os casts num lugar só.
 */

export interface Affiliate {
  id: string
  user_id: string
  code: string
  commission_pct: number
  total_referrals: number
  total_commission_cents: number
  created_at: string
  // Campos da migration 009 — opcionais pra tolerância antes do db:push
  status?: "pending" | "active" | "rejected"
  approved_by?: string | null
  approved_at?: string | null
}

export interface AffiliateReferral {
  id: string
  affiliate_id: string
  order_id: string
  event_id: string | null
  commission_cents: number
  status: "pending" | "paid" | "cancelled"
  created_at: string
}

type AnyClient = SupabaseClient

function table(client: AnyClient, name: "affiliates" | "affiliate_referrals") {
  // O Database type gerado ainda não conhece essas tabelas — cast intencional.
  return (client as unknown as { from: (n: string) => ReturnType<AnyClient["from"]> }).from(name)
}

export async function getAffiliateByUserId(
  client: AnyClient,
  userId: string
): Promise<Affiliate | null> {
  const { data } = await table(client, "affiliates").select("*").eq("user_id", userId).maybeSingle()
  return (data as Affiliate | null) ?? null
}

export async function getAffiliateByCode(
  client: AnyClient,
  code: string
): Promise<Affiliate | null> {
  const { data } = await table(client, "affiliates").select("*").eq("code", code).maybeSingle()
  return (data as Affiliate | null) ?? null
}

export async function insertAffiliate(
  client: AnyClient,
  payload: { user_id: string; code: string; commission_pct: number }
): Promise<{ error: string | null }> {
  const { error } = await table(client, "affiliates").insert(payload)
  return { error: error?.message ?? null }
}

export async function updateAffiliateStats(
  client: AnyClient,
  id: string,
  payload: { total_referrals: number; total_commission_cents: number }
): Promise<void> {
  await table(client, "affiliates").update(payload).eq("id", id)
}

export async function insertReferral(
  client: AnyClient,
  payload: {
    affiliate_id: string
    order_id: string
    event_id: string
    commission_cents: number
    status: "pending" | "paid" | "cancelled"
  }
): Promise<{ error: string | null }> {
  const { error } = await table(client, "affiliate_referrals").insert(payload)
  return { error: error?.message ?? null }
}

export interface AffiliateReferralWithOrder extends AffiliateReferral {
  orders: {
    id: string
    total_cents: number
    events: { title: string; slug: string } | { title: string; slug: string }[] | null
  } | null
}

export async function getReferralsForAffiliate(
  client: AnyClient,
  affiliateId: string,
  limit = 50
): Promise<AffiliateReferralWithOrder[]> {
  const { data } = await table(client, "affiliate_referrals")
    .select(
      "id, commission_cents, status, created_at, orders(id, total_cents, events(title, slug))"
    )
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false })
    .limit(limit)
  return (data as unknown as AffiliateReferralWithOrder[] | null) ?? []
}

export async function generateAffiliateCode(
  client: AnyClient,
  userId: string
): Promise<string | null> {
  const { data } = await (
    client as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>
    }
  ).rpc("generate_affiliate_code", { p_user_id: userId })
  return typeof data === "string" && data.length > 0 ? data : null
}

export interface AffiliateWithProfile extends Affiliate {
  profiles: { email: string | null; full_name: string | null } | null
}

/**
 * Lista todos os afiliados (admin only) com info do user e stats agregados.
 */
export async function listAllAffiliates(client: AnyClient): Promise<AffiliateWithProfile[]> {
  const { data } = await table(client, "affiliates")
    .select("*, profiles(email, full_name)")
    .order("total_commission_cents", { ascending: false })
  return (data as unknown as AffiliateWithProfile[] | null) ?? []
}

export interface ReferralWithContext extends AffiliateReferral {
  affiliates: {
    code: string
    profiles: { email: string | null; full_name: string | null } | null
  } | null
  orders: {
    id: string
    total_cents: number
    events: { title: string; slug: string } | { title: string; slug: string }[] | null
  } | null
}

export async function listAllReferrals(
  client: AnyClient,
  status?: "pending" | "paid" | "cancelled",
  limit = 200
): Promise<ReferralWithContext[]> {
  let q = table(client, "affiliate_referrals")
    .select(
      "*, affiliates(code, profiles(email, full_name)), orders(id, total_cents, events(title, slug))"
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  if (status) q = q.eq("status", status)
  const { data } = await q
  return (data as unknown as ReferralWithContext[] | null) ?? []
}

export async function markReferralPaid(
  client: AnyClient,
  referralId: string
): Promise<{ error: string | null }> {
  const { error } = await table(client, "affiliate_referrals")
    .update({ status: "paid" })
    .eq("id", referralId)
  return { error: error?.message ?? null }
}

export async function payAllPendingForAffiliate(
  client: AnyClient,
  affiliateId: string
): Promise<{ error: string | null; updated: number }> {
  const { data, error } = await table(client, "affiliate_referrals")
    .update({ status: "paid" })
    .eq("affiliate_id", affiliateId)
    .eq("status", "pending")
    .select("id")
  return { error: error?.message ?? null, updated: (data as unknown[] | null)?.length ?? 0 }
}
