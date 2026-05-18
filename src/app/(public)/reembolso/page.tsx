import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Reembolso",
  description:
    "Política de reembolsos, cancelamentos e devoluções da AXON. Conheça as regras para direito de arrependimento (CDC), adiamento de eventos e prazos de estorno.",
}

const sections = [
  {
    id: "01",
    title: "Direito de Arrependimento (Art. 49 do CDC)",
    content: (
      <>
        <p>
          O Comprador tem direito ao cancelamento da compra com devolução integral dos valores pagos em até <strong className="text-[var(--ink)]">7 (sete) dias corridos</strong> a contar da data da compra.
        </p>
        <p>
          Para compras realizadas a menos de 7 dias do evento, o cancelamento só poderá ser solicitado até <strong className="text-[var(--ink)]">48 (quarenta e oito) horas antes</strong> do início do evento. Não serão aceitos reembolsos por arrependimento para solicitações feitas após a realização do evento ou em prazo inferior a 48h.
        </p>
      </>
    ),
  },
  {
    id: "02",
    title: "Cancelamento ou Alteração do Evento pelo Organizador",
    content: (
      <>
        <p>
          Em caso de cancelamento definitivo do evento por parte do Organizador, todos os compradores têm direito ao reembolso <strong className="text-[var(--ink)]">integral e automático</strong> do valor pago (incluindo ingresso e taxas de conveniência).
        </p>
        <ul>
          <li><strong className="text-[var(--ink)]">Pix:</strong> O estorno é creditado diretamente na mesma conta bancária utilizada para o pagamento em até 3 (três) dias úteis.</li>
          <li><strong className="text-[var(--ink)]">Cartão de Crédito:</strong> O estorno é enviado à operadora do cartão imediatamente. O crédito na fatura do comprador depende do banco emissor e costuma ocorrer em até 2 (duas) faturas subsequentes.</li>
        </ul>
      </>
    ),
  },
  {
    id: "03",
    title: "Adiamento ou Mudança de Local",
    content: (
      <>
        <p>
          Caso o evento seja adiado ou tenha seu local alterado significativamente (mudança de município ou estado), os ingressos permanecerão válidos para a nova data/local.
        </p>
        <p>
          Os compradores que não puderem comparecer nas novas condições poderão solicitar o reembolso integral em até <strong className="text-[var(--ink)]">7 (sete) dias corridos</strong> contados a partir da data de anúncio oficial do adiamento, diretamente pela plataforma.
        </p>
      </>
    ),
  },
  {
    id: "04",
    title: "Taxas Administrativas e de Serviço",
    content: (
      <>
        <p>
          A taxa de serviço da AXON (9%) e a taxa de conveniência cobrada no checkout cobrem os custos de processamento financeiro do gateway (Pagar.me) e a infraestrutura tecnológica de emissão de ingressos.
        </p>
        <ul>
          <li>Em caso de arrependimento dentro do prazo legal de 7 dias (e 48h antes do evento), o estorno será <strong className="text-[var(--ink)]">integral</strong>.</li>
          <li>Fora do prazo de arrependimento do CDC, ou em caso de não comparecimento (No-Show), as taxas de serviço da plataforma não são passíveis de reembolso, visto que o serviço de emissão e intermediação foi integralmente prestado.</li>
        </ul>
      </>
    ),
  },
  {
    id: "05",
    title: "Como Solicitar o Reembolso",
    content: (
      <>
        <p>
          O processo de solicitação é totalmente automatizado e digital. Você não precisa enviar e-mails ou entrar em filas de suporte:
        </p>
        <ul>
          <li>Acesse sua conta no menu superior clicando em <strong className="text-[var(--ink)]">Minha Conta</strong>.</li>
          <li>Vá até a aba de ingressos na seção correspondente.</li>
          <li>Selecione o ingresso do evento desejado e clique no botão <strong className="text-[var(--ink)]">Solicitar Reembolso</strong>.</li>
          <li>O sistema validará automaticamente os prazos. Sendo aprovado, o estorno será iniciado na hora.</li>
        </ul>
      </>
    ),
  },
  {
    id: "06",
    title: "Casos Excepcionais e Ingressos Usados",
    content: (
      <ul>
        <li>Não é possível solicitar reembolso de ingressos que já foram validados (escaneados) na portaria do evento.</li>
        <li>Ingressos recebidos via transferência gratuita não podem ser cancelados pelo destinatário. Apenas o comprador original da ordem de pagamento pode solicitar o reembolso, caso preencha os requisitos de prazos.</li>
        <li>Contestações de compra indevidas (chargebacks) feitas junto à bandeira do cartão de crédito sem tentativa prévia de resolução amigável violam nossos termos e resultarão na suspensão imediata da conta.</li>
      </ul>
    ),
  },
]

export default function ReembolsoPage() {
  return (
    <div style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b px-5 py-16 md:py-24"
        style={{ borderColor: "var(--rule)", backgroundColor: "#08080A" }}
      >
        <div
          className="pointer-events-none absolute top-[-80px] left-[-80px] h-[300px] w-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(200,255,0,0.3) 0%, transparent 70%)", filter: "blur(60px)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--pulse)" }} />
            <span className="text-[11px] font-semibold tracking-[0.12em] text-white/50 uppercase">Políticas</span>
          </div>
          <h1 className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl" style={{ letterSpacing: "-0.04em" }}>
            Política de{" "}
            <span style={{ color: "var(--pulse)", textShadow: "0 0 20px rgba(200,255,0,0.3)" }}>Reembolso</span>
          </h1>
          <p className="text-[15px] text-white/50">
            Última atualização: 18 de maio de 2026 · Versão 1.0
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.id} className="space-y-4">
              <div className="flex items-start gap-4">
                <span
                  className="mt-0.5 shrink-0 font-mono text-xs font-bold"
                  style={{ color: "var(--pulse)" }}
                >
                  {s.id}
                </span>
                <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                  {s.title}
                </h2>
              </div>
              <div
                className="pl-8 space-y-3 text-[15px] leading-relaxed [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-none [&_li]:flex [&_li]:gap-2 [&_li]:before:content-['–'] [&_li]:before:shrink-0"
                style={{ color: "var(--ink-3)" }}
              >
                {s.content}
              </div>
              <div className="pl-8 border-b" style={{ borderColor: "var(--rule)" }} />
            </section>
          ))}
        </div>

        {/* Rodapé */}
        <div className="mt-12 rounded-2xl border p-6" style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--mute)" }}>
            Precisa de ajuda com um reembolso?{" "}
            <a
              href="https://wa.me/5584981235396?text=Ola!%20Preciso%20de%20ajuda%20com%20um%20reembolso."
              className="underline underline-offset-2 font-semibold"
              style={{ color: "var(--pulse-deep)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Fale Conosco via WhatsApp
            </a>{" "}
            ou acesse os nossos{" "}
            <Link href="/termos" className="underline underline-offset-2" style={{ color: "var(--ink)" }}>
              Termos de Uso
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
