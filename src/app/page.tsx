import Link from "next/link"
import { AxonLogo } from "@/components/shared/AxonLogo"
import { EventsCarousel } from "@/components/shared/EventsCarousel"

export default function HomePage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "var(--rule)",
          backgroundColor: "color-mix(in srgb, var(--paper) 85%, transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto flex h-[58px] max-w-[1200px] items-center justify-between gap-6 px-5 md:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="AXON">
            <AxonLogo size={24} className="text-white" />
            <span className="text-xl font-black tracking-tight" style={{ color: "var(--ink)" }}>
              AXON
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/eventos"
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--mute)" }}
            >
              Eventos
            </Link>
            <a
              href="#organizadores"
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--mute)" }}
            >
              Organizadores
            </a>
            <a
              href={`https://wa.me/5584981235396?text=${encodeURIComponent("Olá! Preciso de ajuda com a AXON.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--mute)" }}
            >
              Suporte
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/entrar"
              className="hidden px-3 py-2 text-sm font-medium transition-colors sm:inline-flex"
              style={{ color: "var(--mute)" }}
            >
              Entrar
            </Link>
            <Link
              href="/entrar"
              className="inline-flex rounded-xl px-4 py-2 text-sm font-bold transition-colors"
              style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          className="relative overflow-hidden border-b px-5 pt-[100px] pb-[80px] md:px-8"
          style={{ borderColor: "var(--rule)", backgroundColor: "#08080A" }}
        >
          {/* Gradient orbs */}
          <div
            className="pointer-events-none absolute top-[-120px] left-[-80px] h-[500px] w-[500px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(200,255,0,0.3) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-[-80px] bottom-[-80px] h-[400px] w-[400px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-8"
            style={{
              background: "radial-gradient(circle, rgba(200,255,0,0.2) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
            aria-hidden="true"
          />

          {/* ECG pulse SVG */}
          <svg
            className="pointer-events-none absolute bottom-0 left-0 h-auto w-full opacity-10"
            viewBox="0 0 1400 120"
            preserveAspectRatio="none"
            fill="none"
            stroke="rgba(200,255,0,0.9)"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M0 60 L300 60 L320 60 L340 20 L365 100 L390 60 L680 60 L700 60 L720 10 L745 110 L770 60 L1060 60 L1080 60 L1100 35 L1125 85 L1150 60 L1400 60" />
          </svg>

          <div className="relative mx-auto max-w-[1200px]">
            {/* Eyebrow */}
            <div
              className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--pulse)" }}
              />
              <span className="text-[11px] font-semibold tracking-[0.12em] text-white/50 uppercase">
                AXON Ingressos
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 max-w-[820px] text-[clamp(44px,8vw,106px)] leading-[0.93] font-black tracking-[-0.055em] text-white">
              dizem que só se vive{" "}
              <span className="relative inline-block">
                <span className="relative z-10">uma vez... </span>
                <span
                  className="absolute bottom-1 left-0 z-0 h-[0.18em] w-full rounded"
                  style={{ backgroundColor: "var(--pulse)", opacity: 0.85 }}
                />
              </span>
            </h1>

            <p className="mb-10 max-w-[520px] text-[clamp(15px,1.8vw,19px)] leading-[1.65] text-white/50">
              eu não costumo duvidar disso. o impulso é o que te move.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/eventos"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
              >
                Explorar eventos
              </Link>
              <Link
                href="/entrar"
                className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
              >
                Criar conta grátis
              </Link>
            </div>

            {/* Stats */}
            <div
              className="mt-14 grid grid-cols-2 gap-x-10 gap-y-6 border-t pt-10 md:grid-cols-4"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              {[
                { v: "Pix", d: "Aprovação instantânea" },
                { v: "QR Code", d: "Ingresso no celular" },
                { v: "D+1", d: "Repasse ao organizador" },
                { v: "Offline", d: "Validação sem internet" },
              ].map(({ v, d }) => (
                <div key={v}>
                  <p className="mb-0.5 text-sm font-bold text-white">{v}</p>
                  <p className="text-[13px] text-white/40">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Eventos em destaque */}
        <section className="border-b py-[64px]" style={{ borderColor: "var(--rule)" }}>
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p
                  className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase"
                  style={{ color: "var(--mute)" }}
                >
                  Em destaque
                </p>
                <h2
                  className="text-[clamp(22px,3vw,34px)] font-bold tracking-tight"
                  style={{ color: "var(--ink)" }}
                >
                  Eventos que valem a experiência
                </h2>
              </div>
              <Link
                href="/eventos"
                className="hidden text-sm font-semibold transition-colors hover:opacity-70 md:inline-flex"
                style={{ color: "var(--mute)" }}
              >
                Ver todos
              </Link>
            </div>

            <EventsCarousel />
          </div>
        </section>

        {/* Como funciona */}
        <section
          className="border-b py-[64px]"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
        >
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="mb-12">
              <p
                className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase"
                style={{ color: "var(--mute)" }}
              >
                Como funciona
              </p>
              <h2
                className="text-[clamp(22px,3vw,34px)] font-bold tracking-tight"
                style={{ color: "var(--ink)" }}
              >
                Três etapas. Zero complicação.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Escolha o evento",
                  desc: "Navegue por shows, vaquejadas, festivais e muito mais. Filtre por categoria, cidade ou data.",
                  accent: "var(--pulse)",
                },
                {
                  n: "02",
                  title: "Pague pelo Pix",
                  desc: "Aprovação em segundos. Sem precisar sair do celular, sem taxa surpresa, sem burocracia.",
                  accent: "var(--info)",
                },
                {
                  n: "03",
                  title: "Entre pelo QR Code",
                  desc: "Seu ingresso digital aparece na tela. Mostre na entrada e aproveite. Funciona até offline.",
                  accent: "var(--success)",
                },
              ].map(({ n, title, desc, accent }) => (
                <div key={n} className="flex gap-5">
                  <span
                    className="shrink-0 font-mono text-[11px] font-bold tracking-[0.12em]"
                    style={{ color: accent, marginTop: "2px" }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="mb-2 font-bold" style={{ color: "var(--ink)" }}>
                      {title}
                    </p>
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--mute)" }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categorias */}
        <section className="border-b py-[64px]" style={{ borderColor: "var(--rule)" }}>
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="mb-10">
              <p
                className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase"
                style={{ color: "var(--mute)" }}
              >
                Categorias
              </p>
              <h2
                className="text-[clamp(22px,3vw,34px)] font-bold tracking-tight"
                style={{ color: "var(--ink)" }}
              >
                Cada tipo de emoção tem um palco
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                {
                  label: "Shows e Música",
                  href: "/eventos?categoria=show",
                  accent: "var(--danger)",
                },
                { label: "Esportes", href: "/eventos?categoria=esporte", accent: "var(--info)" },
                {
                  label: "Gospel e Religioso",
                  href: "/eventos?categoria=religioso",
                  accent: "#7C3AED",
                },
                {
                  label: "Festas e Micareta",
                  href: "/eventos?categoria=outro",
                  accent: "var(--pulse)",
                },
              ].map(({ label, href, accent }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:shadow-md"
                  style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
                >
                  <div
                    className="mb-10 h-1 w-8 rounded-full transition-all group-hover:w-12"
                    style={{ backgroundColor: accent }}
                  />
                  <p
                    className="text-[15px] leading-tight font-semibold"
                    style={{ color: "var(--ink)" }}
                  >
                    {label}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Para organizadores */}
        <section
          id="organizadores"
          className="relative overflow-hidden py-[96px]"
          style={{ backgroundColor: "#08080A" }}
        >
          <div
            className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] opacity-15"
            style={{
              background: "radial-gradient(circle, rgba(200,255,0,0.25) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
              <div>
                <p className="mb-5 text-[11px] font-semibold tracking-[0.12em] text-white/40 uppercase">
                  Para quem organiza
                </p>
                <h2 className="mb-5 text-[clamp(26px,3.5vw,46px)] leading-[1.05] font-black tracking-[-0.04em] text-white">
                  Você cria. A AXON <span style={{ color: "var(--pulse)" }}>transmite.</span>
                </h2>
                <p className="mb-10 text-[16px] leading-relaxed text-white/50">
                  Do evento criado ao ingresso vendido em minutos. Dashboard em tempo real, repasse
                  D+1 via Pix e validação de QR na portaria. Sem taxa de adesão.
                </p>

                <ul className="mb-10 space-y-3">
                  {[
                    "Criação de evento em menos de 5 minutos",
                    "Lotes com preços e datas configuráveis",
                    "Meia-entrada automática (Lei 12.933/2013)",
                    "Repasse D+1 direto na conta",
                    "App de validação offline para a portaria",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[14px] text-white/50">
                      <span
                        className="h-px w-4 shrink-0"
                        style={{ backgroundColor: "var(--pulse)" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/organizador/comecar"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
                >
                  Começar agora, é grátis
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: "0%", l: "Taxa de adesão" },
                  { v: "D+1", l: "Repasse garantido" },
                  { v: "Pix", l: "Pagamento instantâneo" },
                  { v: "QR", l: "Validação segura" },
                ].map(({ v, l }) => (
                  <div
                    key={l}
                    className="flex flex-col gap-3 rounded-2xl border p-6"
                    style={{
                      borderColor: "rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span
                      className="font-mono text-[30px] font-black tracking-tight"
                      style={{ color: "var(--pulse)" }}
                    >
                      {v}
                    </span>
                    <span className="text-[13px] leading-snug text-white/40">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-14" style={{ borderColor: "var(--rule)" }}>
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="mb-4 flex items-center gap-2.5">
                <AxonLogo size={20} className="text-white" />
                <span
                  className="text-[17px] font-black tracking-tight"
                  style={{ color: "var(--ink)" }}
                >
                  AXON
                </span>
              </Link>
              <p className="mb-5 text-[13px] leading-relaxed" style={{ color: "var(--mute)" }}>
                Ingressos digitais para os melhores eventos.
              </p>
              <a
                href={`https://wa.me/5584981235396?text=${encodeURIComponent("Olá! Preciso de ajuda.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Suporte no WhatsApp
              </a>
            </div>

            <nav>
              <h3
                className="mb-4 text-[11px] font-bold tracking-[0.12em] uppercase"
                style={{ color: "var(--mute)" }}
              >
                Plataforma
              </h3>
              <ul className="space-y-2.5">
                {[
                  { l: "Ver eventos", h: "/eventos" },
                  { l: "Para organizadores", h: "/organizador/comecar" },
                  { l: "Minha conta", h: "/minha-conta" },
                ].map(({ l, h }) => (
                  <li key={h}>
                    <Link
                      href={h}
                      className="text-[13px] transition-colors hover:opacity-100"
                      style={{ color: "var(--mute)" }}
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav>
              <h3
                className="mb-4 text-[11px] font-bold tracking-[0.12em] uppercase"
                style={{ color: "var(--mute)" }}
              >
                Contato
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href={`https://wa.me/5584981235396?text=${encodeURIComponent("Olá! Preciso de ajuda com a AXON.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] transition-colors hover:opacity-100"
                    style={{ color: "var(--mute)" }}
                  >
                    Suporte pelo WhatsApp
                  </a>
                </li>
              </ul>
            </nav>

            <nav>
              <h3
                className="mb-4 text-[11px] font-bold tracking-[0.12em] uppercase"
                style={{ color: "var(--mute)" }}
              >
                Legal
              </h3>
              <ul className="space-y-2.5">
                {[
                  { l: "Privacidade", h: "/privacidade" },
                  { l: "Termos de uso", h: "/termos" },
                  { l: "Reembolso", h: "/reembolso" },
                ].map(({ l, h }) => (
                  <li key={h}>
                    <Link
                      href={h}
                      className="text-[13px] transition-colors hover:opacity-100"
                      style={{ color: "var(--mute)" }}
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div
            className="flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row"
            style={{ borderColor: "var(--rule)" }}
          >
            <p className="text-[12px]" style={{ color: "var(--mute-2)" }}>
              © 2026 AXON. Todos os direitos reservados.
            </p>
            <p className="text-[12px]" style={{ color: "var(--mute-2)" }}>
              desenvolvido por beyonder 2026 johnattan dias.
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp flutuante */}
      <a
        href={`https://wa.me/5584981235396?text=${encodeURIComponent("Olá! Preciso de ajuda com a AXON.")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Suporte no WhatsApp"
        className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: "#25D366" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  )
}
