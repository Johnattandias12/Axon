import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Polling de status do pedido pra UI atualizar quando webhook confirmar pagamento.
 * Resposta minimalista: { status }.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin.from("orders").select("status, buyer_id").eq("id", id).maybeSingle()
  const row = data as { status: string; buyer_id: string } | null
  if (!row || row.buyer_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
  return NextResponse.json({ status: row.status })
}
