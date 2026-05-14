import Image from "next/image"
import Link from "next/link"

interface MockEvent {
  id: string
  title: string
  category: string
  date: string
  location: string
  price: string
  badge: string
  badgeType: "available" | "limited" | "sold-out" | "free"
  gradient: string
}

const featuredEvents: MockEvent[] = [
  {
    id: "carnaxelita-2026",
    title: "Carnaxelita 2026",
    category: "Micareta",
    date: "12 a 15 Out 2026",
    location: "Currais Novos, RN",
    price: "R$ 120 a R$ 450",
    badge: "Lote 2 · 23 restantes",
    badgeType: "limited",
    gradient: "from-[#3d1c02] via-[#1a0a00] to-[#0A0A0B]",
  },
  {
    id: "festa-santana-caico-2026",
    title: "Festa de Santana 2026",
    category: "Tradicional",
    date: "25 a 30 Jul 2026",
    location: "Caicó, RN",
    price: "R$ 0 a R$ 180",
    badge: "Inscrições abertas",
    badgeType: "available",
    gradient: "from-[#1c0a3d] via-[#0e0520] to-[#0A0A0B]",
  },
  {
    id: "carnatal-2026",
    title: "Carnatal 2026",
    category: "Carnaval",
    date: "Dez 2026",
    location: "Natal, RN",
    price: "A partir de R$ 200",
    badge: "Em breve",
    badgeType: "free",
    gradient: "from-[#021a3d] via-[#000e20] to-[#0A0A0B]",
  },
]

const weekEvents: MockEvent[] = [
  {
    id: "vaquejada-currais-novos-2026",
    title: "Vaquejada de Currais Novos",
    category: "Vaquejada",
    date: "04 a 07 Ago 2026",
    location: "Currais Novos, RN",
    price: "R$ 80 a R$ 300",
    badge: "Lote 1 disponível",
    badgeType: "available",
    gradient: "from-[#2a1800] via-[#150c00] to-[#0A0A0B]",
  },
  {
    id: "forro-natal-2026",
    title: "Noite de Forró em Natal",
    category: "Show",
    date: "Sáb, 20 Jun",
    location: "Natal, RN",
    price: "R$ 60",
    badge: "Disponível",
    badgeType: "available",
    gradient: "from-[#2a0014] via-[#150009] to-[#0A0A0B]",
  },
  {
    id: "gospel-rn-2026",
    title: "Festival Gospel RN",
    category: "Gospel",
    date: "28 e 29 Jun 2026",
    location: "Natal, RN",
    price: "Gratuito e VIP R$ 80",
    badge: "Inscrições abertas",
    badgeType: "free",
    gradient: "from-[#002a1a] via-[#00150d] to-[#0A0A0B]",
  },
  {
    id: "vaquejada-mossoro-2026",
    title: "Vaquejada de Mossoró",
    category: "Vaquejada",
    date: "Set 2026",
    location: "Mossoró, RN",
    price: "R$ 90 a R$ 250",
    badge: "Em breve",
    badgeType: "available",
    gradient: "from-[#001a2a] via-[#000d15] to-[#0A0A0B]",
  },
]

function BadgeStyle(type: MockEvent["badgeType"]) {
  switch (type) {
    case "limited":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "sold-out":
      return "bg-neutral-100 text-neutral-400 border-neutral-200"
    case "free":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    default:
      return "bg-green-50 text-green-700 border-green-200"
  }
}

