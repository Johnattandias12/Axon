import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos e condições de uso da plataforma AXON — marketplace de ingressos. Taxas, regras para compradores e organizadores, meia-entrada e política de reembolso.",
}

const sections = [
  {
    id: "01",
    title: "Das Partes e Aceitação",
    content: (
      <>
        <p>
          Estes Termos regulam a relação entre a <strong className="text-[var(--ink)]">AXON</strong>{" "}
          — plataforma gerida pelo CEO Johnattan Dias (CNPJ em processo de abertura), com sede em
          Natal — RN — e os usuários que acessam{" "}
          <strong className="text-[var(--ink)]">axonia.vercel.app</strong> e domínios associados.
        </p>
        <p>
          Ao criar uma conta, comprar ou publicar um evento, você declara ter lido e aceito
          integralmente estes Termos. A AXON pode alterá-los a qualquer tempo; a continuidade do uso
          após a publicação das alterações implica aceite tácito.
        </p>
      </>
    ),
  },
  {
    id: "02",
    title: "Definições",
    content: (
      <ul>
        <li>
          <strong className="text-[var(--ink)]">Comprador:</strong> pessoa física que adquire
          ingressos pela plataforma.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Organizador:</strong> pessoa física ou jurídica que
          cadastra e gerencia eventos.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Validador:</strong> membro da equipe do Organizador
          autorizado a escanear ingressos.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Ingresso:</strong> documento digital com QR Code
          HMAC único gerado após pagamento confirmado.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Gateway:</strong> Pagar.me (Stone Group) —
          processador financeiro homologado.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Split:</strong> divisão automática do valor pago
          entre AXON e Organizador.
        </li>
      </ul>
    ),
  },
  {
    id: "03",
    title: "Cadastro e Conta",
    content: (
      <ul>
        <li>
          O cadastro exige e-mail válido e aceite expresso destes Termos e da Política de
          Privacidade.
        </li>
        <li>Você é responsável pela veracidade dos dados e pela segurança das suas credenciais.</li>
        <li>
          Menores de 18 anos somente podem utilizar a plataforma com autorização do responsável
          legal.
        </li>
        <li>
          A AXON pode suspender ou encerrar contas que violem estes Termos, sem aviso prévio ou
          indenização.
        </li>
      </ul>
    ),
  },
  {
    id: "04",
    title: "Compra de Ingressos — Regras e Taxas",
    content: (
      <>
        <p>
          A AXON atua como <strong className="text-[var(--ink)]">intermediadora</strong>. A
          responsabilidade pelo evento é exclusivamente do Organizador.
        </p>
        <ul>
          <li>
            <strong className="text-[var(--ink)]">Taxa de serviço AXON:</strong> 9% sobre o valor do
            ingresso, retida automaticamente no split. O valor líquido repassado ao Organizador já é
            deduzido desta taxa.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Taxa de conveniência (Comprador):</strong> R$ 1,00
            fixo por pedido via Pix; adicional percentual no cartão de crédito (5% a 18% conforme
            parcelas), exibido no checkout antes da finalização.
          </li>
          <li>
            Pagamento processado pela Pagar.me em ambiente PCI-DSS certificado. A AXON{" "}
            <strong className="text-[var(--ink)]">não armazena</strong> dados de cartão de crédito.
          </li>
          <li>
            O ingresso é gerado com QR Code HMAC único e assinado imediatamente após confirmação do
            pagamento.
          </li>
          <li>
            É proibida a revenda de ingressos fora da plataforma ou por valor acima do praticado.
            Contas em revenda irregular serão suspensas.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "05",
    title: "Meia-Entrada (Lei 12.933/2013)",
    content: (
      <>
        <p>Ao menos 40% dos ingressos de cada evento devem ser destinados à meia-entrada para:</p>
        <ul>
          <li>Estudantes portadores de CIE válida</li>
          <li>Idosos com 60 anos ou mais (Estatuto do Idoso)</li>
          <li>Pessoas com deficiência e seu acompanhante</li>
          <li>Jovens de 15 a 29 anos em situação de vulnerabilidade (ID Jovem)</li>
        </ul>
        <p>
          O documento comprobatório é obrigatório na entrada. A não-apresentação invalida o ingresso
          de meia-entrada.
        </p>
      </>
    ),
  },
  {
    id: "06",
    title: "Reembolso e Cancelamento",
    content: (
      <ul>
        <li>
          <strong className="text-[var(--ink)]">Direito de arrependimento (CDC, art. 49):</strong>{" "}
          cancelamento em até 7 dias corridos da compra, com reembolso integral, desde que o evento
          não tenha ocorrido e o pedido seja feito com mais de 48h de antecedência.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Cancelamento pelo Organizador:</strong> reembolso
          integral ao Comprador, incluindo taxa de conveniência. Pix: até 3 dias úteis; Cartão: até
          2 faturas.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Adiamento:</strong> ingresso mantém validade para a
          nova data. Se o Comprador não puder comparecer, tem direito ao reembolso integral em até 7
          dias após o anúncio do adiamento.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Não comparecimento:</strong> ausência do Comprador
          não gera direito a reembolso.
        </li>
        <li>
          A taxa de serviço da AXON (9%) não é reembolsável após o prazo legal, exceto em
          cancelamento do evento pelo Organizador.
        </li>
      </ul>
    ),
  },
  {
    id: "07",
    title: "Transferência de Ingresso",
    content: (
      <ul>
        <li>Transferência gratuita via plataforma, disponível até 2 horas antes do evento.</li>
        <li>
          Gera novo QR Code vinculado ao novo titular — o anterior é invalidado imediatamente.
        </li>
        <li>O destinatário deve possuir ou criar conta na AXON.</li>
        <li>Ingressos de meia-entrada exigem verificação do perfil do novo titular.</li>
      </ul>
    ),
  },
  {
    id: "08",
    title: "Para Organizadores",
    content: (
      <ul>
        <li>
          O Organizador é responsável exclusivo pelo conteúdo do evento, cumprimento das condições
          anunciadas, segurança do local e atendimento a todas as legislações aplicáveis (alvarás,
          AVCB, PPCI, etc.).
        </li>
        <li>
          Para receber repasses, o Organizador deve completar o KYC e cadastrar dados bancários de
          titularidade própria.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Prazo de repasse:</strong> via Pix disponível em D+1
          a D+2 após a venda; via cartão em D+17. O Organizador recebe o valor líquido já deduzida a
          comissão da AXON.
        </li>
        <li>
          A AXON pode reter repasses em caso de suspeita de fraude, chargebacks em aberto ou
          investigações em andamento.
        </li>
        <li>
          Eventos que violem leis, promovam discriminação ou incitação ao ódio serão removidos
          imediatamente e o Organizador poderá ser banido permanentemente.
        </li>
      </ul>
    ),
  },
  {
    id: "09",
    title: "Antifraude e Segurança",
    content: (
      <ul>
        <li>QR Code HMAC-SHA256 assinado com chave secreta — impossível de falsificar</li>
        <li>Validação de estoque com lock pessimista no banco de dados</li>
        <li>Rate limiting no checkout (máx. 5 tentativas por IP/minuto)</li>
        <li>Webhook idempotente — evita geração duplicada de ingressos</li>
        <li>Monitoramento de comportamento suspeito e bloqueio automático</li>
        <li>
          Em caso de chargeback indevido, a AXON reserva-se o direito de cobrar o valor contestado e
          suspender a conta do Comprador.
        </li>
      </ul>
    ),
  },
  {
    id: "10",
    title: "Propriedade Intelectual",
    content: (
      <p>
        Todo o conteúdo da plataforma — código, design, marca, logotipo, textos e funcionalidades —
        é propriedade exclusiva da AXON, protegido pelas leis brasileiras (Lei 9.279/1996 e Lei
        9.610/1998). É vedada a cópia, reprodução, engenharia reversa ou uso comercial sem
        autorização prévia e expressa.
      </p>
    ),
  },
  {
    id: "11",
    title: "Limitação de Responsabilidade",
    content: (
      <>
        <p>A AXON não se responsabiliza por:</p>
        <ul>
          <li>Cancelamento, alteração ou não realização do evento pelo Organizador</li>
          <li>Falhas em serviços de terceiros (gateway, provedor de e-mail, CDN)</li>
          <li>Uso indevido das credenciais pelo próprio usuário</li>
          <li>Danos indiretos decorrentes da indisponibilidade temporária da plataforma</li>
        </ul>
        <p>
          Em qualquer caso, a responsabilidade máxima da AXON fica limitada ao valor total pago na
          transação que originou o dano.
        </p>
      </>
    ),
  },
  {
    id: "12",
    title: "Foro e Legislação Aplicável",
    content: (
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da
        Comarca de Natal — RN para dirimir quaisquer litígios, com renúncia expressa a qualquer
        outro foro, por mais privilegiado que seja.
      </p>
    ),
  },
]

export default function TermosPage() {
  return (
    <div style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b px-5 py-16 md:py-24"
        style={{ borderColor: "var(--rule)", backgroundColor: "#08080A" }}
      >
        <div
          className="pointer-events-none absolute top-[-80px] left-[-80px] h-[300px] w-[300px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(200,255,0,0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--pulse)" }}
            />
            <span className="text-[11px] font-semibold tracking-[0.12em] text-white/50 uppercase">
              Documento legal
            </span>
          </div>
          <h1
            className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            Termos de{" "}
            <span style={{ color: "var(--pulse)", textShadow: "0 0 20px rgba(200,255,0,0.3)" }}>
              Uso
            </span>
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
                <h2
                  className="text-lg font-bold tracking-tight"
                  style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
                >
                  {s.title}
                </h2>
              </div>
              <div
                className="space-y-3 pl-8 text-[15px] leading-relaxed [&_li]:flex [&_li]:gap-2 [&_li]:before:shrink-0 [&_li]:before:content-['–'] [&_ul]:list-none [&_ul]:space-y-2 [&_ul]:pl-5"
                style={{ color: "var(--ink-3)" }}
              >
                {s.content}
              </div>
              <div className="border-b pl-8" style={{ borderColor: "var(--rule)" }} />
            </section>
          ))}
        </div>

        {/* Rodapé */}
        <div
          className="mt-12 rounded-2xl border p-6"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
        >
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--mute)" }}>
            Dúvidas sobre estes Termos?{" "}
            <a
              href="mailto:contato@axonia.com.br"
              className="underline underline-offset-2"
              style={{ color: "var(--ink)" }}
            >
              contato@axonia.com.br
            </a>{" "}
            · Você também pode acessar nossa{" "}
            <Link
              href="/privacidade"
              className="underline underline-offset-2"
              style={{ color: "var(--ink)" }}
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
