import { NextResponse } from "next/server"
import { sendLoginNotification } from "@/lib/email/send"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    const body = await req.json().catch(() => ({}))
    const userAgent = body.userAgent || req.headers.get("user-agent") || "Desconhecido"
    let ip: string = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Desconhecido"
    if (ip && ip.includes(",")) ip = ip.split(",")[0].trim()

    let location = body.location
    if (!location && ip && ip !== "Desconhecido" && ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const res = await fetch(`https://ipapi.co/${ip}/json/`)
        if (res.ok) {
          const geo = await res.json()
          if (geo.city && geo.region) {
            location = `${geo.city}, ${geo.region} - ${geo.country_name}`
          }
        }
      } catch (err) {
        console.error("GeoIP error:", err)
      }
    }

    await sendLoginNotification({
      to: user.email,
      userName: profile?.full_name || user.email.split("@")[0],
      ip: ip || "Desconhecido",
      userAgent: userAgent || "Desconhecido",
      location: location || "",
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Login notification error:", err)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
