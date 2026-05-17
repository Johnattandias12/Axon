import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/PageHeader"

export const metadata: Metadata = {
  title: "Política de Privacidade · AXON",
  description: "Como a AXON trata seus dados pessoais.",
}

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:py-14">
      <PageHeader
        eyebrow="Documento legal"
        title="Política de Privacidade"
        description="Em conformidade com a LGPD (Lei 13.709/2018)"
      />

      <article
        className="prose prose-sm max-w-none space-y-6 text-[15px] leading-relaxed"
        style={{ color: "var(--ink-3)" }}
      >
        <Section title="1. Dados que coletamos">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Cadastro:</strong> nome, email, telefone, CPF (quando aplicável).
            </li>
            <li>
              <strong>Compra:</strong> dados do ingresso, valor, forma de pagamento (sem dados
              completos do cartão — somente token e últimos 4 dígitos).
            </li>
            <li>
              <strong>Uso:</strong> páginas visitadas, dispositivo, IP, cookies essenciais e
              analíticos.
            </li>
          </ul>
        </Section>

        <Section title="2. Como usamos seus dados">
          <ul className="list-disc space-y-2 pl-5">
            <li>Processar compras, emitir ingressos e enviar confirmações.</li>
            <li>Validar entrada no evento (QR Code + checagem de meia-entrada).</li>
            <li>Antifraude e prevenção a uso indevido da plataforma.</li>
            <li>
              Comunicações operacionais (status do pedido, transferência, lembrete de evento).
            </li>
            <li>
              Estatísticas agregadas para o organizador (sem identificar você individualmente).
            </li>
          </ul>
        </Section>

        <Section title="3. Com quem compartilhamos">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Organizador do evento:</strong> nome, CPF e ingresso adquirido, exclusivamente
              para validação na entrada.
            </li>
            <li>
              <strong>Pagar.me:</strong> dados necessários ao processamento do pagamento.
            </li>
            <li>
              <strong>ClearSale:</strong> análise antifraude.
            </li>
            <li>
              <strong>Autoridades:</strong> quando exigido por lei ou ordem judicial.
            </li>
          </ul>
          <p>Não vendemos seus dados. Não compartilhamos para fins publicitários de terceiros.</p>
        </Section>

        <Section title="4. Seus direitos como titular">
          <p>A LGPD garante que você pode:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Confirmar a existência de tratamento.</li>
            <li>Acessar seus dados.</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>
              Solicitar exclusão dos dados (com exceção dos exigidos por lei fiscal/contábil).
            </li>
            <li>Portabilidade.</li>
            <li>Revogar consentimento.</li>
          </ul>
          <p>
            Para exercer qualquer direito, escreva para{" "}
            <a
              href="mailto:privacidade@axon.com.br"
              className="underline underline-offset-2"
              style={{ color: "var(--ink)" }}
            >
              privacidade@axon.com.br
            </a>
            .
          </p>
        </Section>

        <Section title="5. Segurança">
          <ul className="list-disc space-y-2 pl-5">
            <li>Criptografia em trânsito (TLS 1.3) e em repouso.</li>
            <li>Row-level security no banco de dados.</li>
            <li>QR Codes assinados com HMAC-SHA256 — impossível falsificar.</li>
            <li>Logs de acesso a dados sensíveis (CPF) auditáveis.</li>
            <li>Service role nunca exposta no cliente.</li>
          </ul>
        </Section>

        <Section title="6. Retenção">
          <p>
            Mantemos seus dados pelo período necessário ao cumprimento das finalidades, observando
            os prazos legais de retenção fiscal e contábil. Após esse período, os dados são
            anonimizados ou excluídos.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            Usamos cookies essenciais para autenticação e carrinho. Cookies analíticos podem ser
            recusados pelo seu navegador, sem prejuízo das funcionalidades principais.
          </p>
        </Section>

        <Section title="8. Encarregado (DPO)">
          <p>
            Encarregado pelo tratamento de dados:{" "}
            <a
              href="mailto:dpo@axon.com.br"
              className="underline underline-offset-2"
              style={{ color: "var(--ink)" }}
            >
              dpo@axon.com.br
            </a>
            .
          </p>
        </Section>
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
