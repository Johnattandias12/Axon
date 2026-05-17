import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/PageHeader"

export const metadata: Metadata = {
  title: "Termos de Uso · AXON",
  description: "Termos de uso da plataforma AXON.",
}

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:py-14">
      <PageHeader
        eyebrow="Documento legal"
        title="Termos de Uso"
        description="Atualizado em maio de 2026"
      />

      <article
        className="prose prose-sm max-w-none space-y-6 text-[15px] leading-relaxed"
        style={{ color: "var(--ink-3)" }}
      >
        <Section title="1. Sobre a AXON">
          <p>
            A AXON é um marketplace brasileiro de venda de ingressos online para shows, esportes,
            eventos religiosos e atividades culturais. Ao usar a plataforma, você concorda com estes
            termos. Se não concordar, não utilize o serviço.
          </p>
        </Section>

        <Section title="2. Cadastro e conta">
          <p>
            Para comprar ou vender, é necessário criar uma conta com email válido. Você é
            responsável por manter suas credenciais em sigilo e por toda atividade na sua conta.
            Menores de 18 anos precisam de autorização do responsável legal.
          </p>
        </Section>

        <Section title="3. Compra de ingressos">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Os ingressos são vendidos pelo organizador do evento, com a AXON atuando como
              intermediadora.
            </li>
            <li>
              Após confirmação do pagamento, o ingresso é gerado com QR Code único e enviado para
              sua área.
            </li>
            <li>O pagamento é processado por gateway homologado (Pagar.me), com Pix e cartão.</li>
            <li>
              Cobrança de taxa de serviço de 10% sobre o subtotal, exibida antes da finalização.
            </li>
          </ul>
        </Section>

        <Section title="4. Meia-entrada">
          <p>
            Em conformidade com a Lei 12.933/2013, 40% dos ingressos de cada evento são reservados a
            estudantes, idosos, pessoas com deficiência, jovens de baixa renda e demais
            beneficiários previstos em lei. O documento de comprovação é exigido na entrada do
            evento.
          </p>
        </Section>

        <Section title="5. Reembolso e cancelamento">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Cancelamento em até 7 dias após a compra é integralmente reembolsado, conforme CDC,
              desde que solicitado com mais de 7 dias da realização do evento.
            </li>
            <li>
              Cancelamento do evento por parte do organizador gera reembolso total ao comprador.
            </li>
            <li>Adiamento de evento mantém a validade do ingresso para a nova data.</li>
          </ul>
        </Section>

        <Section title="6. Transferência de ingresso">
          <p>
            Você pode transferir um ingresso pago para outra pessoa pela plataforma. O novo titular
            recebe um link nominal, e os dados do antigo titular são substituídos. Não é permitida a
            revenda fora da plataforma.
          </p>
        </Section>

        <Section title="7. Antifraude">
          <p>
            Adotamos cinco camadas de antifraude: validação de identidade, regras transacionais,
            análise comportamental, integração ClearSale e revisão manual em casos de risco. Pedidos
            considerados suspeitos podem ser cancelados sem aviso prévio.
          </p>
        </Section>

        <Section title="8. Responsabilidade do organizador">
          <p>
            O conteúdo do evento (descrição, local, horário, condições) é de responsabilidade
            exclusiva do organizador. A AXON não responde por cancelamentos, alterações ou
            descumprimento das condições anunciadas, exceto na intermediação do reembolso quando
            aplicável.
          </p>
        </Section>

        <Section title="9. Foro">
          <p>
            Fica eleito o foro da Comarca de Natal/RN para dirimir quaisquer questões oriundas
            destes termos.
          </p>
        </Section>

        <p className="pt-4 text-sm" style={{ color: "var(--mute)" }}>
          Dúvidas? Escreva para{" "}
          <a
            href="mailto:contato@axon.com.br"
            className="underline underline-offset-2"
            style={{ color: "var(--ink)" }}
          >
            contato@axon.com.br
          </a>
          .
        </p>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2
        className="text-lg font-semibold tracking-tight"
        style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
