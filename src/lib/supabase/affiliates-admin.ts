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
