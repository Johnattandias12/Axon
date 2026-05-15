// Setup completo: cria admin, organizer, popula eventos com tipos variados.
// Uso: node scripts/setup-supabase.mjs
import { createClient } from "@supabase/supabase-js"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qirogiafdyyvsuxspepq.supabase.co"
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!KEY) {
  console.error("ERRO: SUPABASE_SERVICE_ROLE_KEY não definido")
  process.exit(1)
}

const supabase = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ADMIN_EMAIL = "admin@axon.com.br"
const ADMIN_PASSWORD = "Axon@Beyonder2026!"
const ADMIN_NAME = "Johnattan Dias"

// ─── 1. Criar/atualizar admin ────────────────────────────────
console.log("\n› Etapa 1: admin user")
const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 200 })
let adminUser = existingUsers?.users.find((u) => u.email === ADMIN_EMAIL)

if (adminUser) {
  await supabase.auth.admin.updateUserById(adminUser.id, { password: ADMIN_PASSWORD })
  console.log(`  ✓ admin já existia, senha resetada — id=${adminUser.id.slice(0, 8)}…`)
} else {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  })
  if (error || !created.user) {
    console.error("  ✗", error?.message)
    process.exit(1)
  }
  adminUser = created.user
  console.log(`  ✓ admin criado — id=${adminUser.id.slice(0, 8)}…`)
}

// ─── 2. Profile admin ────────────────────────────────────────
console.log("\n› Etapa 2: profile admin")
await supabase.from("profiles").upsert({
  id: adminUser.id,
  full_name: ADMIN_NAME,
  role: "admin",
})
console.log("  ✓ profile como admin")

// ─── 3. Organizer ────────────────────────────────────────────
console.log("\n› Etapa 3: organizer")
let { data: organizer } = await supabase
  .from("organizers")
  .select("id")
  .eq("user_id", adminUser.id)
  .maybeSingle()

if (!organizer) {
  const { data: newOrg, error } = await supabase
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
  if (error) {
    console.error("  ✗", error.message)
    process.exit(1)
  }
  organizer = newOrg
  console.log("  ✓ organizer criado")
} else {
  console.log("  ✓ organizer já existia")
}

const orgId = organizer.id

// ─── 4. Eventos ──────────────────────────────────────────────
console.log("\n› Etapa 4: eventos (com tipos variados)")

const fullPassSetup = (basePrice, baseQty) => [
  {
    name: "Pista",
    description: "Acesso geral à área principal do evento.",
    position: 0,
    lots: [
      { name: "1º Lote", price_cents: basePrice, quantity_total: baseQty, is_half_price: false, position: 0 },
      { name: "2º Lote", price_cents: Math.round(basePrice * 1.4), quantity_total: Math.round(baseQty * 0.7), is_half_price: false, position: 1 },
      { name: "Meia Estudante", price_cents: Math.round(basePrice / 2), quantity_total: Math.round(baseQty * 0.3), is_half_price: true, position: 2 },
      { name: "Meia Social (1kg)", price_cents: Math.round(basePrice / 2), quantity_total: Math.round(baseQty * 0.2), is_half_price: true, position: 3 },
    ],
  },
  {
    name: "Frontstage",
    description: "Área frontal exclusiva, em frente ao palco principal.",
    position: 1,
    lots: [
      { name: "Inteira", price_cents: Math.round(basePrice * 2.2), quantity_total: Math.round(baseQty * 0.15), is_half_price: false, position: 0 },
      { name: "Meia", price_cents: Math.round(basePrice * 1.1), quantity_total: Math.round(baseQty * 0.1), is_half_price: true, position: 1 },
    ],
  },
  {
    name: "Camarote",
    description: "Camarote elevado com vista privilegiada e bar próprio.",
    position: 2,
    lots: [
      { name: "Camarote Inteira", price_cents: Math.round(basePrice * 3), quantity_total: Math.round(baseQty * 0.12), is_half_price: false, position: 0 },
      { name: "Camarote Meia", price_cents: Math.round(basePrice * 1.5), quantity_total: Math.round(baseQty * 0.08), is_half_price: true, position: 1 },
    ],
  },
  {
    name: "Mesa Premium",
    description: "Mesa para 4 pessoas com serviço dedicado e open bar premium.",
    position: 3,
    lots: [
      { name: "Mesa Premium (4 lugares)", price_cents: Math.round(basePrice * 12), quantity_total: Math.round(baseQty * 0.04), is_half_price: false, position: 0 },
    ],
  },
  {
    name: "VIP",
    description: "Acesso VIP com área lounge climatizada.",
    position: 4,
    lots: [
      { name: "VIP Inteira", price_cents: Math.round(basePrice * 4), quantity_total: Math.round(baseQty * 0.06), is_half_price: false, position: 0 },
      { name: "VIP Meia", price_cents: Math.round(basePrice * 2), quantity_total: Math.round(baseQty * 0.04), is_half_price: true, position: 1 },
    ],
  },
  {
    name: "Backstage",
    description: "Acesso aos bastidores, meet & greet e brindes exclusivos.",
    position: 5,
    lots: [
      { name: "Backstage Experience", price_cents: Math.round(basePrice * 7), quantity_total: Math.round(baseQty * 0.02), is_half_price: false, position: 0 },
    ],
  },
  {
    name: "Full Pass",
    description: "Acesso liberado a todos os dias e todas as áreas do evento.",
    position: 6,
    lots: [
      { name: "Full Pass", price_cents: Math.round(basePrice * 9), quantity_total: Math.round(baseQty * 0.03), is_half_price: false, position: 0 },
    ],
  },
]

