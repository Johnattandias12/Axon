import Image from "next/image"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

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
  accentColor: string
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const featuredEvents: MockEvent[] = [
  {
    id: "carnaxelita-2026",
    title: "Carnaxelita 2026",
    category: "Micareta",
    date: "12–15 Out 2026",
    location: "Currais Novos · RN",
    price: "R$ 120 – R$ 450",
    badge: "Lote 2 · 23 restantes",
    badgeType: "limited",
    gradient: "from-[#3d1c02] via-[#1a0a00] to-[#0A0A0B]",
    accentColor: "#E89400",
  },
  {
    id: "gospel-rn-2026",
    title: "Festival Gospel RN",
    category: "Gospel",
    date: "28–29 Jun 2026",
    location: "Natal · RN",
    price: "Gratuito · VIP R$ 80",
    badge: "Inscrições abertas",
    badgeType: "free",
    gradient: "from-[#1c0a3d] via-[#0e0520] to-[#0A0A0B]",
    accentColor: "#7C3AED",
  },
  {
    id: "futsal-final-rn",
    title: "Final Campeonato Futsal RN",
    category: "Esportes",
    date: "15 Jun 2026",
    location: "Arena Natal · RN",
    price: "—",
    badge: "Esgotado",
    badgeType: "sold-out",
    gradient: "from-[#021a3d] via-[#000e20] to-[#0A0A0B]",
    accentColor: "#2D7AF6",
  },
]

const weekEvents: MockEvent[] = [
  {
    id: "vaquejada-2026",
    title: "Vaquejada 2026",
    category: "Tradição",
    date: "04–07 Ago",
    location: "Currais Novos · RN",
    price: "R$ 80 – R$ 300",
    badge: "Lote 1 disponível",
    badgeType: "available",
    gradient: "from-[#2a1800] via-[#150c00] to-[#0A0A0B]",
    accentColor: "#E89400",
  },
  {
    id: "forro-natal",
    title: "Show de Forró",
    category: "Música",
    date: "Sáb, 20 Jun",
    location: "Natal · RN",
    price: "R$ 60",
    badge: "Disponível",
    badgeType: "available",
    gradient: "from-[#2a0014] via-[#150009] to-[#0A0A0B]",
    accentColor: "#E5342B",
  },
  {
    id: "standup-mossoro",
    title: "Stand-up Comedy Night",
    category: "Humor",
    date: "Sex, 19 Jun",
    location: "Mossoró · RN",
    price: "R$ 45",
    badge: "Disponível",
    badgeType: "available",
    gradient: "from-[#002a1a] via-[#00150d] to-[#0A0A0B]",
    accentColor: "#00B96B",
  },
  {
    id: "workshop-foto-natal",
    title: "Workshop de Fotografia",
    category: "Educação",
    date: "Dom, 21 Jun",
    location: "Natal · RN",
    price: "R$ 120",
    badge: "Últimas vagas",
    badgeType: "limited",
    gradient: "from-[#001a2a] via-[#000d15] to-[#0A0A0B]",
    accentColor: "#2D7AF6",
  },
]

// ─── Badge helper ──────────────────────────────────────────────────────────────

function BadgeTypeStyles(type: MockEvent["badgeType"]) {
  switch (type) {
    case "limited":
      return "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30"
    case "sold-out":
      return "bg-[var(--ink-3)]/30 text-[var(--mute-2)] border-[var(--mute-2)]/20"
    case "free":
      return "bg-[var(--pulse-soft)] text-[var(--pulse-ink)] border-[var(--pulse)]/30"
    default:
      return "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/30"
  }
}

// ─── EventCard ─────────────────────────────────────────────────────────────────

