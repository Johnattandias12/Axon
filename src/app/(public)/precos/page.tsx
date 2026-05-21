import type { Metadata } from "next"
import Link from "next/link"
import { Wallet, Receipt, Sparkles, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Preços e taxas",
  description:
    "Transparência total: taxa de serviço de 8,99% + R$ 1,00 por ingresso emitido. Repasse D+2 via Pix ou D+17 via Cartão. Sem mensalidade, sem surpresa.",
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
            Você cria. A AXON impulsiona
            <span style={{ color: "var(--pulse-deep)" }}>.</span>
          </h1>
          <p
            className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{ color: "var(--mute)" }}
          >
            Taxa transparente, repasse ágil e zero mensalidade. Venda ingressos em minutos com
            dashboard em tempo real e app de portaria incluso.
          </p>
        </header>

        {/* A origem do nome — manifesto AIDA */}
        <section className="mb-16 sm:mb-20">
          <div
            className="relative overflow-hidden rounded-3xl border p-7 sm:p-12"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-pure)",
              backgroundImage:
                "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 7%, var(--paper-pure)) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 animate-pulse rounded-full opacity-25 blur-3xl"
              style={{ backgroundColor: "var(--pulse)" }}
              aria-hidden="true"
            />

            <p
              className="relative inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase"
              style={{ color: "var(--pulse-deep)" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--pulse)" }}
              />
              A origem do nome
            </p>

            <h2
              className="relative mt-5 text-[clamp(36px,8vw,72px)] leading-[0.92] font-black tracking-[-0.045em]"
              style={{ color: "var(--ink)", letterSpacing: "-0.045em" }}
            >
              Axônio.
              <span className="mt-1 block" style={{ color: "var(--pulse-deep)" }}>
                O fio onde o impulso vira ato.
              </span>
            </h2>

            <div className="relative mt-8 grid gap-8 sm:mt-10 sm:grid-cols-5 sm:gap-12">
              <div
                className="space-y-4 text-[15px] leading-[1.75] sm:col-span-3 sm:text-base"
                style={{ color: "var(--ink-4)" }}
              >
                <p>
                  No cérebro humano, o axônio é o filamento que leva a faísca elétrica de um
                  neurônio até o outro. É por ele que a vontade vira gesto, a ideia vira voz, a
                  decisão vira movimento. Sem axônio não tem sinapse, sem sinapse não tem sensação
                  nenhuma.
                </p>
                <p>
                  A AXON é isso em forma de plataforma. Cada ingresso vendido aqui é uma sinapse, o
                  caminho mais curto entre o queria muito ir e o estive lá. A gente é o filamento.
                  Você é o impulso. O show, o jogo, o culto, a despedida, é o que fica de memória.
                </p>
              </div>

              <blockquote
                className="relative border-l-2 pl-5 text-[clamp(18px,2.4vw,24px)] leading-[1.3] font-bold tracking-tight sm:col-span-2 sm:self-center"
                style={{
                  borderColor: "var(--pulse)",
                  color: "var(--ink)",
                  letterSpacing: "-0.02em",
                }}
              >
                Você sente a vontade.
                <span className="block" style={{ color: "var(--pulse-deep)" }}>
                  A AXON entrega o trajeto.
                </span>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Comprador */}
        <section className="mb-16">
          <SectionHeading icon={<Wallet size={14} />} label="Pra quem compra" />
          <div className="grid gap-4 sm:grid-cols-2">
            <PriceCard
              big="8,99%"
              title="Taxa de serviço"
              desc="Calculada sobre o valor do ingresso. Cobre processamento Pix/cartão, antifraude, validação na portaria e suporte 24/7."
              accent
            />
            <PriceCard
              big="+ R$ 1,00"
              title="Por ingresso emitido"
              desc="Taxa fixa por ingresso gerado, referente à emissão e assinatura criptográfica do QR Code de entrada."
              accent
            />
          </div>
          <Example
            label="Conta na ponta do lápis — 1 ingresso de R$ 100"
            rows={[
              { k: "Ingresso (definido pelo organizador)", v: "R$ 100,00" },
              { k: "Taxa de serviço (8,99%)", v: "R$ 8,99" },
              { k: "Taxa de emissão (R$ 1,00 × 1)", v: "R$ 1,00" },
              { k: "Total no Pix", v: "R$ 109,99", strong: true },
            ]}
          />
          <Example
            label="Comprando 3 ingressos de R$ 50 cada"
            rows={[
              { k: "Subtotal (3 × R$ 50)", v: "R$ 150,00" },
              { k: "Taxa de serviço (8,99%)", v: "R$ 13,49" },
              { k: "Taxa de emissão (R$ 1,00 × 3)", v: "R$ 3,00" },
              { k: "Total no Pix", v: "R$ 166,49", strong: true },
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
              desc="Cria conta, evento e lotes sem cartão de crédito, sem fidelidade e sem taxa de adesão."
            />
            <PriceCard
              big="100%"
              title="Seu lucro é 100% seu"
              desc="A taxa de serviço é paga pelo comprador. Você recebe o valor cheio do ingresso. Se ativar afiliados no evento, a comissão sai do repasse."
              accent
            />
            <PriceCard
              big="D+2 / D+17"
              title="Repasse rápido"
              desc="Dinheiro na conta em D+2 via Pix ou em 17 dias corridos para vendas no Cartão."
            />
          </div>
          <Example
            label="Você definiu R$ 100, vendeu 50 ingressos via Pix"
            rows={[
              { k: "Vendido (50 × R$ 100)", v: "R$ 5.000,00" },
              { k: "Taxa de serviço (paga pelos compradores)", v: "+ R$ 449,50" },
              { k: "Taxa de emissão (paga pelos compradores)", v: "+ R$ 50,00" },
              { k: "Repasse pra você", v: "R$ 5.000,00", strong: true },
            ]}
          />

          {/* Saques */}
          <div
            className="mt-8 rounded-2xl border p-6 sm:p-7"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-pure)",
            }}
          >
            <p
              className="text-[10px] font-semibold tracking-[0.14em] uppercase"
              style={{ color: "var(--mute)" }}
            >
              Regras de saque
            </p>
            <p
              className="mt-2 text-xl font-bold tracking-tight"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              Saque simples, sem surpresa.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <InfoBlock
                label="Saque mínimo"
                value="R$ 50,00"
                desc="Valor mínimo disponível para solicitar transferência."
              />
              <InfoBlock
                label="Taxa por saque"
                value="R$ 6,50"
                desc="Taxa fixa cobrada pelo processamento da transferência bancária."
              />
              <InfoBlock
                label="Antecipação de saldo"
                value="Em breve"
                desc="Solicite antecipação do saldo antes do prazo padrão D+2/D+17."
              />
            </div>
          </div>

          {/* VIP e cortesias */}
          <div
            className="mt-4 rounded-2xl border p-6 sm:p-7"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-pure)",
            }}
          >
            <p
              className="text-[10px] font-semibold tracking-[0.14em] uppercase"
              style={{ color: "var(--mute)" }}
            >
              Listas VIP e Cortesias
            </p>
            <p
              className="mt-2 text-xl font-bold tracking-tight"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              R$ 1,00 por ingresso emitido.
            </p>
            <p className="mt-1.5 text-sm" style={{ color: "var(--mute)" }}>
              Listas VIP e cortesias têm custo de R$ 1,00 por ingresso gerado. Não há taxa
              percentual — só a emissão do QR Code de entrada. Lotes pagos por Pix ou Cartão seguem
              a tabela normal acima.
            </p>
          </div>

          {/* Diferenciais */}
          <div
            className="mt-4 rounded-2xl border p-6 sm:p-7"
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
              Coisas que outras plataformas cobram à parte. Aqui já vêm dentro da taxa base.
            </p>
            <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Bullet>Criação de evento em menos de 5 minutos</Bullet>
              <Bullet>Lotes com preços e datas configuráveis</Bullet>
              <Bullet>Meia-entrada automática (Lei 12.933/2013)</Bullet>
              <Bullet>Repasse D+2 (Pix) e D+17 (Cartão)</Bullet>
              <Bullet>App de validação offline para a portaria</Bullet>
              <Bullet>Dashboard em tempo real de vendas</Bullet>
              <Bullet>QR Code assinado criptograficamente</Bullet>
              <Bullet>Suporte via email e WhatsApp</Bullet>
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
              <code>?via=SEUCODIGO</code>. Cada compra fechada pelo link vira crédito na wallet AXON
              do divulgador, liberado pelo time da AXON.
            </p>
            <ul className="mt-5 space-y-2 text-sm" style={{ color: "var(--mute)" }}>
              <Bullet>Comissão configurável por evento (padrão 5% sobre o ingresso)</Bullet>
              <Bullet>Sai do repasse do organizador, que escolhe ativar afiliados no evento</Bullet>
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
              a="Pode. Quem define o preço é você. Se o ingresso custa R$ 100, o comprador pagará R$ 109,99 (R$ 100 + R$ 8,99 de taxa de serviço + R$ 1,00 de emissão). A AXON repassa os R$ 100 integralmente para você."
            />
            <Faq
              q="Quanto tempo leva pra cair o dinheiro?"
              a="O repasse das vendas por Pix é feito em D+2 (2 dias corridos) diretamente na sua conta. Para vendas em Cartão de Crédito, o prazo é de 17 dias corridos."
            />
            <Faq
              q="Qual o valor mínimo para sacar?"
              a="O saque mínimo é de R$ 50,00. Cada saque tem uma taxa fixa de R$ 6,50 para cobrir o custo da transferência bancária. O dinheiro cai na conta em instantes via Pix."
            />
            <Faq
              q="Lista de convidados e cortesias custam?"
              a="Cortesias e listas VIP têm custo de R$ 1,00 por ingresso emitido — apenas a taxa de emissão do QR Code. Não há percentual sobre o valor, já que o ingresso é gratuito para o convidado."
            />
            <Faq
              q="Tem multa pra cancelar evento?"
              a="Não. Você cancela quando quiser e o comprador recebe de volta o valor do ingresso. A taxa de serviço (8,99% + R$ 1,00) fica retida, porque cobre custos operacionais que já aconteceram antes do cancelamento."
            />
            <Faq
              q="Como funciona meia-entrada?"
              a="A AXON aplica automaticamente o limite legal de 40% por evento. Comprador apresenta documento na porta junto com o QR. A taxa de emissão (R$ 1,00) também se aplica à meia."
            />
            <Faq
              q="A AXON cobra pra emitir nota fiscal?"
              a="Não. A nota é emitida pelo organizador. A AXON envia ao comprador um comprovante com os dados da compra."
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

function InfoBlock({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
    >
      <p
        className="text-[10px] font-semibold tracking-wider uppercase"
        style={{ color: "var(--mute)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 font-mono text-xl font-black tabular-nums"
        style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--mute)" }}>
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
                color: r.strong ? "var(--pulse-deep)" : "var(--ink-4)",
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
