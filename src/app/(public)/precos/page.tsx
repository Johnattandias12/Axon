import type { Metadata } from "next"
import Link from "next/link"
import { Wallet, Receipt, Sparkles, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Preços e taxas",
  description:
    "Como a AXON cobra: 10% pago pelo comprador, organizar é grátis, afiliado ganha por venda.",
}

export default function PrecosPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}
    >
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        {/* Hero */}
        <header className="mb-16 sm:mb-20">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--pulse)" }}
            />
            Preços
          </span>
          <h1
            className="mt-5 text-[clamp(36px,6vw,68px)] leading-[0.95] font-black tracking-[-0.04em]"
            style={{ color: "var(--ink)" }}
          >
            Transparência desde o primeiro clique
            <span style={{ color: "var(--pulse-deep)" }}>.</span>
          </h1>
          <p
            className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{ color: "var(--mute)" }}
          >
            Nada de letra miúda. Aqui você sabe exatamente quanto paga, quanto recebe, e por quê.
          </p>
        </header>

        {/* Comprador */}
        <section className="mb-16">
          <SectionHeading icon={<Wallet size={14} />} label="Pra quem compra" />
          <div className="grid gap-4 sm:grid-cols-2">
            <PriceCard
              big="10%"
              title="Taxa de serviço AXON"
              desc="Cobrada do comprador, calculada sobre o valor do ingresso. Cobre processamento Pix/cartão, antifraude, validação na porta e suporte."
              accent
            />
            <PriceCard
              big="0%"
              title="Taxa surpresa no checkout"
              desc="Sem boleto escondido. Sem mensalidade. Sem juros embutidos pra parcelar no Pix. O que você vê no carrinho é o que paga."
            />
          </div>
          <Example
            label="Conta na ponta do lápis"
            rows={[
              { k: "Ingresso (definido pelo organizador)", v: "R$ 100,00" },
              { k: "Taxa AXON (10%)", v: "R$ 10,00" },
              { k: "Total no Pix", v: "R$ 110,00", strong: true },
            ]}
          />
        </section>

        {/* Organizador */}
        <section className="mb-16">
          <SectionHeading icon={<Receipt size={14} />} label="Pra quem organiza" />
          <div className="grid gap-4 sm:grid-cols-3">
            <PriceCard
              big="R$ 0"
              title="Cadastro e mensalidade"
              desc="Cria conta, evento, lotes. Sem cartão, sem fidelidade, sem taxa de adesão."
            />
            <PriceCard
              big="100%"
              title="Do ingresso é teu"
              desc="A taxa de 10% é paga pelo comprador. Nada sai do teu repasse."
              accent
            />
            <PriceCard
              big="70%"
              title="Antecipado antes do evento"
              desc="Solicita até 70% das vendas confirmadas antes da data. O resto cai em até 3 dias úteis pós-evento."
            />
          </div>
          <Example
            label="Você definiu R$ 100, vendeu 50 ingressos"
            rows={[
              { k: "Vendido (50 × R$ 100)", v: "R$ 5.000,00" },
              { k: "Taxa AXON (paga pelos compradores)", v: "+ R$ 500,00" },
              { k: "Repasse pra você", v: "R$ 5.000,00", strong: true },
            ]}
          />

          {/* Diferenciais — tudo incluso */}
          <div
            className="mt-8 rounded-2xl border p-6 sm:p-7"
            style={{
              borderColor: "var(--pulse)",
              backgroundColor: "var(--paper-pure)",
              backgroundImage:
                "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 8%, var(--paper-pure)) 100%)",
            }}
          >
            <p
              className="text-[10px] font-semibold tracking-[0.14em] uppercase"
              style={{ color: "var(--pulse-deep)" }}
            >
              Tudo incluso · sem custo extra
            </p>
            <p
              className="mt-2 text-xl font-bold tracking-tight"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              Cobra menos. Entrega mais.
            </p>
            <p className="mt-1.5 text-sm" style={{ color: "var(--mute)" }}>
              Coisas que outras plataformas cobram à parte. Aqui já vêm dentro dos 10%.
            </p>
            <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Bullet>Saques ilimitados, todos gratuitos</Bullet>
              <Bullet>Cortesias e listas de convidados ilimitadas</Bullet>
              <Bullet>Ingressos manuais por email sem cobrança extra</Bullet>
              <Bullet>Antifraude e validação na porta inclusas</Bullet>
              <Bullet>Equipe de validadores sem custo por pessoa</Bullet>
              <Bullet>Suporte humano até a hora do evento</Bullet>
            </ul>
          </div>
        </section>

        {/* Afiliado */}
        <section className="mb-16">
          <SectionHeading icon={<Sparkles size={14} />} label="Pra quem divulga (afiliado)" />
          <div
            className="rounded-2xl border p-6 sm:p-8"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-pure)",
              backgroundImage:
                "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 5%, var(--paper-pure)) 100%)",
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-4)" }}>
              Programa por convite. Influencers, casas e parceiros recebem um link único{" "}
              <code>?via=SEUCODIGO</code>. Cada compra fechada pelo seu link vira crédito na tua
              wallet AXON, liberado pelo time da AXON.
            </p>
            <ul className="mt-5 space-y-2 text-sm" style={{ color: "var(--mute)" }}>
              <Bullet>Comissão padrão: 5% sobre o ingresso (negociável por parceiro)</Bullet>
              <Bullet>Sai do bolso da AXON, não do organizador</Bullet>
              <Bullet>Saldo vira crédito pra comprar ingresso na plataforma</Bullet>
              <Bullet>Quer entrar? Manda email pra contato@axon.app</Bullet>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <SectionHeading icon={<ShieldCheck size={14} />} label="Dúvidas comuns" />
          <div className="space-y-4">
            <Faq
              q="Posso embutir a taxa no preço do ingresso?"
              a="Pode. Quem define o preço é você. Cobre R$ 110 e o comprador paga R$ 121 (R$ 110 + R$ 11 de taxa). A AXON repassa R$ 110."
            />
            <Faq
              q="Quanto tempo leva pra cair o dinheiro?"
              a="Você pode solicitar até 70% das vendas confirmadas antes do evento, sem limite de solicitações por semana e sem taxa de saque. O saldo restante cai em até 3 dias úteis pós-evento. Cartão segue o prazo do gateway (em torno de D+30 sem antecipação)."
            />
            <Faq
              q="Lista de convidados e cortesias custam?"
              a="Não. Você gera cortesia ilimitada, manda email manual pra convidados, e usa o app de validação na porta sem nenhum custo adicional. Tudo já está dentro dos 10%."
            />
            <Faq
              q="Tem multa pra cancelar evento?"
              a="Não. Você cancela quando quiser. Compradores recebem reembolso automático do que pagaram (incluindo a taxa AXON)."
            />
            <Faq
              q="Como funciona meia-entrada?"
              a="A AXON aplica automaticamente o limite legal de 40% por evento. Comprador apresenta documento na porta junto com o QR."
            />
            <Faq
              q="A AXON cobra pra emitir nota fiscal?"
              a="Não. A nota é emitida pelo organizador. A AXON envia a parte que cabe ao comprador como comprovante."
            />
          </div>
        </section>

        {/* CTA */}
        <div
          className="rounded-3xl border p-8 text-center sm:p-12"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--ink)",
            color: "var(--pulse)",
          }}
        >
          <p
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "var(--pulse)", letterSpacing: "-0.02em" }}
          >
            Pronto pra vender?
          </p>
          <p
            className="mx-auto mt-2 max-w-md text-sm"
            style={{ color: "color-mix(in srgb, var(--pulse) 70%, transparent)" }}
          >
            Cria teu evento em 5 minutos. Sem cartão, sem fidelidade.
          </p>
          <Link
            href="/organizador/comecar"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            Criar meu primeiro evento
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    </div>
  )
}

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <span style={{ color: "var(--pulse-deep)" }}>{icon}</span>
      <h2
        className="text-[11px] font-semibold tracking-[0.14em] uppercase"
        style={{ color: "var(--mute)" }}
      >
        {label}
      </h2>
    </div>
  )
}