function EventCard({ event, size = "md" }: { event: MockEvent; size?: "lg" | "md" }) {
  const isSoldOut = event.badgeType === "sold-out"
  const aspectRatio = size === "lg" ? "aspect-[4/3]" : "aspect-[3/2]"

  return (
    <article className="group flex cursor-pointer flex-col" aria-label={event.title}>
      {/* Imagem / placeholder */}
      <div
        className={`relative overflow-hidden rounded-[var(--radius-lg)] ${aspectRatio} mb-4 bg-gradient-to-br ${event.gradient}`}
      >
        {/* Categoria */}
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-[var(--radius-sm)] border border-[var(--rule)]/30 bg-[var(--ink)]/70 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-[var(--mute-2)] uppercase backdrop-blur-sm">
            {event.category}
          </span>
        </div>

        {/* Sold-out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--ink)]/60">
            <span className="font-mono text-[11px] tracking-[0.15em] text-[var(--mute-2)] uppercase">
              Esgotado
            </span>
          </div>
        )}

        {/* Hover scale */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/40 to-transparent opacity-0 transition-opacity duration-[var(--duration-normal)] group-hover:opacity-100"
          aria-hidden="true"
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3
            className={`leading-snug font-semibold tracking-[-0.02em] ${size === "lg" ? "text-[18px]" : "text-[16px]"} text-[var(--ink)] transition-colors group-hover:text-[var(--ink-3)]`}
          >
            {event.title}
          </h3>
          <span
            className={`shrink-0 rounded-[var(--radius-full)] border px-2 py-0.5 font-mono text-[10px] ${BadgeTypeStyles(event.badgeType)}`}
          >
            {event.badge}
          </span>
        </div>

        <p className="mb-3 text-[13px] text-[var(--mute)]">
          {event.date} · {event.location}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <span className="font-mono text-[13px] font-medium text-[var(--ink)]">{event.price}</span>
          {!isSoldOut && (
            <button
              className="font-mono text-[11px] tracking-[0.1em] text-[var(--pulse)] uppercase transition-colors hover:text-[var(--pulse-deep)]"
              aria-label={`Garantir ingresso para ${event.title}`}
            >
              Garantir Ingresso →
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-[var(--paper)] text-[var(--ink)]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[var(--paper)]/90 backdrop-blur-md"
        role="banner"
      >
        <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-6 px-6 md:px-8">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="AXON — início">
            <Image src="/brand/symbol-axon.svg" alt="" width={24} height={24} aria-hidden="true" />
            <span className="text-[17px] font-extrabold tracking-[-0.03em]">AXON</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:block" aria-label="Navegação principal">
            <ul className="flex gap-7">
              <li>
                <Link
                  href="#eventos"
                  className="font-mono text-[12px] tracking-[0.1em] text-[var(--mute)] uppercase transition-colors hover:text-[var(--ink)]"
                >
                  Eventos
                </Link>
              </li>
              <li>
                <Link
                  href="#organizadores"
                  className="font-mono text-[12px] tracking-[0.1em] text-[var(--mute)] uppercase transition-colors hover:text-[var(--ink)]"
                >
                  Para Organizadores
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre"
                  className="font-mono text-[12px] tracking-[0.1em] text-[var(--mute)] uppercase transition-colors hover:text-[var(--ink)]"
                >
                  Sobre
                </Link>
              </li>
            </ul>
          </nav>

          {/* Auth CTAs */}
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/entrar"
              className="hidden px-3 py-1.5 font-mono text-[12px] tracking-[0.08em] text-[var(--mute)] uppercase transition-colors hover:text-[var(--ink)] sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex rounded-[var(--radius-md)] bg-[var(--ink)] px-4 py-2 font-mono text-[12px] tracking-[0.08em] text-[var(--paper)] uppercase transition-colors hover:bg-[var(--ink-2)]"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden border-b border-[var(--rule)] pt-[96px] pb-[80px]"
          aria-label="Início"
        >
          {/* ECG ambient line */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
          >
            <svg
              className="absolute bottom-[8%] -left-[5%] h-auto w-[110%] opacity-20"
              viewBox="0 0 1400 200"
              preserveAspectRatio="none"
              fill="none"
              stroke="var(--pulse)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            >
              <path d="M0 100 L280 100 L300 100 L320 55 L345 145 L370 100 L620 100 L645 100 L665 35 L690 165 L715 100 L960 100 L980 100 L1000 70 L1025 130 L1050 100 L1400 100" />
            </svg>
          </div>

          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            {/* Eyebrow */}
            <div className="mb-8 flex items-center gap-2.5">
              <span
                className="inline-block h-2 w-2 rounded-full bg-[var(--pulse)]"
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--mute)] uppercase">
                AXON · Marketplace de Ingressos
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 max-w-[900px] text-[clamp(52px,9vw,120px)] leading-[0.95] font-black tracking-[-0.055em]">
              O{" "}
              <em className="bg-[linear-gradient(180deg,transparent_58%,var(--pulse)_58%)] not-italic">
                impulso
              </em>{" "}
              do ingresso.
            </h1>

            <p className="mb-10 max-w-[580px] text-[clamp(17px,2vw,22px)] leading-[1.5] text-[var(--ink-3)]">
              Compra em segundos. QR assinado digitalmente. Acesso verificado — mesmo offline.
            </p>

            {/* Search */}
            <div
              className="mb-14 flex max-w-[640px] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--rule-strong)] bg-[var(--paper-pure)] px-4 py-3 shadow-[var(--shadow-md)]"
              role="search"
            >
              <svg
                className="shrink-0 text-[var(--mute-2)]"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Buscar evento, artista ou local..."
                className="flex-1 bg-transparent font-sans text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--mute-2)]"
                aria-label="Buscar eventos"
              />
              <button
                className="shrink-0 rounded-[var(--radius-md)] bg-[var(--ink)] px-4 py-2 font-mono text-[12px] tracking-[0.08em] text-[var(--paper)] uppercase transition-colors hover:bg-[var(--ink-2)]"
                aria-label="Buscar"
              >
                Buscar
              </button>
            </div>

            {/* Stats */}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-[var(--rule)] pt-10 md:grid-cols-4">
              {[
                { term: "Checkout", detail: "Pix Instantâneo" },
                { term: "Autenticação", detail: "QR HMAC Server-side" },
                { term: "Portaria", detail: "Validação Offline" },
                { term: "Repasse", detail: "D+1 Garantido" },
              ].map(({ term, detail }) => (
                <div key={term}>
                  <dt className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-[var(--mute)] uppercase">
                    {term}
                  </dt>
                  <dd className="text-[15px] font-medium text-[var(--ink)]">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Em Destaque ─────────────────────────────────────────────────── */}
        <section
          id="eventos"
          className="border-b border-[var(--rule)] py-[72px]"
          aria-label="Em Destaque"
        >
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pulse)]"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--mute)] uppercase">
                    Em Destaque
                  </span>
                </div>
                <h2 className="text-[clamp(24px,3vw,36px)] font-bold tracking-[-0.03em]">
                  Os eventos do momento.
                </h2>
              </div>
              <Link
                href="/eventos"
                className="hidden font-mono text-[12px] tracking-[0.08em] text-[var(--mute)] uppercase transition-colors hover:text-[var(--ink)] md:inline-flex"
                aria-label="Ver todos os eventos em destaque"
              >
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} size="lg" />
              ))}
            </div>
          </div>
        </section>

        {/* ── Esta Semana ──────────────────────────────────────────────────── */}
        <section
          className="border-b border-[var(--rule)] bg-[var(--paper-soft)] py-[72px]"
          aria-label="Esta Semana"
        >
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pulse)]"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--mute)] uppercase">
                    Esta Semana
                  </span>
                </div>
                <h2 className="text-[clamp(24px,3vw,36px)] font-bold tracking-[-0.03em]">
                  O que está acontecendo.
                </h2>
              </div>
              <Link
                href="/eventos?periodo=semana"
                className="hidden font-mono text-[12px] tracking-[0.08em] text-[var(--mute)] uppercase transition-colors hover:text-[var(--ink)] md:inline-flex"
                aria-label="Ver todos os eventos desta semana"
              >
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
              {weekEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Perto de Você ────────────────────────────────────────────────── */}
        <section className="border-b border-[var(--rule)] py-[72px]" aria-label="Perto de Você">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pulse)]"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--mute)] uppercase">
                    Perto de Você
                  </span>
                  <span className="rounded-[var(--radius-full)] border border-[var(--rule)] bg-[var(--paper-soft)] px-2 py-0.5 font-mono text-[10px] text-[var(--mute)]">
                    Rio Grande do Norte
                  </span>
                </div>
                <h2 className="text-[clamp(24px,3vw,36px)] font-bold tracking-[-0.03em]">
                  Sua cidade. Sua agenda.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
              {[...featuredEvents.slice(0, 2), ...weekEvents.slice(0, 2)].map((event) => (
                <EventCard key={`nearby-${event.id}`} event={event} />
              ))}
            </div>

            <p className="mt-6 font-mono text-[13px] text-[var(--mute)]">
              Localização baseada em preferências. Ative para resultados personalizados.
            </p>
          </div>
        </section>

        {/* ── Categorias ──────────────────────────────────────────────────── */}
        <section
          className="border-b border-[var(--rule)] bg-[var(--paper-soft)] py-[72px]"
          aria-label="Categorias"
        >
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-10">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pulse)]"
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--mute)] uppercase">
                  Categorias
                </span>
              </div>
              <h2 className="text-[clamp(24px,3vw,36px)] font-bold tracking-[-0.03em]">
                Qualquer tipo de evento.
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Shows & Música", icon: "♪", color: "var(--danger)" },
                { label: "Esportes", icon: "◎", color: "var(--info)" },
                { label: "Gospel & Religioso", icon: "✦", color: "#7C3AED" },
                { label: "Festas & Micareta", icon: "◈", color: "var(--warning)" },
              ].map(({ label, icon, color }) => (
                <button
                  key={label}
                  className="group flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--rule)] bg-[var(--paper-pure)] p-5 text-left transition-all duration-[var(--duration-normal)] hover:border-[var(--rule-strong)] hover:shadow-[var(--shadow-md)]"
                  aria-label={`Explorar eventos de ${label}`}
                >
                  <span className="text-[22px] leading-none" style={{ color }} aria-hidden="true">
                    {icon}
                  </span>
                  <span className="text-[15px] leading-tight font-medium text-[var(--ink)] transition-colors group-hover:text-[var(--ink-3)]">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Para Organizadores ──────────────────────────────────────────── */}
        <section
          id="organizadores"
          className="bg-[var(--ink)] py-[96px] text-[var(--paper)]"
          aria-label="Para Organizadores"
        >
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
              <div>
                <div className="mb-6 flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pulse)]"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--mute-2)] uppercase">
                    Para Organizadores
                  </span>
                </div>

                <h2 className="mb-6 text-[clamp(28px,3.5vw,44px)] leading-[1.1] font-bold tracking-[-0.03em]">
                  Organize com <em className="text-[var(--pulse)] not-italic">precisão.</em>
                </h2>

                <p className="mb-8 text-[17px] leading-[1.65] text-[var(--mute-2)]">
                  Painel completo para criar eventos, gerenciar lotes, acompanhar vendas em tempo
                  real e receber o repasse no dia seguinte. Sem taxa de setup. Sem contrato de
                  fidelidade.
                </p>

                <ul className="mb-10 space-y-3" aria-label="Funcionalidades para organizadores">
                  {[
                    "Dashboard com métricas em tempo real",
                    "Gestão de lotes e meia-entrada automática",
                    "Split de pagamento nativo (Pagar.me)",
                    "PWA de portaria para validação de QR",
                    "Repasse D+1 via Pix",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[15px] text-[var(--mute-2)]"
                    >
                      <span className="mt-0.5 shrink-0 font-mono text-[12px] text-[var(--pulse)]">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/cadastro?tipo=organizador"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--pulse)] px-6 py-3 font-mono text-[13px] font-bold tracking-[0.1em] text-[var(--pulse-ink)] uppercase transition-colors hover:bg-[var(--pulse-deep)]"
                >
                  Criar conta gratuita →
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-5">
                {[
                  { value: "0%", label: "Taxa de setup" },
                  { value: "D+1", label: "Repasse garantido" },
                  { value: "40%", label: "Meia-entrada automática" },
                  { value: "QR HMAC", label: "Autenticação server-side" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 rounded-[var(--radius-xl)] border border-[var(--ink-3)] p-6"
                  >
                    <span className="font-mono text-[28px] font-bold tracking-[-0.03em] text-[var(--pulse)]">
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

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--rule)] py-14" role="contentinfo">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="mb-3 flex items-center gap-2" aria-label="AXON — início">
                <Image
                  src="/brand/symbol-axon.svg"
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
                <span className="text-[16px] font-extrabold tracking-[-0.03em]">AXON</span>
              </Link>
              <p className="text-[13px] leading-[1.6] text-[var(--mute)]">
                Marketplace brasileiro de ingressos. Do clique à catraca.
              </p>
            </div>

            {/* Plataforma */}
            <nav aria-label="Links da plataforma">
              <h3 className="mb-4 font-mono text-[10px] tracking-[0.14em] text-[var(--mute)] uppercase">
                Plataforma
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Explorar Eventos", href: "/eventos" },
                  { label: "Para Organizadores", href: "/organizador" },
                  { label: "PWA de Portaria", href: "/scan" },
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

            {/* Empresa */}
            <nav aria-label="Links da empresa">
              <h3 className="mb-4 font-mono text-[10px] tracking-[0.14em] text-[var(--mute)] uppercase">
                Empresa
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Sobre", href: "/sobre" },
                  { label: "Contato", href: "/contato" },
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

            {/* Legal */}
            <nav aria-label="Links legais">
              <h3 className="mb-4 font-mono text-[10px] tracking-[0.14em] text-[var(--mute)] uppercase">
                Legal
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacidade", href: "/privacidade" },
                  { label: "Termos de Uso", href: "/termos" },
                  { label: "Política de Reembolso", href: "/reembolso" },
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

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--rule)] pt-8 sm:flex-row">
            <p className="font-mono text-[11px] tracking-[0.04em] text-[var(--mute)]">
              © 2026 AXON. O sinal chega antes do som.
            </p>
            <p className="font-mono text-[11px] text-[var(--mute-2)]">
              Feito no Rio Grande do Norte.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
