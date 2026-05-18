import crypto from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface AffiliateInvite {
  id: string
  email: string
  token: string
  commission_pct: number
  note: string | null
  created_by: string | null
  created_at: string
  expires_at: string
  used_at: string | null
  used_by: string | null
  affiliate_id: string | null
}

type AnyClient = SupabaseClient

function table(client: AnyClient) {
  return (client as unknown as { from: (n: string) => ReturnType<AnyClient["from"]> }).from(
    "affiliate_invites"
  )
}

/** Token urlsafe, 32 chars hex (128 bits). */
export function generateInviteToken(): string {
  return crypto.randomBytes(16).toString("hex")
}

export async function createInvite(
  client: AnyClient,
  payload: {
    email: string
    commissionPct: number
    note?: string
    createdBy: string
    ttlDays?: number
  }
) {
  const token = generateInviteToken()
  const expiresAt = new Date(
    Date.now() + (payload.ttlDays ?? 14) * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data, error } = await table(client)
    .insert({
      email: payload.email.toLowerCase().trim(),
      token,
      commission_pct: payload.commissionPct,
      note: payload.note ?? null,
      created_by: payload.createdBy,
      expires_at: expiresAt,
    })
    .select("*")
    .single()

  return { data: data as AffiliateInvite | null, error }
}

export async function findInviteByToken(
  client: AnyClient,
  token: string
): Promise<AffiliateInvite | null> {
  const { data } = await table(client).select("*").eq("token", token).maybeSingle()
  return (data as AffiliateInvite | null) ?? null
}

export async function listInvites(
  client: AnyClient,
  filter: "pending" | "used" | "all" = "pending",
  limit = 100
): Promise<AffiliateInvite[]> {
  let query = table(client).select("*").order("created_at", { ascending: false }).limit(limit)
  if (filter === "pending") query = query.is("used_at", null)
  if (filter === "used") query = query.not("used_at", "is", null)
  const { data } = await query
  return (data as AffiliateInvite[]) ?? []
}

export async function markInviteUsed(
  client: AnyClient,
  inviteId: string,
  usedBy: string,
  affiliateId: string
) {
  return await table(client)
    .update({
      used_at: new Date().toISOString(),
      used_by: usedBy,
      affiliate_id: affiliateId,
    })
    .eq("id", inviteId)
}

export async function deleteInvite(client: AnyClient, inviteId: string) {
  return await table(client).delete().eq("id", inviteId)
}
