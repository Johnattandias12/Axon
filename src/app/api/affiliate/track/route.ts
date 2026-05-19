import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { code, eventId } = await req.json()
    if (!code) return NextResponse.json({ ok: false }, { status: 400 })

    const admin = createAdminClient()
    
    // Buscar o ID do afiliado pelo código
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("id")
      .eq("code", code.toUpperCase())
      .single()

    if (!affiliate) {
      return NextResponse.json({ ok: false, error: "Affiliate not found" })
    }

    // Pega o IP se possível
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("remote-addr")
    const userAgent = req.headers.get("user-agent")

    // Insere o click
    await admin.from("affiliate_clicks").insert({
      affiliate_id: affiliate.id,
      event_id: eventId || null,
      ip_address: ip,
      user_agent: userAgent
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 })
  }
}
