import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type RawLot = {
  id: string
  name: string
  price_cents: number
  is_half_price: boolean
  ticket_types: { name: string } | { name: string }[] | null
  events:
    | {
        id: string
        slug: string
        title: string
        starts_at: string
        venue_name: string | null
        city: string | null
        banner_url: string | null
      }
    | {
        id: string
        slug: string
        title: string
        starts_at: string
        venue_name: string | null
        city: string | null
        banner_url: string | null
      }[]
    | null
}

type RawItem = {
  id: string
  quantity: number
  added_at: string
  ticket_lots: RawLot | RawLot[] | null
}

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Buscar configuração do modo de pagamento
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settingRes } = await (supabase as any)
    .from("system_settings")
    .select("value")
    .eq("key", "payment_mode")
    .maybeSingle()
  const paymentMode = settingRes?.value ?? "test"

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      items: [],
      subtotal: 0,
      fee: 0,
      total: 0,
      totalItems: 0,
      paymentMode,
    })
  }

  const { data: rawItems } = await supabase
    .from("cart_items")
    .select(
      `id, quantity, added_at,
       ticket_lots(id, name, price_cents, is_half_price,
         ticket_types(name),
         events(id, slug, title, starts_at, venue_name, city, banner_url))`
    )
    .eq("user_id", user.id)
    .order("added_at", { ascending: false })

  const items = (rawItems ?? []) as RawItem[]

  let subtotal = 0
  const flat = items
    .map((item) => {
      const lot = pickOne(item.ticket_lots)
      if (!lot) return null
      const event = pickOne(lot.events)
      const type = pickOne(lot.ticket_types)
      const lineTotal = lot.price_cents * item.quantity
      subtotal += lineTotal
      return {
        itemId: item.id,
        quantity: item.quantity,
        lot: {
          id: lot.id,
          name: lot.name,
          priceCents: lot.price_cents,
          isHalfPrice: lot.is_half_price,
        },
        typeName: type?.name ?? "Ingresso",
        event: event
          ? {
              id: event.id,
              slug: event.slug,
              title: event.title,
              startsAt: event.starts_at,
              venueName: event.venue_name,
              city: event.city,
              bannerUrl: event.banner_url,
            }
          : null,
        lineTotalCents: lineTotal,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const fee = Math.round(subtotal * 0.0899)
  const total = subtotal + fee
  const totalItems = flat.reduce((s, i) => s + i.quantity, 0)

  return NextResponse.json({
    authenticated: true,
    items: flat,
    subtotal,
    fee,
    total,
    totalItems,
    paymentMode,
  })
}