function PriceCard({
  big,
  title,
  desc,
  accent = false,
}: {
  big: string
  title: string
  desc: string
  accent?: boolean
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: accent ? "var(--pulse)" : "var(--rule)",
        backgroundColor: "var(--paper-pure)",
      }}
    >
      <p
        className="font-mono text-3xl font-black tracking-tight tabular-nums sm:text-4xl"
        style={{ color: accent ? "var(--pulse-deep)" : "var(--ink)", letterSpacing: "-0.04em" }}
      >
        {big}
      </p>
      <p className="mt-2 text-sm font-bold" style={{ color: "var(--ink)" }}>
        {title}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--mute)" }}>
        {desc}
      </p>
    </div>
  )
}

function Example({
  label,
  rows,
}: {
  label: string
  rows: Array<{ k: string; v: string; strong?: boolean }>
}) {
  return (
    <div
      className="mt-5 overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
    >
      <div className="border-b px-5 py-3" style={{ borderColor: "var(--rule)" }}>
        <p
          className="text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--mute)" }}
        >
          {label}
        </p>
      </div>
      <div className="space-y-2 px-5 py-4 text-sm">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline justify-between gap-3">
            <span style={{ color: r.strong ? "var(--ink)" : "var(--mute)" }}>{r.k}</span>
            <span
              className="font-mono tabular-nums"
              style={{
                color: r.strong ? "var(--ink)" : "var(--ink-4)",
                fontWeight: r.strong ? 700 : 500,
              }}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details
      className="group rounded-2xl border p-4 transition-colors hover:bg-black/[0.02] sm:p-5"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <summary
        className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold"
        style={{ color: "var(--ink)" }}
      >
        {q}
        <span
          className="shrink-0 font-mono text-base transition-transform group-open:rotate-45"
          style={{ color: "var(--pulse-deep)" }}
        >
          +
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--mute)" }}>
        {a}
      </p>
    </details>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: "var(--success)" }} />
      <span>{children}</span>
    </li>
  )
}