const simpleSetup = (basePrice, baseQty) => [
  {
    name: "Pista",
    position: 0,
    lots: [
      { name: "1º Lote", price_cents: basePrice, quantity_total: baseQty, is_half_price: false, position: 0 },
      { name: "2º Lote", price_cents: Math.round(basePrice * 1.35), quantity_total: Math.round(baseQty * 0.7), is_half_price: false, position: 1 },
      { name: "Meia Estudante", price_cents: Math.round(basePrice / 2), quantity_total: Math.round(baseQty * 0.3), is_half_price: true, position: 2 },
      { name: "Meia Social (1kg)", price_cents: Math.round(basePrice / 2), quantity_total: Math.round(baseQty * 0.2), is_half_price: true, position: 3 },
    ],
  },
  {
    name: "Camarote",
    position: 1,
    lots: [
      { name: "Camarote", price_cents: Math.round(basePrice * 2.5), quantity_total: Math.round(baseQty * 0.15), is_half_price: false, position: 0 },
      { name: "Camarote Meia", price_cents: Math.round(basePrice * 1.25), quantity_total: Math.round(baseQty * 0.1), is_half_price: true, position: 1 },
    ],
  },
  {
    name: "VIP",
    position: 2,
    lots: [
      { name: "VIP", price_cents: Math.round(basePrice * 4), quantity_total: Math.round(baseQty * 0.06), is_half_price: false, position: 0 },
    ],
  },
]

