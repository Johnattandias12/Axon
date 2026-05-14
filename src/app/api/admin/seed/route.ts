import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  if ((body as Record<string, unknown>).setupToken !== "AXON-BEYONDER-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get admin user
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 100 })
  const adminUser = usersData?.users.find((u) => u.email === "admin@axon.com.br")
  if (!adminUser) {
    return NextResponse.json(
      { error: "Admin user not found. Run /api/admin/setup first." },
      { status: 404 }
    )
  }

  // Get or create organizer
  let { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", adminUser.id)
    .maybeSingle()

  if (!organizer) {
    const { data: newOrg, error: orgErr } = await supabase
      .from("organizers")
      .insert({
        user_id: adminUser.id,
        kind: "pj",
        legal_name: "AXON Entretenimento LTDA",
        trade_name: "AXON Eventos",
        cnpj_or_cpf: "00.000.000/0001-00",
        kyc_status: "approved",
        fee_pct: 10,
        contact_email: "contato@axon.com.br",
        contact_phone: "+55 84 9 8123-5396",
      })
      .select("id")
      .single()

    if (orgErr || !newOrg) {
      return NextResponse.json(
        { error: orgErr?.message ?? "Failed to create organizer" },
        { status: 500 }
      )
    }
    organizer = newOrg
  }

  const orgId = organizer.id
  const results: string[] = []

  // Events to seed
  const eventsData = [
    {
      slug: "carnaxelita-2026",
      title: "Carnaxelita 2026",
      description:
        "A maior micareta do interior potiguar está de volta.\n\nCarnaxelita é sinônimo de emoção, axé e tradição em Currais Novos. São 4 dias de folia com os maiores nomes da música baiana, pipoca liberada e circuito de trio elétrico cortando a cidade.\n\n• Abertura dos portões: 20h\n• Circuito com trios elétricos\n• Área VIP com open bar premium\n• Camarote com vista privilegiada\n\nApresente apenas seu documento e o ingresso. Acesso por QR Code.",
      category: "outro" as const,
      venue_name: "Circuito Central de Currais Novos",
      address: "Centro",
      city: "Currais Novos",
      state: "RN",
      starts_at: "2026-10-12T20:00:00-03:00",
      ends_at: "2026-10-15T06:00:00-03:00",
      status: "published" as const,
      capacity: 8000,
      age_rating: "+18",
      is_nominal: true,
      ticketTypes: [
        {
          name: "Pista",
          position: 0,
          lots: [
            {
              name: "1º Lote",
              price_cents: 12000,
              quantity_total: 800,
              is_half_price: false,
              position: 0,
            },
            {
              name: "2º Lote",
              price_cents: 18000,
              quantity_total: 600,
              is_half_price: false,
              position: 1,
            },
            {
              name: "Meia-entrada",
              price_cents: 9000,
              quantity_total: 400,
              is_half_price: true,
              position: 2,
            },
          ],
        },
        {
          name: "Camarote",
          position: 1,
          lots: [
            {
              name: "Inteiro",
              price_cents: 35000,
              quantity_total: 200,
              is_half_price: false,
              position: 0,
            },
            {
              name: "Meia-entrada",
              price_cents: 17500,
              quantity_total: 100,
              is_half_price: true,
              position: 1,
            },
          ],
        },
        {
          name: "VIP Premium",
          position: 2,
          lots: [
            {
              name: "VIP",
              price_cents: 60000,
              quantity_total: 50,
              is_half_price: false,
              position: 0,
            },
          ],
        },
      ],
    },
    {
      slug: "carnatal-2026",
      title: "Carnatal 2026",
      description:
        "O maior carnaval fora de época do Norte e Nordeste.\n\nCarnatal é um dos maiores eventos do Brasil, com 4 dias de música, alegria e muita energia em Natal. Mais de 200 mil pessoas esperadas.\n\n• Shows ao longo de toda a noite\n• Circuito com trios elétricos\n• Área Camarote com estrutura premium\n• Arena VIP exclusiva\n\nApresente seu ingresso QR Code na entrada. Classificação +16.",
      category: "outro" as const,
      venue_name: "Parque de Exposições Aluízio Alves",
      address: "Via Costeira",
      city: "Natal",
      state: "RN",
      starts_at: "2026-12-05T18:00:00-03:00",
      ends_at: "2026-12-08T06:00:00-03:00",
      status: "published" as const,
      capacity: 50000,
      age_rating: "+16",
      is_nominal: true,
      ticketTypes: [
        {
          name: "Pipoca",
          position: 0,
          lots: [
            {
              name: "1º Lote",
              price_cents: 20000,
              quantity_total: 5000,
              is_half_price: false,
              position: 0,
            },
            {
              name: "2º Lote",
              price_cents: 28000,
              quantity_total: 5000,
              is_half_price: false,
              position: 1,
            },
            {
              name: "Meia-entrada",
              price_cents: 14000,
              quantity_total: 2000,
              is_half_price: true,
              position: 2,
            },
          ],
        },
        {
          name: "Camarote",
          position: 1,
          lots: [
            {
              name: "Camarote Inteiro",
              price_cents: 65000,
              quantity_total: 1000,
              is_half_price: false,
              position: 0,
            },
          ],
        },
      ],
    },
    {
      slug: "festa-santana-caico-2026",
      title: "Festa de Santana 2026",
      description:
        "A maior festa religiosa do Rio Grande do Norte.\n\nA Festa de Santana em Caicó é Patrimônio Cultural Imaterial Brasileiro. Uma das maiores festas religiosas do país, reunindo fé, devoção e muita programação cultural por mais de 10 dias.\n\n• Shows gratuitos na praça\n• Área VIP com palco privilegiado\n• Missa campal e procissão\n• Feira cultural e gastronômica\n\nEvento para toda a família. Classificação livre.",
      category: "religioso" as const,
      venue_name: "Catedral de Santana",
      address: "Centro",
      city: "Caicó",
      state: "RN",
      starts_at: "2026-07-25T18:00:00-03:00",
      ends_at: "2026-07-30T23:00:00-03:00",
      status: "published" as const,
      capacity: 20000,
      age_rating: "Livre",
      is_nominal: false,
      ticketTypes: [
        {
          name: "Área Geral",
          position: 0,
          lots: [
            {
              name: "Acesso Gratuito",
              price_cents: 0,
              quantity_total: 10000,
              is_half_price: false,
              position: 0,
            },
          ],
        },
        {
          name: "Área VIP",
          position: 1,
          lots: [
            {
              name: "VIP Inteiro",
              price_cents: 18000,
              quantity_total: 500,
              is_half_price: false,
              position: 0,
            },
            {
              name: "VIP Meia",
              price_cents: 9000,
              quantity_total: 200,
              is_half_price: true,
              position: 1,
            },
          ],
        },
      ],
    },
    {
      slug: "vaquejada-currais-novos-2026",
      title: "Vaquejada de Currais Novos 2026",
      description:
        "A maior vaquejada do Seridó potiguar.\n\nQuatro dias de puro adrenalina e tradição nordestina no Parque de Vaquejada de Currais Novos. Atrações nacionais, forró, shows e a emoção das duplas disputando a faixa de campeão.\n\n• Vaquejada competitiva com premiação\n• Shows de forró e música sertaneja\n• Feira agropecuária e artesanato\n• Praça de alimentação completa",
      category: "esporte" as const,
      venue_name: "Parque de Vaquejada de Currais Novos",
      address: "Zona Rural",
      city: "Currais Novos",
      state: "RN",
      starts_at: "2026-08-04T14:00:00-03:00",
      ends_at: "2026-08-07T23:00:00-03:00",
      status: "published" as const,
      capacity: 5000,
      age_rating: "Livre",
      is_nominal: true,
      ticketTypes: [
        {
          name: "Arquibancada",
          position: 0,
          lots: [
            {
              name: "1º Lote",
              price_cents: 8000,
              quantity_total: 1000,
              is_half_price: false,
              position: 0,
            },
            {
              name: "2º Lote",
              price_cents: 12000,
              quantity_total: 1000,
              is_half_price: false,
              position: 1,
            },
          ],
        },
        {
          name: "Camarote",
          position: 1,
          lots: [
            {
              name: "Camarote",
              price_cents: 30000,
              quantity_total: 200,
              is_half_price: false,
              position: 0,
            },
          ],
        },
      ],
    },
  ]

  for (const eventData of eventsData) {
    const { ticketTypes, ...eventFields } = eventData

    // Check if event exists
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("slug", eventFields.slug)
      .maybeSingle()

    let eventId: string

    if (existing) {
      eventId = existing.id
      results.push(`${eventFields.slug}: already exists`)
    } else {
      const { data: newEvent, error: evErr } = await supabase
        .from("events")
        .insert({
          ...eventFields,
          organizer_id: orgId,
          cover_policy: { refund_days: 7, partial_refund_pct: 100 },
        })
        .select("id")
        .single()

      if (evErr || !newEvent) {
        return NextResponse.json(
          { error: `Failed to create event ${eventFields.slug}: ${evErr?.message}` },
          { status: 500 }
        )
      }
      eventId = newEvent.id

      // Create ticket types and lots
      for (const tt of ticketTypes) {
        const { lots, ...ttFields } = tt
        const { data: newTT, error: ttErr } = await supabase
          .from("ticket_types")
          .insert({ ...ttFields, event_id: eventId })
          .select("id")
          .single()

        if (ttErr || !newTT) continue

        const lotsWithIds = lots.map((l) => ({
          ...l,
          ticket_type_id: newTT.id,
          event_id: eventId,
          quantity_sold: 0,
          quantity_reserved: 0,
          starts_at: new Date().toISOString(),
        }))

        await supabase.from("ticket_lots").insert(lotsWithIds)
      }

      results.push(`${eventFields.slug}: created`)
    }
  }

  return NextResponse.json({ ok: true, results })
}
