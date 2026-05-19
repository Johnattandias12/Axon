import { SiteHeader } from "@/components/shared/SiteHeader"
import { SiteFooter } from "@/components/shared/SiteFooter"
import Link from "next/link"
import { Wallet, Users, Sparkles, ArrowRight, Smartphone, CreditCard, Trophy } from "lucide-react"

export const metadata = {
  title: "Em breve · AXON",
  description: "Cartão AXON NFC, Crew & Ranking, Wallet — o futuro do AXON.",
}

export default function EmBrevePage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--paper)" }}>
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section
          className="relative overflow-hidden border-b"
          style={{ borderColor: "var(--rule)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at top, color-mix(in srgb, var(--pulse) 18%, transparent), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28 md:px-8">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
              style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
            >
              <Sparkles size={11} />
              Em breve
            </span>
            <h1
              className="mt-5 text-4xl leading-[1.05] font-black tracking-tight sm:text-5xl md:text-6xl"
              style={{ color: "var(--ink)", letterSpacing: "-0.045em" }}
            >
              O AXON que ainda
              <br />
              <span style={{ color: "var(--pulse)" }}>tá chegando.</span>
            </h1>
            <p
              className="mt-5 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--mute)" }}
            >
              Cartão NFC, ranking de crew, wallet cashless. A noite vai virar com a gente.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/eventos"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
              >
                Quero ir já no próximo
                <ArrowRight size={16} />
              </Link>
              <a
                href="https://www.instagram.com/axon.way/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-colors hover:opacity-80"
                style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
              >
                Segue @axon.way
              </a>
            </div>
          </div>
        </section>

        {/* CARD NFC */}
        <section className="border-b" style={{ borderColor: "var(--rule)" }}>
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:py-28 md:grid-cols-2 md:px-8">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase"
                style={{ backgroundColor: "var(--info-soft)", color: "var(--info)" }}
              >
                <CreditCard size={11} />
                Cartão AXON
              </span>
              <h2
                className="mt-4 text-3xl leading-tight font-black tracking-tight sm:text-4xl"
                style={{ color: "var(--ink)" }}
              >
                Aproxima. Entra.
                <br />
                Bebe. Sai.
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--mute)" }}>
                O Cartão AXON carrega seus ingressos e seu saldo. Encosta na portaria, entra direto.
                No bar, é só aproximar. Sem fila, sem dinheiro, sem fricção.
              </p>
              <ul className="mt-6 space-y-3 text-sm" style={{ color: "var(--ink)" }}>
                {[
                  "Entrada por NFC físico ou Apple/Google Wallet",
                  "Cashless no bar — recarga via PIX",
                  "Histórico de tudo dentro do app",
                  "Recupera saldo se sair antes",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: "var(--pulse)" }}
                    />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mockup iPhone com Cartão AXON */}
            <div className="relative flex items-center justify-center">
              <div
                className="pointer-events-none absolute -inset-10"
                style={{
                  background:
                    "radial-gradient(circle at center, color-mix(in srgb, var(--pulse) 25%, transparent), transparent 70%)",
                }}
              />
              <div
                className="relative h-[520px] w-[260px] rounded-[3rem] border-4 p-2 shadow-2xl"
                style={{ borderColor: "#1a1a1f", backgroundColor: "#08080A" }}
              >
                {/* notch */}
                <div
                  className="absolute top-1.5 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: "#08080A" }}
                />
                <div className="relative h-full w-full overflow-hidden rounded-[2.5rem]">
                  {/* status bar */}
                  <div className="flex h-10 items-center justify-between px-6 pt-3 text-[10px] font-bold text-white">
                    <span>23:47</span>
                    <span>● ● ●</span>
                  </div>
                  {/* card visual */}
                  <div className="flex h-full flex-col items-center justify-center px-5">
                    <p
                      className="mb-3 text-[10px] font-bold tracking-widest uppercase"
                      style={{ color: "var(--mute)" }}
                    >
                      Cartão AXON · NFC
                    </p>
                    <div
                      className="relative aspect-[1.586] w-full rounded-2xl p-4 shadow-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, #08080A 0%, #1a1a1f 50%, #08080A 100%)",
                        border: "1px solid color-mix(in srgb, var(--pulse) 30%, transparent)",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <svg width="24" height="24" viewBox="0 0 100 100">
                          <path
                            d="M50 6 L94 94 L6 94 Z"
                            fill="none"
                            stroke="var(--pulse)"
                            strokeWidth="10"
                          />
                        </svg>
                        <span
                          className="text-[9px] font-bold tracking-wider uppercase"
                          style={{ color: "var(--pulse)" }}
                        >
                          NFC
                        </span>
                      </div>
                      <div className="mt-8">
                        <p
                          className="text-[9px] font-bold tracking-wider uppercase"
                          style={{ color: "var(--mute)" }}
                        >
                          Saldo
                        </p>
                        <p
                          className="font-mono text-lg font-black text-white"
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          R$ 120,00
                        </p>
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <p
                          className="font-mono text-[10px] text-white"
                          style={{ letterSpacing: "0.05em" }}
                        >
                          •••• 4127
                        </p>
                        <p
                          className="text-[8px] font-bold tracking-wider uppercase"
                          style={{ color: "var(--mute)" }}
                        >
                          axon.way
                        </p>
                      </div>
                    </div>
                    <div
                      className="mt-6 flex items-center gap-2 rounded-full px-4 py-2"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--pulse) 12%, transparent)",
                      }}
                    >
                      <Smartphone size={12} style={{ color: "var(--pulse)" }} />
                      <p className="text-[10px] font-bold" style={{ color: "var(--pulse)" }}>
                        Aproxime para validar
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CREW & RANKING */}
        <section className="border-b" style={{ borderColor: "var(--rule)" }}>
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28 md:px-8">
            <div className="grid gap-12 md:grid-cols-2">
              <div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase"
                  style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
                >
                  <Users size={11} />
                  Crew & Ranking
                </span>
                <h2
                  className="mt-4 text-3xl leading-tight font-black tracking-tight sm:text-4xl"
                  style={{ color: "var(--ink)" }}
                >
                  Bora junto.
                  <br />
                  Quem vai com você?
                </h2>
                <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--mute)" }}>
                  Monta sua crew, marca as amigas, mostra @insta. Vota na crew que mais hypou o
                  evento. A do topo entra no banner do próximo.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  { n: "AS DA NOITE", v: 142, m: 8, c: "var(--pulse)" },
                  { n: "ELENCO PRINCIPAL", v: 98, m: 6, c: "var(--info)" },
                  { n: "ESCUDERIA", v: 67, m: 5, c: "#a855f7" },
                ].map((c, i) => (
                  <div
                    key={c.n}
                    className="flex items-center justify-between rounded-2xl border p-4"
                    style={{
                      borderColor: "var(--rule)",
                      backgroundColor: "var(--paper-pure)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black"
                        style={{ backgroundColor: c.c, color: "#000" }}
                      >
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                          {c.n}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--mute)" }}>
                          {c.m} membras · {c.v} votos
                        </p>
                      </div>
                    </div>
                    <Trophy size={16} style={{ color: c.c }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WALLET */}
        <section className="border-b" style={{ borderColor: "var(--rule)" }}>
          <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:py-28 md:px-8">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase"
              style={{ backgroundColor: "var(--info-soft)", color: "var(--info)" }}
            >
              <Wallet size={11} />
              Wallet AXON
            </span>
            <h2
              className="mt-4 text-3xl leading-tight font-black tracking-tight sm:text-4xl"
              style={{ color: "var(--ink)" }}
            >
              Crédito que vira festa.
            </h2>
            <p
              className="mx-auto mt-4 max-w-2xl text-base leading-relaxed"
              style={{ color: "var(--mute)" }}
            >
              Indicou amiga? Caiu crédito. Vendeu ingresso como afiliada? Caiu crédito. Tem saldo no
              cartão? Usa no checkout do próximo.
            </p>
          </div>
        </section>

        {/* CTA final */}
        <section>
          <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-24 md:px-8">
            <h2
              className="text-2xl leading-tight font-black tracking-tight sm:text-3xl"
              style={{ color: "var(--ink)" }}
            >
              Vai. Viva.
            </h2>
            <p className="mt-3 text-sm" style={{ color: "var(--mute)" }}>
              A próxima atualização sai antes do próximo evento. Fica de olho.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/eventos"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
              >
                Ver eventos rolando
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
