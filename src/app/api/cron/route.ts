/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendAbandonedCart, sendEventReminder, sendEventFeedback } from "@/lib/email/send"

// A cada execução (via cron ou chamada manual autenticada)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get("key")
    const cronSecret = process.env.CRON_SECRET

    // Valida acesso simples para segurança da API
    if (
      cronSecret &&
      key !== cronSecret &&
      req.headers.get("Authorization") !== `Bearer ${cronSecret}`
    ) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    const admin = createAdminClient()
    const now = new Date()

    const results = {
      abandonedCarts: 0,
      eventReminders: 0,
      eventFeedbacks: 0,
      errors: [] as string[],
    }

    // ----------------------------------------------------
    // 1. DISPARAR EMAILS DE CARRINHO ABANDONADO (1h a 3h atrás)
    // ----------------------------------------------------
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()

    const { data: pendingOrders, error: ordersErr } = await admin
      .from("orders")
      .select("id, buyer_id, created_at, event_id, events(title, starts_at)")
      .eq("status", "pending")
      .gte("created_at", threeHoursAgo)
      .lte("created_at", oneHourAgo)

    if (ordersErr) {
      results.errors.push(`Erro ao buscar pedidos pendentes: ${ordersErr.message}`)
    } else if (pendingOrders) {
      for (const order of pendingOrders) {
        // Verifica se já enviamos o e-mail de carrinho abandonado para este pedido
        const { data: existingLog } = await (admin as any)
          .from("email_logs")
          .select("id")
          .eq("type", "abandoned_cart")
          .contains("metadata", { orderId: order.id })
          .maybeSingle()

        if (!existingLog) {
          try {
            // Busca o e-mail do usuário
            const { data: userData, error: userErr } = await admin.auth.admin.getUserById(
              order.buyer_id
            )
            if (!userErr && userData?.user?.email) {
              // Busca perfil para obter o nome do comprador
              const { data: profile } = await admin
                .from("profiles")
                .select("full_name")
                .eq("id", order.buyer_id)
                .maybeSingle()

              const buyerName = profile?.full_name || "Cliente"
              const event = Array.isArray(order.events) ? order.events[0] : order.events
              if (event) {
                const eventDateFormatted = new Date(event.starts_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://axonia.vercel.app"
                const checkoutUrl = `${baseUrl}/carrinho` // Página que redireciona para o checkout do carrinho pendente

                await sendAbandonedCart({
                  to: userData.user.email,
                  buyerName,
                  eventTitle: event.title,
                  eventDate: eventDateFormatted,
                  checkoutUrl,
                  userId: order.buyer_id,
                })

                results.abandonedCarts++
              }
            }
          } catch (e: any) {
            results.errors.push(`Erro no carrinho abandonado da order ${order.id}: ${e.message}`)
          }
        }
      }
    }

    // ----------------------------------------------------
    // 2. DISPARAR LEMBRETES DE EVENTOS (24h antes)
    // ----------------------------------------------------
    const tomorrowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString()
    const tomorrowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000).toISOString()

    const { data: upcomingEvents, error: eventsErr } = await admin
      .from("events")
      .select("id, title, starts_at, venue_name")
      .eq("status", "published")
      .gte("starts_at", tomorrowStart)
      .lte("starts_at", tomorrowEnd)

    if (eventsErr) {
      results.errors.push(`Erro ao buscar eventos próximos: ${eventsErr.message}`)
    } else if (upcomingEvents) {
      for (const event of upcomingEvents) {
        // Busca todos os ingressos ativos para este evento
        const { data: tickets, error: ticketsErr } = await admin
          .from("tickets")
          .select("id, order_id, orders(buyer_id, buyer_name)")
          .eq("event_id", event.id)
          .eq("status", "valid")

        if (!ticketsErr && tickets) {
          // Agrupa por comprador para evitar enviar e-mails duplicados se o cara comprou mais de 1 ingresso
          const buyerIds = Array.from(
            new Set(
              tickets
                .map((t) => {
                  const ord = Array.isArray(t.orders) ? t.orders[0] : t.orders
                  return ord?.buyer_id
                })
                .filter(Boolean)
            )
          ) as string[]

          for (const buyerId of buyerIds) {
            // Verifica se já enviamos e-mail de lembrete para este usuário neste evento
            const { data: existingLog } = await (admin as any)
              .from("email_logs")
              .select("id")
              .eq("type", "event_reminder")
              .eq("user_id", buyerId)
              .contains("metadata", { eventId: event.id })
              .maybeSingle()

            if (!existingLog) {
              try {
                const { data: userData, error: userErr } =
                  await admin.auth.admin.getUserById(buyerId)
                if (!userErr && userData?.user?.email) {
                  const { data: profile } = await admin
                    .from("profiles")
                    .select("full_name")
                    .eq("id", buyerId)
                    .maybeSingle()

                  const buyerName = profile?.full_name || "Participante"
                  const eventDateFormatted = new Date(event.starts_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })

                  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://axonia.vercel.app"
                  const ticketsUrl = `${baseUrl}/minha-conta/ingressos`

                  await sendEventReminder({
                    to: userData.user.email,
                    buyerName,
                    eventTitle: event.title,
                    eventDate: eventDateFormatted,
                    eventLocation: event.venue_name || "",
                    ticketsUrl,
                    userId: buyerId,
                  })

                  results.eventReminders++
                }
              } catch (e: any) {
                results.errors.push(
                  `Erro no lembrete do evento ${event.id} para o usuário ${buyerId}: ${e.message}`
                )
              }
            }
          }
        }
      }
    }

    // ----------------------------------------------------
    // 3. DISPARAR SOLICITAÇÃO DE FEEDBACK (24h após o evento)
    // ----------------------------------------------------
    const pastStart = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
    const pastEnd = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()

    const { data: pastEvents, error: pastEventsErr } = await admin
      .from("events")
      .select("id, title, starts_at, ends_at")
      .eq("status", "published")
      // Se não tiver ends_at, usa starts_at
      .or(`ends_at.gte.${pastStart},and(ends_at.is.null,starts_at.gte.${pastStart})`)
      .or(`ends_at.lte.${pastEnd},and(ends_at.is.null,starts_at.lte.${pastEnd})`)

    if (pastEventsErr) {
      results.errors.push(`Erro ao buscar eventos passados: ${pastEventsErr.message}`)
    } else if (pastEvents) {
      for (const event of pastEvents) {
        const { data: tickets, error: ticketsErr } = await admin
          .from("tickets")
          .select("id, order_id, orders(buyer_id)")
          .eq("event_id", event.id)
          .eq("status", "valid")

        if (!ticketsErr && tickets) {
          const buyerIds = Array.from(
            new Set(
              tickets
                .map((t) => {
                  const ord = Array.isArray(t.orders) ? t.orders[0] : t.orders
                  return ord?.buyer_id
                })
                .filter(Boolean)
            )
          ) as string[]

          for (const buyerId of buyerIds) {
            const { data: existingLog } = await (admin as any)
              .from("email_logs")
              .select("id")
              .eq("type", "event_feedback")
              .eq("user_id", buyerId)
              .contains("metadata", { eventId: event.id })
              .maybeSingle()

            if (!existingLog) {
              try {
                const { data: userData, error: userErr } =
                  await admin.auth.admin.getUserById(buyerId)
                if (!userErr && userData?.user?.email) {
                  const { data: profile } = await admin
                    .from("profiles")
                    .select("full_name")
                    .eq("id", buyerId)
                    .maybeSingle()

                  const buyerName = profile?.full_name || "Participante"
                  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://axonia.vercel.app"
                  const feedbackUrl = `${baseUrl}/eventos/${event.id}`

                  await sendEventFeedback({
                    to: userData.user.email,
                    buyerName,
                    eventTitle: event.title,
                    feedbackUrl,
                    userId: buyerId,
                  })

                  results.eventFeedbacks++
                }
              } catch (e: any) {
                results.errors.push(
                  `Erro no feedback do evento ${event.id} para o usuário ${buyerId}: ${e.message}`
                )
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (err: any) {
    console.error("[cron] erro crítico:", err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
