import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Seed de demonstração — popula 6 eventos com tipos de ingresso variados:
 * Pista, VIP, Backstage, Camarote, Mesa Premium, Full Pass, Frontstage,
 * Estudante, Meia Social.
 *
 * Auth: header X-Setup-Token = AXON-BEYONDER-2026 (ou body.setupToken).
 */

type LotSeed = {
  name: string
  price_cents: number
  quantity_total: number
  is_half_price: boolean
  position: number
}

type TypeSeed = {
  name: string
  description?: string
  position: number
  lots: LotSeed[]
}

type EventSeed = {
  slug: string
  title: string
  description: string
  category: "show" | "esporte" | "religioso" | "curso" | "outro"
  banner_url?: string
  venue_name: string
  address: string
  city: string
  state: string
  starts_at: string
  ends_at: string
  status: "published" | "draft"
  capacity: number
  age_rating: string
  is_nominal: boolean
  ticketTypes: TypeSeed[]
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const headerToken = request.headers.get("x-setup-token")
  if (body["setupToken"] !== "AXON-BEYONDER-2026" && headerToken !== "AXON-BEYONDER-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get or create admin user as organizer
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 100 })
  const adminUser = usersData?.users.find((u) => u.email === "admin@axon.com.br")
  if (!adminUser) {
    return NextResponse.json(
      { error: "Admin user not found. Run /api/admin/setup first." },
      { status: 404 }
    )
  }

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

  // ─── Conjuntos de tipos de ingresso reaproveitáveis ──────
  const fullPassoSetup = (basePrice: number, baseQty: number): TypeSeed[] => [
    {
      name: "Pista",
      description: "Acesso geral à área principal do evento.",
      position: 0,
      lots: [
        {
          name: "1º Lote",
          price_cents: basePrice,
          quantity_total: baseQty,
          is_half_price: false,
          position: 0,
        },
        {
          name: "2º Lote",
          price_cents: Math.round(basePrice * 1.4),
          quantity_total: Math.round(baseQty * 0.7),
          is_half_price: false,
          position: 1,
        },
        {
          name: "Meia Estudante",
          price_cents: Math.round(basePrice / 2),
          quantity_total: Math.round(baseQty * 0.3),
          is_half_price: true,
          position: 2,
        },
        {
          name: "Meia Social (1kg)",
          price_cents: Math.round(basePrice / 2),
          quantity_total: Math.round(baseQty * 0.2),
          is_half_price: true,
          position: 3,
        },
      ],
    },
    {
      name: "Frontstage",
      description: "Área frontal exclusiva, em frente ao palco principal.",
      position: 1,
      lots: [
        {
          name: "Inteira",
          price_cents: Math.round(basePrice * 2.2),
          quantity_total: Math.round(baseQty * 0.15),
          is_half_price: false,
          position: 0,
        },
        {
          name: "Meia",
          price_cents: Math.round(basePrice * 1.1),
          quantity_total: Math.round(baseQty * 0.1),
          is_half_price: true,
          position: 1,
        },
      ],
    },
    {
      name: "Camarote",
      description: "Camarote elevado com vista privilegiada e bar próprio.",
      position: 2,
      lots: [
        {
          name: "Camarote Inteira",
          price_cents: Math.round(basePrice * 3),
          quantity_total: Math.round(baseQty * 0.12),
          is_half_price: false,
          position: 0,
        },
        {
          name: "Camarote Meia",
          price_cents: Math.round(basePrice * 1.5),
          quantity_total: Math.round(baseQty * 0.08),
          is_half_price: true,
          position: 1,
        },
      ],
    },
    {
      name: "Mesa Premium",
      description: "Mesa para 4 pessoas com serviço dedicado e open bar premium.",
      position: 3,
      lots: [
        {
          name: "Mesa Premium (4 lugares)",
          price_cents: Math.round(basePrice * 12),
          quantity_total: Math.round(baseQty * 0.04),
          is_half_price: false,
          position: 0,
        },
      ],
    },
    {
      name: "VIP",
      description: "Acesso VIP com área lounge climatizada.",
      position: 4,
      lots: [
        {
          name: "VIP Inteira",
          price_cents: Math.round(basePrice * 4),
          quantity_total: Math.round(baseQty * 0.06),
          is_half_price: false,
          position: 0,
        },
        {
          name: "VIP Meia",
          price_cents: Math.round(basePrice * 2),
          quantity_total: Math.round(baseQty * 0.04),
          is_half_price: true,
          position: 1,
        },
      ],
    },
    {
      name: "Backstage",
      description: "Acesso aos bastidores, meet & greet e brindes exclusivos.",
      position: 5,
      lots: [
        {
          name: "Backstage Experience",
          price_cents: Math.round(basePrice * 7),
          quantity_total: Math.round(baseQty * 0.02),
          is_half_price: false,
          position: 0,
        },
      ],
    },
    {
      name: "Full Pass",
      description: "Acesso liberado a todos os dias e todas as áreas do evento.",
      position: 6,
      lots: [
        {
          name: "Full Pass",
          price_cents: Math.round(basePrice * 9),
          quantity_total: Math.round(baseQty * 0.03),
          is_half_price: false,
          position: 0,
        },
      ],
    },
  ]

  const simpleSetup = (basePrice: number, baseQty: number): TypeSeed[] => [
    {
      name: "Pista",
      position: 0,
      lots: [
        {
          name: "1º Lote",
          price_cents: basePrice,
          quantity_total: baseQty,
          is_half_price: false,
          position: 0,
        },
        {
          name: "2º Lote",
          price_cents: Math.round(basePrice * 1.35),
          quantity_total: Math.round(baseQty * 0.7),
          is_half_price: false,
          position: 1,
        },
        {
          name: "Meia Estudante",
          price_cents: Math.round(basePrice / 2),
          quantity_total: Math.round(baseQty * 0.3),
          is_half_price: true,
          position: 2,
        },
        {
          name: "Meia Social (1kg)",
          price_cents: Math.round(basePrice / 2),
          quantity_total: Math.round(baseQty * 0.2),
          is_half_price: true,
          position: 3,
        },
      ],
    },
    {
      name: "Camarote",
      position: 1,
      lots: [
        {
          name: "Camarote",
          price_cents: Math.round(basePrice * 2.5),
          quantity_total: Math.round(baseQty * 0.15),
          is_half_price: false,
          position: 0,
        },
        {
          name: "Camarote Meia",
          price_cents: Math.round(basePrice * 1.25),
          quantity_total: Math.round(baseQty * 0.1),
          is_half_price: true,
          position: 1,
        },
      ],
    },
    {
      name: "VIP",
      position: 2,
      lots: [
        {
          name: "VIP",
          price_cents: Math.round(basePrice * 4),
          quantity_total: Math.round(baseQty * 0.06),
          is_half_price: false,
          position: 0,
        },
      ],
    },
  ]

  const eventsData: EventSeed[] = [
    {
      slug: "carnaxelita-2026",
      title: "Carnaxelita 2026",
      description:
        "A maior micareta do interior potiguar está de volta.\n\nCarnaxelita é sinônimo de emoção, axé e tradição em Currais Novos. São 4 dias de folia com os maiores nomes da música baiana, pipoca liberada e circuito de trio elétrico cortando a cidade.\n\n• Abertura dos portões: 20h\n• Circuito com trios elétricos\n• Área VIP com open bar premium\n• Camarote com vista privilegiada\n\nApresente apenas seu documento e o ingresso. Acesso por QR Code.",
      category: "outro",
      venue_name: "Circuito Central de Currais Novos",
      address: "Centro",
      city: "Currais Novos",
      state: "RN",
      starts_at: "2026-10-12T20:00:00-03:00",
      ends_at: "2026-10-15T06:00:00-03:00",
      status: "published",
      capacity: 8000,
      age_rating: "+18",
      is_nominal: true,
      ticketTypes: fullPassoSetup(12000, 800),
    },
    {
      slug: "carnatal-2026",
      title: "Carnatal 2026",
      description:
        "O maior carnaval fora de época do Norte e Nordeste.\n\nCarnatal é um dos maiores eventos do Brasil, com 4 dias de música, alegria e muita energia em Natal. Mais de 200 mil pessoas esperadas.\n\n• Shows ao longo de toda a noite\n• Circuito com trios elétricos\n• Área Camarote com estrutura premium\n• Arena VIP exclusiva\n\nApresente seu ingresso QR Code na entrada. Classificação +16.",
      category: "outro",
      venue_name: "Parque de Exposições Aluízio Alves",
      address: "Via Costeira",
      city: "Natal",
      state: "RN",
      starts_at: "2026-12-05T18:00:00-03:00",
      ends_at: "2026-12-08T06:00:00-03:00",
      status: "published",
      capacity: 50000,
      age_rating: "+16",
      is_nominal: true,
      ticketTypes: fullPassoSetup(20000, 5000),
    },
    {
      slug: "festa-santana-caico-2026",
      title: "Festa de Santana 2026",
      description:
        "A maior festa religiosa do Rio Grande do Norte.\n\nA Festa de Santana em Caicó é Patrimônio Cultural Imaterial Brasileiro. Uma das maiores festas religiosas do país, reunindo fé, devoção e muita programação cultural por mais de 10 dias.\n\n• Shows gratuitos na praça\n• Área VIP com palco privilegiado\n• Missa campal e procissão\n• Feira cultural e gastronômica\n\nEvento para toda a família. Classificação livre.",
      category: "religioso",
      venue_name: "Catedral de Santana",
      address: "Centro",
      city: "Caicó",
      state: "RN",
      starts_at: "2026-07-25T18:00:00-03:00",
      ends_at: "2026-07-30T23:00:00-03:00",
      status: "published",
      capacity: 20000,
      age_rating: "Livre",
      is_nominal: false,
      ticketTypes: [
        {
          name: "Área Geral",
          description: "Acesso gratuito à área pública do evento.",
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
          description: "Área reservada com vista privilegiada para o palco principal.",
          position: 1,
          lots: [
            {
              name: "VIP Inteira",
              price_cents: 18000,
              quantity_total: 500,
              is_half_price: false,
              position: 0,
            },
            {
              name: "VIP Meia Estudante",
              price_cents: 9000,
              quantity_total: 200,
              is_half_price: true,
              position: 1,
            },
            {
              name: "VIP Meia Social (1kg)",
              price_cents: 9000,
              quantity_total: 150,
              is_half_price: true,
              position: 2,
            },
          ],
        },
        {
          name: "Camarote",
          description: "Camarote coberto com serviço dedicado.",
          position: 2,
          lots: [
            {
              name: "Camarote",
              price_cents: 35000,
              quantity_total: 100,
              is_half_price: false,
              position: 0,
            },
          ],
        },
        {
          name: "Mesa Premium",
          description: "Mesa para 4 pessoas com bar privativo.",
          position: 3,
          lots: [
            {
              name: "Mesa Premium (4 lugares)",
              price_cents: 80000,
              quantity_total: 30,
              is_half_price: false,
              position: 0,
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
      category: "esporte",
      venue_name: "Parque de Vaquejada de Currais Novos",
      address: "Zona Rural",
      city: "Currais Novos",
      state: "RN",
      starts_at: "2026-08-04T14:00:00-03:00",
      ends_at: "2026-08-07T23:00:00-03:00",
      status: "published",
      capacity: 5000,
      age_rating: "Livre",
      is_nominal: true,
      ticketTypes: simpleSetup(8000, 1000),
    },
    {
      slug: "vaquejada-mossoro-2026",
      title: "Vaquejada de Mossoró 2026",
      description:
        "Mossoró recebe novamente uma das maiores vaquejadas do Nordeste.\n\nTrês dias de provas com as melhores duplas do Brasil, programação musical com nomes nacionais e estrutura completa para famílias.\n\n• Provas oficiais com premiação\n• Show nacional na noite de sábado\n• Camarote climatizado\n• Estacionamento e área kids",
      category: "esporte",
      venue_name: "Parque do Vaqueiro",
      address: "Rodovia Mossoró-Tibau",
      city: "Mossoró",
      state: "RN",
      starts_at: "2026-09-18T16:00:00-03:00",
      ends_at: "2026-09-20T23:00:00-03:00",
      status: "published",
      capacity: 6000,
      age_rating: "Livre",
      is_nominal: true,
      ticketTypes: simpleSetup(9000, 1200),
    },
    {
      slug: "gospel-rn-2026",
      title: "Festival Gospel RN 2026",
      description:
        "Dois dias de adoração, fé e música gospel com os maiores nomes do Brasil.\n\nO Festival Gospel RN reúne grandes ministérios em um evento de portas abertas para toda a família.\n\n• Atrações nacionais e regionais\n• Área kids e espaço família\n• Tendas de oração e ministração\n• Praça de alimentação cristã",
      category: "religioso",
      venue_name: "Arena das Dunas",
      address: "Av. Prudente de Morais",
      city: "Natal",
      state: "RN",
      starts_at: "2026-06-28T17:00:00-03:00",
      ends_at: "2026-06-29T23:00:00-03:00",
      status: "published",
      capacity: 15000,
      age_rating: "Livre",
      is_nominal: false,
      ticketTypes: [
        {
          name: "Pista",
          position: 0,
          lots: [
            {
              name: "Gratuita",
              price_cents: 0,
              quantity_total: 10000,
              is_half_price: false,
              position: 0,
            },
          ],
        },
        {
          name: "VIP",
          position: 1,
          lots: [
            {
              name: "VIP Inteira",
              price_cents: 8000,
              quantity_total: 800,
              is_half_price: false,
              position: 0,
            },
            {
              name: "VIP Meia",
              price_cents: 4000,
              quantity_total: 400,
              is_half_price: true,
              position: 1,
            },
          ],
        },
        {
          name: "Frontstage",
          position: 2,
          lots: [
            {
              name: "Frontstage",
              price_cents: 18000,
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

    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("slug", eventFields.slug)
      .maybeSingle()

    let eventId: string

    if (existing) {
      eventId = existing.id
      results.push(`${eventFields.slug}: already exists`)
      continue
    }

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

    for (const tt of ticketTypes) {
      const { lots, ...ttFields } = tt
      const { data: newTT } = await supabase
        .from("ticket_types")
        .insert({ ...ttFields, event_id: eventId })
        .select("id")
        .single()

      if (!newTT) continue

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

  return NextResponse.json({ ok: true, results })
}
