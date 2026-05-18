import Link from "next/link"
import { AxonLogo } from "@/components/shared/AxonLogo"
import { EventsCarousel } from "@/components/shared/EventsCarousel"
import { CategoriesCarousel } from "@/components/shared/CategoriesCarousel"
import { NeuronAnimation } from "@/components/shared/NeuronAnimation"

export default function HomePage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}
    >
      <main>
        {/* Hero */}
        <section
          className="relative overflow-hidden border-b px-5 pt-[100px] pb-[80px] md:px-8"
          style={{ borderColor: "var(--rule)", backgroundColor: "#08080A" }}
        >
          {/* Gradient orbs — leves no mobile, plenas no desktop */}
          <div
            className="pointer-events-none absolute top-[-120px] left-[-80px] h-[300px] w-[300px] rounded-full opacity-25 md:h-[500px] md:w-[500px] md:opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(200,255,0,0.3) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-[-80px] bottom-[-80px] hidden h-[400px] w-[400px] rounded-full opacity-15 md:block"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
            aria-hidden="true"
          />

          {/* Neuron — sinapses + impulso elétrico viajando */}
          <NeuronAnimation className="absolute inset-0 h-full w-full opacity-60 md:opacity-80" />

          <div className="animate-in fade-in slide-in-from-bottom-8 relative mx-auto max-w-[1200px] duration-1000">
            {/* Eyebrow */}
            <div
              className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-md transition-colors hover:bg-white/10"
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
            <h1 className="relative z-10 mb-6 max-w-[820px] text-[clamp(44px,8vw,106px)] leading-[0.95] font-black tracking-[-0.055em] text-white">
              <span className="mb-2 block text-[clamp(28px,5vw,60px)] font-bold tracking-tight text-white/70">
                Dizem que
              </span>
              <span className="block">
                só se vive uma{" "}
                <span
                  style={{
                    color: "var(--pulse)",
                    textShadow: "0 0 20px color-mix(in srgb, var(--pulse) 35%, transparent)",
                  }}
                >
                  vez...
                </span>
              </span>
            </h1>

            <p className="relative z-10 mb-10 max-w-[520px] text-[clamp(15px,1.8vw,19px)] leading-[1.8] text-white/60">
              Eu não costumo duvidar disso.
              <br />O impulso é o que te move.
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both flex flex-wrap gap-4 delay-300 duration-1000">
              <Link
                href="/eventos"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-[16px] font-bold transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(200,255,0,0.5)]"
                style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
              >
                <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 ease-out group-hover:translate-y-0" />
                <span className="relative z-10">Bora ver</span>
              </Link>
              <Link
                href="/entrar"
                className="inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-[16px] font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
              >
                Criar conta
              </Link>
            </div>

            {/* Stats */}
            <div
              className="mt-14 grid grid-cols-2 gap-x-10 gap-y-6 border-t pt-10 md:grid-cols-4"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              {[
                { v: "9%", d: "Taxa do organizador" },
                { v: "Pix", d: "Cai em ~2 minutos" },
                { v: "D+1", d: "Repasse garantido" },
                { v: "0%", d: "Taxa de adesão" },
              ].map(({ v, d }) => (
                <div key={v} className="group flex flex-col items-start gap-1">
                  <p className="text-xl font-black text-white transition-colors group-hover:text-[var(--pulse)]">
                    {v}
                  </p>
                  <p className="text-[13px] text-white/50">{d}</p>
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
                  Eventos que valem a saída de casa
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

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Acha a sua noite",
                  desc: "Shows, vaquejadas, festivais, futsal. Filtra por cidade, categoria, data.",
                  badgeBg: "var(--pulse)",
                  badgeColor: "var(--pulse-ink)",
                  glow: "rgba(200,255,0,0.6)",
                },
                {
                  n: "02",
                  title: "Paga no Pix",
                  desc: "Cai na hora. Sem taxa surpresa, sem boleto, sem espera.",
                  badgeBg: "linear-gradient(135deg, var(--pulse) 0%, var(--pulse-deep) 100%)",
                  badgeColor: "var(--pulse-ink)",
                  glow: "rgba(162,217,0,0.5)",
                },
                {
                  n: "03",
                  title: "Entra pelo QR",
                  desc: "Ingresso no celular. Mostra na porta e some pra dentro. Funciona offline.",
                  badgeBg: "var(--ink)",
                  badgeColor: "var(--pulse)",
                  glow: "rgba(10,10,11,0.6)",
                },
              ].map(({ n, title, desc, badgeBg, badgeColor, glow }, idx) => (
                <div
                  key={n}
                  className="group relative flex gap-5 overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                  style={{
                    borderColor: "var(--rule)",
                    backgroundColor: "var(--paper-pure)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-15 blur-3xl transition-opacity group-hover:opacity-35"
                    style={{ backgroundColor: glow }}
                    aria-hidden="true"
                  />
                  {idx < 2 && (
                    <svg
                      className="pointer-events-none absolute top-1/2 -right-6 hidden h-6 w-12 -translate-y-1/2 opacity-30 md:block"
                      viewBox="0 0 48 24"
                      fill="none"
                      style={{ color: "var(--pulse-deep)" }}
                      aria-hidden="true"
                    >
                      <path
                        d="M2 12 L40 12 M30 4 L40 12 L30 20"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <span
                    className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-black tracking-[0.12em] transition-transform group-hover:scale-110"
                    style={{
                      background: badgeBg,
                      color: badgeColor,
                      boxShadow: `0 8px 24px -8px ${glow}`,
                    }}
                  >
                    {n}
                  </span>
                  <div className="relative z-10">
                    <p
                      className="mb-2 text-lg font-bold tracking-tight"
                      style={{ color: "var(--ink)" }}
                    >
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
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
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
              <Link
                href="/eventos"
                className="hidden text-sm font-semibold transition-colors hover:opacity-70 md:inline-flex"
                style={{ color: "var(--mute)" }}
              >
                Ver tudo →
              </Link>
            </div>

            <CategoriesCarousel />
          </div>
        </section>

        {/* Para organizadores */}
        <section
          id="organizadores"
          className="relative overflow-hidden py-[96px]"
          style={{ backgroundColor: "#08080A" }}
        >
          {/* Grid bg sutil */}
          <div
            className="axon-grid-bg pointer-events-none absolute inset-0 opacity-50"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] opacity-25"
            style={{
              background: "radial-gradient(circle, rgba(200,255,0,0.3) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] opacity-15"
            style={{
              background: "radial-gradient(circle, rgba(45,122,246,0.3) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
            aria-hidden="true"
          />

          {/* ECG no topo */}
          <svg
            className="pointer-events-none absolute top-0 right-0 left-0 h-3 opacity-50"
            viewBox="0 0 1400 24"
            preserveAspectRatio="none"
            fill="none"
            stroke="rgba(200,255,0,0.9)"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M0 12 L320 12 L340 12 L355 4 L375 20 L390 12 L720 12 L740 12 L755 2 L775 22 L790 12 L1080 12 L1100 12 L1115 6 L1130 18 L1145 12 L1400 12" />
          </svg>

          <div className="relative mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
              <div>
                <div className="mb-5 inline-flex items-center gap-2">
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: "var(--pulse)" }}
                  />
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-white/50 uppercase">
                    Para quem organiza
                  </p>
                </div>
                <h2 className="mb-5 text-[clamp(26px,3.5vw,46px)] leading-[1.05] font-black tracking-[-0.04em] text-white">
                  Você cria. A AXON{" "}
                  <span
                    style={{
                      color: "var(--pulse)",
                      textShadow: "0 0 20px color-mix(in srgb, var(--pulse) 30%, transparent)",
                    }}
                  >
                    transmite.
                  </span>
                </h2>
                <p className="mb-10 max-w-[480px] text-[16px] leading-relaxed text-white/60">
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
                    <li key={item} className="flex items-center gap-3 text-[14px] text-white/60">
                      <svg
                        className="h-3 w-3 shrink-0"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="var(--pulse)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M2 6l3 3 5-6" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/organizador/comecar"
                  className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-bold transition-all hover:scale-105 hover:shadow-[0_0_40px_-8px_var(--pulse)]"
                  style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
                >
                  Começar agora, é grátis
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: "0%", l: "Taxa de adesão", a: "var(--pulse)" },
                  { v: "D+1", l: "Repasse garantido", a: "var(--info)" },
                  { v: "Pix", l: "Pagamento instantâneo", a: "var(--success)" },
                  { v: "QR", l: "Validação segura", a: "var(--warning)" },
                ].map(({ v, l, a }) => (
                  <div
                    key={l}
                    className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-1"
                    style={{
                      borderColor: "rgba(255,255,255,0.1)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div
                      className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-30"
                      style={{ backgroundColor: a }}
                      aria-hidden="true"
                    />
                    <span
                      className="relative font-mono text-[30px] font-black tracking-tight"
                      style={{ color: a }}
                    >
                      {v}
                    </span>
                    <span className="text-[13px] leading-snug text-white/50">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Seção de Taxas — Transparência total */}
        <section
          className="border-b py-[80px]"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="mb-12 text-center">
              <p
                className="mb-2 text-[11px] font-semibold tracking-[0.12em] uppercase"
                style={{ color: "var(--mute)" }}
              >
                Sem letra miúda
              </p>
              <h2
                className="text-[clamp(24px,3vw,38px)] font-bold tracking-tight"
                style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
              >
                Taxas claras.{" "}
                <span style={{ color: "var(--pulse)" }}>Você decide como pagar.</span>
              </h2>
              <p className="mt-3 text-[15px]" style={{ color: "var(--mute)" }}>
                O comprador escolhe o método. A conveniência é repassada de forma transparente.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Pix */}
              <div
                className="group relative overflow-hidden rounded-2xl border-2 p-6 transition-all hover:-translate-y-1"
                style={{ borderColor: "var(--pulse)", backgroundColor: "rgba(200,255,0,0.03)" }}
              >
                <div
                  className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-20 blur-3xl"
                  style={{ backgroundColor: "var(--pulse)" }}
                  aria-hidden="true"
                />
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl">⚡</span>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
                  >
                    Recomendado
                  </span>
                </div>
                <p className="mb-1 text-2xl font-black" style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}>
                  R$ 1,00
                </p>
                <p className="mb-4 text-sm font-semibold" style={{ color: "var(--ink)" }}>Pix — por pedido</p>
                <ul className="space-y-2 text-[13px]" style={{ color: "var(--mute)" }}>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--pulse)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    Aprovação em ~2 minutos
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--pulse)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    Sem risco de chargeback
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--pulse)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    Organizador recebe em D+1
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--pulse)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    Menor custo para o comprador
                  </li>
                </ul>
              </div>

              {/* Cartão à vista */}
              <div
                className="group relative overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-1"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
              >
                <div
                  className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-10 blur-3xl"
                  style={{ backgroundColor: "var(--info)" }}
                  aria-hidden="true"
                />
                <div className="mb-4">
                  <span className="text-3xl">💳</span>
                </div>
                <p className="mb-1 text-2xl font-black" style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}>
                  +5%
                </p>
                <p className="mb-4 text-sm font-semibold" style={{ color: "var(--ink)" }}>Cartão à vista (1x)</p>
                <ul className="space-y-2 text-[13px]" style={{ color: "var(--mute)" }}>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--info)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    Aprovação em segundos
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--info)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    Funciona em qualquer banco
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--info)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    Ativado pelo organizador
                  </li>
                </ul>
              </div>

              {/* Parcelado */}
              <div
                className="group relative overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-1"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
              >
                <div
                  className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-10 blur-3xl"
                  style={{ backgroundColor: "var(--warning)" }}
                  aria-hidden="true"
                />
                <div className="mb-4">
                  <span className="text-3xl">📆</span>
                </div>
                <p className="mb-1 text-2xl font-black" style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}>
                  até 12x
                </p>
                <p className="mb-4 text-sm font-semibold" style={{ color: "var(--ink)" }}>Cartão parcelado</p>
                <ul className="space-y-2 text-[13px]" style={{ color: "var(--mute)" }}>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--warning)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    2–3x com +8% de conveniência
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--warning)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    6x com +12% de conveniência
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="var(--warning)" strokeWidth="1.5"><path d="M2 6l3 3 5-6"/></svg>
                    Ativado pelo organizador
                  </li>
                </ul>
              </div>
            </div>

            {/* Nota de rodapé */}
            <p className="mt-8 text-center text-[13px]" style={{ color: "var(--mute)" }}>
              A comissão AXON de <strong style={{ color: "var(--ink)" }}>9%</strong> é retida no split — o organizador recebe o valor líquido direto na conta.
              Taxas de conveniência são cobradas do comprador e exibidas antes da finalização.{" "}
              <Link href="/termos" style={{ color: "var(--pulse)" }} className="underline underline-offset-2">
                Ver termos completos
              </Link>
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer
        className="relative overflow-hidden border-t py-14"
        style={{ borderColor: "var(--rule)" }}
      >
        {/* ECG pulse decorativo */}
        <svg
          className="pointer-events-none absolute top-0 right-0 left-0 h-3 w-full opacity-50"
          viewBox="0 0 1400 24"
          preserveAspectRatio="none"
          fill="none"
          stroke="var(--pulse)"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M0 12 L320 12 L340 12 L355 4 L375 20 L390 12 L720 12 L740 12 L755 2 L775 22 L790 12 L1080 12 L1100 12 L1115 6 L1130 18 L1145 12 L1400 12" />
        </svg>
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="mb-4 inline-flex items-center">
                <AxonLogo size={20} tone="ink" />
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
              Desenvolvido por Beyonder - Johnattan Dias. 2026
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