function EventCard({ event, size = "md" }: { event: MockEvent; size?: "lg" | "md" }) {
  const isSoldOut = event.badgeType === "sold-out"
  const aspectRatio = size === "lg" ? "aspect-[4/3]" : "aspect-[3/2]"

  return (
    <Link
      href={`/eventos/${event.id}`}
      className="group flex cursor-pointer flex-col"
      aria-label={event.title}
    >
      <div
        className={`relative overflow-hidden rounded-2xl ${aspectRatio} mb-4 bg-gradient-to-br ${event.gradient}`}
      >
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-medium tracking-wide text-white/70 uppercase backdrop-blur-sm">
            {event.category}
          </span>
        </div>

        {isSoldOut && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
            <span className="text-[11px] font-semibold tracking-widest text-white/60 uppercase">
              Esgotado
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3
            className={`leading-snug font-semibold ${size === "lg" ? "text-[17px]" : "text-[15px]"} text-[var(--ink)] transition-colors group-hover:text-[var(--ink-3)]`}
          >
            {event.title}
          </h3>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${BadgeStyle(event.badgeType)}`}
          >
            {event.badge}
          </span>
        </div>

        <p className="mb-3 text-[13px] text-[var(--mute)]">
          {event.date} · {event.location}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--ink)]">{event.price}</span>
          {!isSoldOut && (
            <span className="text-[11px] font-semibold tracking-wide text-[var(--pulse)] uppercase transition-colors group-hover:text-[var(--pulse-deep)]">
              Ver ingresso
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-[var(--paper)] text-[var(--ink)]">
      <header
        className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[var(--paper)]/95 backdrop-blur-md"
        role="banner"
      >
        <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-6 px-6 md:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="AXON">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink)]">
              <Image
                src="/brand/symbol-axon.svg"
                alt=""
                width={18}
                height={18}
                aria-hidden="true"
                className="brightness-0 invert"
              />
            </div>
            <span className="text-[18px] font-black tracking-[-0.04em]">AXON</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
            <Link
              href="/eventos"
              className="text-sm font-medium text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
            >
              Eventos
            </Link>
            <Link
              href="#organizadores"
              className="text-sm font-medium text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
            >
              Para quem organiza
            </Link>
            <Link
              href={`https://wa.me/5584981235396?text=${encodeURIComponent("Olá! Preciso de ajuda com a AXON.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
            >
              Suporte
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/entrar"
              className="hidden px-3 py-2 text-sm font-medium text-[var(--mute)] transition-colors hover:text-[var(--ink)] sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              href="/entrar"
              className="inline-flex rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-bold text-[var(--paper)] transition-colors hover:bg-[var(--ink-2)]"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-[var(--rule)] pt-[88px] pb-[72px]">
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
          >
            <svg
              className="absolute bottom-0 -left-[5%] h-auto w-[110%] opacity-10"
              viewBox="0 0 1400 200"
              preserveAspectRatio="none"
              fill="none"
              stroke="var(--pulse)"
              strokeWidth="1.5"
            >
              <path d="M0 100 L280 100 L300 100 L320 55 L345 145 L370 100 L620 100 L645 100 L665 35 L690 165 L715 100 L960 100 L980 100 L1000 70 L1025 130 L1050 100 L1400 100" />
            </svg>
          </div>

          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper-pure)] px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--pulse)]" />
              <span className="text-[12px] font-medium text-[var(--mute)]">
                Rio Grande do Norte
              </span>
            </div>

            <h1 className="mb-5 max-w-[820px] text-[clamp(42px,8vw,96px)] leading-[0.95] font-black tracking-[-0.05em]">
              O RN sabe{" "}
              <span className="relative inline-block">
                <span className="relative z-10">fazer festa.</span>
                <span
                  className="absolute bottom-1 left-0 -z-0 h-3 w-full rounded"
                  style={{ backgroundColor: "var(--pulse)", opacity: 0.35 }}
                />
              </span>
            </h1>

            <p className="mb-10 max-w-[540px] text-[clamp(16px,2vw,20px)] leading-[1.6] text-[var(--ink-3)]">
              Carnaxelita, Vaquejada, Carnatal e muito mais. Compre seu ingresso agora, pague pelo
              Pix e chegue tranquilo.
            </p>

            <div className="mb-12 flex flex-wrap gap-3">
              <Link
                href="/eventos"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-6 py-3 text-[15px] font-bold text-[var(--paper)] transition-colors hover:bg-[var(--ink-2)]"
              >
                Ver todos os eventos
              </Link>
              <Link
                href={`https://wa.me/5584981235396?text=${encodeURIComponent("Oi! Quero saber mais sobre a AXON.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--rule)] bg-[var(--paper-pure)] px-6 py-3 text-[15px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--paper-soft)]"
              >
                Falar no WhatsApp
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-[var(--rule)] pt-8 md:grid-cols-4">
              {[
                { label: "Pix na hora", desc: "Aprovação instantânea" },
                { label: "QR Code", desc: "Ingresso digital seguro" },
                { label: "Sem fila", desc: "Tudo pelo celular" },
                { label: "Suporte", desc: "A gente te ajuda" },
              ].map(({ label, desc }) => (
                <div key={label}>
                  <p className="mb-0.5 text-[14px] font-bold text-[var(--ink)]">{label}</p>
                  <p className="text-[13px] text-[var(--mute)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Em destaque */}
        <section id="eventos" className="border-b border-[var(--rule)] py-[64px]">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-[var(--mute)] uppercase">
                  Em destaque
                </p>
                <h2 className="text-[clamp(22px,3vw,34px)] font-bold tracking-tight">
                  Os eventos mais esperados do estado
                </h2>
              </div>
              <Link
                href="/eventos"
                className="hidden text-sm font-semibold text-[var(--mute)] transition-colors hover:text-[var(--ink)] md:inline-flex"
              >
                Ver todos
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} size="lg" />
              ))}
            </div>
          </div>
        </section>

        {/* Mais eventos */}
        <section className="border-b border-[var(--rule)] bg-[var(--paper-soft)] py-[64px]">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-[var(--mute)] uppercase">
                  Outros eventos
                </p>
                <h2 className="text-[clamp(22px,3vw,34px)] font-bold tracking-tight">
                  Tem coisa boa por toda parte
                </h2>
              </div>
              <Link
                href="/eventos"
                className="hidden text-sm font-semibold text-[var(--mute)] transition-colors hover:text-[var(--ink)] md:inline-flex"
              >
                Ver todos
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
              {weekEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>

        {/* Categorias */}
        <section className="border-b border-[var(--rule)] py-[64px]">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-10">
              <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-[var(--mute)] uppercase">
                Categorias
              </p>
              <h2 className="text-[clamp(22px,3vw,34px)] font-bold tracking-tight">
                Cada tipo de rolê tem seu lugar
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Shows e Música", emoji: "🎵", href: "/eventos?categoria=show" },
                { label: "Esportes", emoji: "🏆", href: "/eventos?categoria=esporte" },
                { label: "Gospel e Religioso", emoji: "✨", href: "/eventos?categoria=religioso" },
                { label: "Festas e Micareta", emoji: "🎉", href: "/eventos?categoria=outro" },
              ].map(({ label, emoji, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex flex-col gap-3 rounded-2xl border border-[var(--rule)] bg-[var(--paper-pure)] p-5 text-left transition-all hover:border-[var(--rule-strong)] hover:shadow-md"
                >
                  <span className="text-[26px] leading-none">{emoji}</span>
                  <span className="text-[15px] leading-tight font-semibold text-[var(--ink)] transition-colors group-hover:text-[var(--ink-3)]">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-b border-[var(--rule)] bg-[var(--paper-soft)] py-[64px]">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-10">
              <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-[var(--mute)] uppercase">
                Como funciona
              </p>
              <h2 className="text-[clamp(22px,3vw,34px)] font-bold tracking-tight">
                Simples assim
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "Escolha o evento",
                  desc: "Explore os shows, vaquejadas e festas mais esperados do RN.",
                },
                {
                  n: "2",
                  title: "Compre pelo Pix",
                  desc: "Pagamento rápido e seguro. Em menos de um minuto o ingresso é seu.",
                },
                {
                  n: "3",
                  title: "Chega na frente",
                  desc: "Mostre o QR Code na entrada e aproveite. Sem papel, sem fila, sem dor de cabeça.",
                },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ink)] text-sm font-black text-[var(--paper)]">
                    {n}
                  </span>
                  <div>
                    <p className="mb-1 font-bold text-[var(--ink)]">{title}</p>
                    <p className="text-[14px] leading-relaxed text-[var(--mute)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Para organizadores */}
        <section id="organizadores" className="bg-[var(--ink)] py-[88px] text-[var(--paper)]">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2">
              <div>
                <p className="mb-4 text-[11px] font-semibold tracking-widest text-[var(--mute-2)] uppercase">
                  Para quem organiza eventos
                </p>
                <h2 className="mb-5 text-[clamp(26px,3.5vw,42px)] leading-[1.1] font-bold tracking-tight">
                  Você cuida do evento. A gente cuida do ingresso.
                </h2>
                <p className="mb-8 text-[16px] leading-relaxed text-[var(--mute-2)]">
                  Crie seu evento em minutos, acompanhe as vendas em tempo real e receba o dinheiro
                  no dia seguinte via Pix. Sem burocracia e sem taxa de adesão.
                </p>

                <ul className="mb-10 space-y-3">
                  {[
                    "Criação de evento em minutos",
                    "Venda de ingressos com lotes e meia-entrada",
                    "Repasse D+1 direto na sua conta",
                    "App de validação de QR Code na portaria",
                    "Dashboard com vendas em tempo real",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-[14px] text-[var(--mute-2)]"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pulse)]" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/organizador/comecar"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--pulse)] px-6 py-3 text-[15px] font-bold text-[var(--pulse-ink)] transition-colors hover:bg-[var(--pulse-deep)]"
                >
                  Quero vender ingressos
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "0%", label: "Sem taxa de adesão" },
                  { value: "D+1", label: "Repasse garantido" },
                  { value: "Pix", label: "Pagamento instantâneo" },
                  { value: "QR", label: "Validação segura" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 p-6"
                  >
                    <span className="text-[28px] font-black tracking-tight text-[var(--pulse)]">
                      {value}
                    </span>
                    <span className="text-[13px] leading-snug text-[var(--mute-2)]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--rule)] py-14">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--ink)]">
                  <Image
                    src="/brand/symbol-axon.svg"
                    alt=""
                    width={14}
                    height={14}
                    className="brightness-0 invert"
                  />
                </div>
                <span className="text-[15px] font-black tracking-[-0.04em]">AXON</span>
              </Link>
              <p className="mb-4 text-[13px] leading-relaxed text-[var(--mute)]">
                Ingressos online para os melhores eventos do Rio Grande do Norte.
              </p>
              <a
                href={`https://wa.me/5584981235396?text=${encodeURIComponent("Olá! Preciso de ajuda.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Falar com suporte
              </a>
            </div>

            <nav>
              <h3 className="mb-4 text-[11px] font-bold tracking-widest text-[var(--mute)] uppercase">
                Plataforma
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Ver eventos", href: "/eventos" },
                  { label: "Para organizadores", href: "/organizador/comecar" },
                  { label: "Minha conta", href: "/minha-conta" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13px] text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav>
              <h3 className="mb-4 text-[11px] font-bold tracking-widest text-[var(--mute)] uppercase">
                Contato
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href={`https://wa.me/5584981235396`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
                  >
                    +55 84 9 8123-5396
                  </a>
                </li>
                <li>
                  <p className="text-[13px] text-[var(--mute)]">CEO: Johnattan Dias</p>
                </li>
                <li>
                  <a
                    href={`https://wa.me/5584981235396?text=${encodeURIComponent("Olá! Preciso de ajuda.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
                  >
                    Suporte no WhatsApp
                  </a>
                </li>
              </ul>
            </nav>

            <nav>
              <h3 className="mb-4 text-[11px] font-bold tracking-widest text-[var(--mute)] uppercase">
                Legal
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacidade", href: "/privacidade" },
                  { label: "Termos de uso", href: "/termos" },
                  { label: "Reembolso", href: "/reembolso" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13px] text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--rule)] pt-8 sm:flex-row">
            <p className="text-[12px] text-[var(--mute)]">
              © 2026 AXON. Todos os direitos reservados.
            </p>
            <p className="text-[12px] text-[var(--mute-2)]">Desenvolvido pela Beyonder © 2026</p>
          </div>
        </div>
      </footer>

      {/* Botão flutuante de WhatsApp */}
      <a
        href={`https://wa.me/5584981235396?text=${encodeURIComponent("Olá! Preciso de ajuda com a AXON.")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  )
}
