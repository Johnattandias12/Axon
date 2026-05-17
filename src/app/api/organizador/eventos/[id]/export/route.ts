import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Exporta CSV de vendas ou check-ins de um evento.
 * Acesso restrito ao organizador dono do evento (ou admin).
 *
 *   GET /api/organizador/eventos/[id]/export?type=sales
 *   GET /api/organizador/eventos/[id]/export?type=checkins
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") ?? "sales"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .single()

  const admin = createAdminClient()
  const { data: event } = await admin
    .from("events")
    .select("id, slug, organizer_id, title, starts_at")
    .eq("id", eventId)
    .single()

  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 })
  if (!isAdmin && event.organizer_id !== organizer?.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const eventSlug = event.slug ?? eventId.slice(0, 8)

  if (type === "sales") {
    const { data: tickets } = await admin
      .from("tickets")
      .select(
        `id, holder_name, holder_cpf, is_half_price, status, qr_hash,
         orders(id, total_cents, paid_at, payment_method, buyer_id, profiles(email, full_name)),
         ticket_lots(name, price_cents, ticket_types(name))`
      )
      .eq("event_id", eventId)

    const rows = [
      [
        "ticket_id",
        "status",
        "tipo",
        "lote",
        "preco_centavos",
        "meia",
        "titular",
        "documento",
        "comprador_email",
        "comprador_nome",
        "order_id",
        "metodo_pagamento",
        "pago_em",
      ].join(","),
    ]
    for (const t of tickets ?? []) {
      const lot = Array.isArray(t.ticket_lots) ? t.ticket_lots[0] : t.ticket_lots
      const tt = lot && Array.isArray(lot.ticket_types) ? lot.ticket_types[0] : lot?.ticket_types
      const order = Array.isArray(t.orders) ? t.orders[0] : t.orders
      const buyer = order && Array.isArray(order.profiles) ? order.profiles[0] : order?.profiles
      rows.push(
        [
          t.id,
          t.status,
          esc(tt?.name ?? ""),
          esc(lot?.name ?? ""),
          String(lot?.price_cents ?? 0),
          t.is_half_price ? "sim" : "nao",
          esc(t.holder_name),
          esc(t.holder_cpf),
          esc(buyer?.email ?? ""),
          esc(buyer?.full_name ?? ""),
          order?.id ?? "",
          order?.payment_method ?? "",
          order?.paid_at ?? "",
        ].join(",")
      )
    }

    return csvResponse(rows.join("\n"), `axon-vendas-${eventSlug}.csv`)
  }

  if (type === "checkins") {
    const { data: checks } = await admin
      .from("check_ins")
      .select(
        `id, scanned_at, result,
         tickets(id, holder_name, holder_cpf, ticket_lots(name, ticket_types(name))),
         profiles(email, full_name)`
      )
      .eq("event_id", eventId)
      .order("scanned_at", { ascending: true })

    const rows = [
      [
        "check_in_id",
        "scanned_at",
        "result",
        "ticket_id",
        "titular",
        "documento",
        "tipo",
        "lote",
        "validador_email",
        "validador_nome",
      ].join(","),
    ]
    for (const c of checks ?? []) {
      const ticket = Array.isArray(c.tickets) ? c.tickets[0] : c.tickets
      const lot =
        ticket && Array.isArray(ticket.ticket_lots) ? ticket.ticket_lots[0] : ticket?.ticket_lots
      const tt = lot && Array.isArray(lot.ticket_types) ? lot.ticket_types[0] : lot?.ticket_types
      const validator = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      rows.push(
        [
          c.id,
          c.scanned_at,
          c.result,
          ticket?.id ?? "",
          esc(ticket?.holder_name ?? ""),
          esc(ticket?.holder_cpf ?? ""),
          esc(tt?.name ?? ""),
          esc(lot?.name ?? ""),
          esc(validator?.email ?? ""),
          esc(validator?.full_name ?? ""),
        ].join(",")
      )
    }

    return csvResponse(rows.join("\n"), `axon-checkins-${eventSlug}.csv`)
  }

  if (type === "courtesy") {
    const { data: courtesies } = await admin
      .from("orders")
      .select(
        `id, paid_at, metadata,
         tickets(id, holder_name, holder_cpf, status,
           ticket_lots(name, ticket_types(name)))`
      )
      .eq("event_id", eventId)
      .filter("metadata->>courtesy", "eq", "true")
      .order("paid_at", { ascending: false })

    const rows = [
      [
        "order_id",
        "ticket_id",
        "convidado",
        "documento",
        "email",
        "tipo",
        "lote",
        "status",
        "emitida_em",
      ].join(","),
    ]
    for (const o of courtesies ?? []) {
      const meta = (o.metadata ?? {}) as { recipient_email?: string | null }
      for (const t of o.tickets ?? []) {
        const lot = Array.isArray(t.ticket_lots) ? t.ticket_lots[0] : t.ticket_lots
        const tt = lot && Array.isArray(lot.ticket_types) ? lot.ticket_types[0] : lot?.ticket_types
        rows.push(
          [
            o.id,
            t.id,
            esc(t.holder_name),
            esc(t.holder_cpf),
            esc(meta.recipient_email ?? ""),
            esc(tt?.name ?? ""),
            esc(lot?.name ?? ""),
            t.status,
            o.paid_at ?? "",
          ].join(",")
        )
      }
    }

    return csvResponse(rows.join("\n"), `axon-cortesias-${eventSlug}.csv`)
  }

  return NextResponse.json({ error: "invalid_type" }, { status: 400 })
}

function esc(s: string): string {
  const v = (s ?? "").toString().replace(/"/g, '""')
  return /[",\n]/.test(v) ? `"${v}"` : v
}

function csvResponse(body: string, filename: string): Response {
  // BOM pra Excel reconhecer UTF-8
  const bom = "﻿"
  return new Response(bom + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
