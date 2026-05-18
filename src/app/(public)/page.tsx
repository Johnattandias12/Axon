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
          className="relative overflow-hidden border-b px-5 pt-16 pb-12 sm:pt-24 sm:pb-20 md:px-8"
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
                { v: "Pix", d: "Cai na hora" },
                { v: "QR Code", d: "Ingresso no celular" },
                { v: "D+1", d: "Repasse pro organizador" },
                { v: "Offline", d: "Valida sem 4G" },
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
      </main>

    </div>
  )
}