const eventsData = [
  {
    slug: "carnaxelita-2026",
    title: "Carnaxelita 2026",
    description: "A maior micareta do interior potiguar está de volta.\n\n4 dias de folia com trio elétrico, axé e tradição em Currais Novos.\n\n• Abertura 20h\n• Circuito com trios elétricos\n• Área VIP com open bar\n• Camarote com vista privilegiada",
    category: "outro",
    venue_name: "Circuito Central de Currais Novos",
    address: "Centro",
    city: "Currais Novos",
    state: "RN",
    starts_at: "2026-10-12T20:00:00-03:00",
    ends_at: "2026-10-15T06:00:00-03:00",
    capacity: 8000,
    age_rating: "+18",
    ticketTypes: fullPassSetup(12000, 800),
  },
  {
    slug: "carnatal-2026",
    title: "Carnatal 2026",
    description: "O maior carnaval fora de época do Norte e Nordeste.\n\n4 dias de música, alegria e energia em Natal. Mais de 200 mil pessoas esperadas.\n\n• Shows madrugada adentro\n• Trios elétricos\n• Camarote premium\n• Arena VIP",
    category: "outro",
    venue_name: "Parque de Exposições Aluízio Alves",
    address: "Via Costeira",
    city: "Natal",
    state: "RN",
    starts_at: "2026-12-05T18:00:00-03:00",
    ends_at: "2026-12-08T06:00:00-03:00",
    capacity: 50000,
    age_rating: "+16",
    ticketTypes: fullPassSetup(20000, 5000),
  },
  {
    slug: "festa-santana-caico-2026",
    title: "Festa de Santana 2026",
    description: "A maior festa religiosa do Rio Grande do Norte.\n\nPatrimônio Cultural Imaterial Brasileiro. Uma das maiores festas religiosas do país, com fé, devoção e programação cultural por mais de 10 dias.\n\n• Shows gratuitos na praça\n• Área VIP com palco privilegiado\n• Missa campal e procissão\n• Feira cultural e gastronômica",
    category: "religioso",
    venue_name: "Catedral de Santana",
    address: "Centro",
    city: "Caicó",
    state: "RN",
    starts_at: "2026-07-25T18:00:00-03:00",
    ends_at: "2026-07-30T23:00:00-03:00",
    capacity: 20000,
    age_rating: "Livre",
    ticketTypes: [
      {
        name: "Área Geral",
        description: "Acesso gratuito à área pública do evento.",
        position: 0,
        lots: [{ name: "Acesso Gratuito", price_cents: 0, quantity_total: 10000, is_half_price: false, position: 0 }],
      },
      {
        name: "Área VIP",
        description: "Área reservada com vista privilegiada.",
        position: 1,
        lots: [
          { name: "VIP Inteira", price_cents: 18000, quantity_total: 500, is_half_price: false, position: 0 },
          { name: "VIP Meia Estudante", price_cents: 9000, quantity_total: 200, is_half_price: true, position: 1 },
          { name: "VIP Meia Social", price_cents: 9000, quantity_total: 150, is_half_price: true, position: 2 },
        ],
      },
      {
        name: "Camarote",
        position: 2,
        lots: [{ name: "Camarote", price_cents: 35000, quantity_total: 100, is_half_price: false, position: 0 }],
      },
      {
        name: "Mesa Premium",
        position: 3,
        lots: [{ name: "Mesa (4 lugares)", price_cents: 80000, quantity_total: 30, is_half_price: false, position: 0 }],
      },
    ],
  },
  {
    slug: "vaquejada-currais-novos-2026",
    title: "Vaquejada de Currais Novos 2026",
    description: "A maior vaquejada do Seridó potiguar.\n\nQuatro dias de adrenalina e tradição nordestina. Atrações nacionais, forró, shows e a emoção das duplas disputando a faixa de campeão.\n\n• Vaquejada competitiva com premiação\n• Shows de forró e sertanejo\n• Feira agropecuária e artesanato\n• Praça de alimentação",
    category: "esporte",
    venue_name: "Parque de Vaquejada de Currais Novos",
    address: "Zona Rural",
    city: "Currais Novos",
    state: "RN",
    starts_at: "2026-08-04T14:00:00-03:00",
    ends_at: "2026-08-07T23:00:00-03:00",
    capacity: 5000,
    age_rating: "Livre",
    ticketTypes: simpleSetup(8000, 1000),
  },
  {
    slug: "vaquejada-mossoro-2026",
    title: "Vaquejada de Mossoró 2026",
    description: "Três dias de provas com as melhores duplas do Brasil em Mossoró.\n\n• Provas oficiais com premiação\n• Show nacional na noite de sábado\n• Camarote climatizado\n• Estacionamento e área kids",
    category: "esporte",
    venue_name: "Parque do Vaqueiro",
    address: "Rodovia Mossoró-Tibau",
    city: "Mossoró",
    state: "RN",
    starts_at: "2026-09-18T16:00:00-03:00",
    ends_at: "2026-09-20T23:00:00-03:00",
    capacity: 6000,
    age_rating: "Livre",
    ticketTypes: simpleSetup(9000, 1200),
  },
  {
    slug: "gospel-rn-2026",
    title: "Festival Gospel RN 2026",
    description: "Dois dias de adoração com os maiores nomes do gospel brasileiro na Arena das Dunas.\n\n• Atrações nacionais e regionais\n• Área kids e espaço família\n• Tendas de oração\n• Praça de alimentação",
    category: "religioso",
    venue_name: "Arena das Dunas",
    address: "Av. Prudente de Morais",
    city: "Natal",
    state: "RN",
    starts_at: "2026-06-28T17:00:00-03:00",
    ends_at: "2026-06-29T23:00:00-03:00",
    capacity: 15000,
    age_rating: "Livre",
    ticketTypes: [
      {
        name: "Pista",
        position: 0,
        lots: [{ name: "Gratuita", price_cents: 0, quantity_total: 10000, is_half_price: false, position: 0 }],
      },
      {
        name: "VIP",
        position: 1,
        lots: [
          { name: "VIP Inteira", price_cents: 8000, quantity_total: 800, is_half_price: false, position: 0 },
          { name: "VIP Meia", price_cents: 4000, quantity_total: 400, is_half_price: true, position: 1 },
        ],
      },
      {
        name: "Frontstage",
        position: 2,
        lots: [{ name: "Frontstage", price_cents: 18000, quantity_total: 200, is_half_price: false, position: 0 }],
      },
    ],
  },
]

for (const e of eventsData) {
  const { ticketTypes, ...fields } = e
  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .eq("slug", fields.slug)
    .maybeSingle()

  if (existing) {
    console.log(`  · ${fields.slug}: já existe`)
    continue
  }

  const { data: ev, error: evErr } = await supabase
    .from("events")
    .insert({
      ...fields,
      organizer_id: orgId,
      status: "published",
      is_nominal: true,
      cover_policy: { refund_days: 7, partial_refund_pct: 100 },
    })
    .select("id")
    .single()

  if (evErr || !ev) {
    console.error(`  ✗ ${fields.slug}: ${evErr?.message}`)
    continue
  }

  for (const tt of ticketTypes) {
    const { lots, ...ttf } = tt
    const { data: nt } = await supabase
      .from("ticket_types")
      .insert({ ...ttf, event_id: ev.id })
      .select("id")
      .single()
    if (!nt) continue
    await supabase.from("ticket_lots").insert(
      lots.map((l) => ({
        ...l,
        ticket_type_id: nt.id,
        event_id: ev.id,
        starts_at: new Date().toISOString(),
      }))
    )
  }
  console.log(`  ✓ ${fields.slug}`)
}

console.log("\n✓ Setup completo!")
console.log(`\nCredenciais admin:\n  email: ${ADMIN_EMAIL}\n  senha: ${ADMIN_PASSWORD}\n`)
