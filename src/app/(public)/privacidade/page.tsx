import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a AXON coleta, usa e protege seus dados pessoais, em conformidade com a LGPD (Lei 13.709/2018).",
}

const sections = [
  {
    id: "01",
    title: "Controlador dos Dados",
    content: (
      <>
        <p>
          O controlador dos seus dados pessoais é a{" "}
          <strong className="text-[var(--ink)]">AXON</strong>, operada pelo CEO Johnattan Dias, com
          sede em Natal — RN, Brasil.
        </p>
        <p>
          Encarregado de dados (DPO):{" "}
          <a
            href="mailto:privacidade@axonia.com.br"
            className="underline underline-offset-2"
            style={{ color: "var(--pulse)" }}
          >
            privacidade@axonia.com.br
          </a>
        </p>
      </>
    ),
  },
  {
    id: "02",
    title: "Quais dados coletamos",
    content: (
      <>
        <p className="font-semibold" style={{ color: "var(--ink)" }}>
          Fornecidos por você
        </p>
        <ul>
          <li>Nome completo e CPF (emissão e validação do ingresso)</li>
          <li>E-mail (autenticação e envio do ingresso)</li>
          <li>Telefone (opcional, notificações via WhatsApp)</li>
          <li>Dados bancários do Organizador (armazenados no gateway Pagar.me, não na AXON)</li>
        </ul>
        <p className="mt-4 font-semibold" style={{ color: "var(--ink)" }}>
          Coletados automaticamente
        </p>
        <ul>
          <li>Endereço IP e dados de navegação (segurança e antifraude)</li>
          <li>Logs de acesso e ações na plataforma (auditoria)</li>
          <li>Cookies de sessão (autenticação) e cookies analíticos (com consentimento)</li>
        </ul>
        <p className="mt-4 font-semibold" style={{ color: "var(--ink)" }}>
          O que NÃO coletamos
        </p>
        <ul>
          <li>Números de cartão de crédito (processados diretamente pelo gateway PCI-DSS)</li>
          <li>Senhas em texto puro (armazenadas com hash criptográfico)</li>
          <li>Biometria ou reconhecimento facial</li>
        </ul>
      </>
    ),
  },
  {
    id: "03",
    title: "Bases legais (LGPD, art. 7º)",
    content: (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--rule)" }}>
              <th className="py-2 pr-6 text-left font-semibold" style={{ color: "var(--ink)" }}>
                Finalidade
              </th>
              <th className="py-2 text-left font-semibold" style={{ color: "var(--ink)" }}>
                Base legal
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Autenticação e acesso à conta", "Execução de contrato (art. 7º, V)"],
              ["Emissão e envio do ingresso", "Execução de contrato (art. 7º, V)"],
              ["Processamento do pagamento", "Execução de contrato (art. 7º, V)"],
              ["Obrigação fiscal (NF-e)", "Obrigação legal (art. 7º, II)"],
              ["Prevenção à fraude", "Legítimo interesse (art. 7º, IX)"],
              ["Comunicações de marketing", "Consentimento (art. 7º, I)"],
              ["Analytics e melhoria", "Consentimento (art. 7º, I)"],
              ["Defesa em litígios", "Exercício regular de direitos (art. 7º, VI)"],
            ].map(([fin, base]) => (
              <tr key={fin} style={{ borderBottom: "1px solid var(--rule)" }}>
                <td className="py-2 pr-6" style={{ color: "var(--ink-3)" }}>
                  {fin}
                </td>
                <td className="py-2" style={{ color: "var(--mute)" }}>
                  {base}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "04",
    title: "Compartilhamento de dados",
    content: (
      <>
        <p>
          A AXON <strong className="text-[var(--ink)]">não vende dados pessoais</strong>.
          Compartilhamos apenas com:
        </p>
        <ul>
          <li>
            <strong className="text-[var(--ink)]">Pagar.me (Stone Group):</strong> processamento
            financeiro. Dados mínimos para análise de risco.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Supabase:</strong> banco de dados e autenticação.
            Servidores em São Paulo (AWS sa-east-1). Certificação SOC 2.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Vercel:</strong> hospedagem da aplicação (Edge
            Network global).
          </li>
          <li>
            <strong className="text-[var(--ink)]">Resend:</strong> envio de e-mails transacionais.
            Apenas e-mail e nome do destinatário.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Autoridades públicas:</strong> quando exigido por
            lei ou ordem judicial.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "05",
    title: "Retenção e exclusão",
    content: (
      <ul>
        <li>
          <strong className="text-[var(--ink)]">Dados de conta ativa:</strong> mantidos enquanto a
          conta existir e pelo prazo prescricional (mínimo 5 anos).
        </li>
        <li>
          <strong className="text-[var(--ink)]">Pedidos e ingressos:</strong> 5 anos para fins
          fiscais (Lei 12.546/2011).
        </li>
        <li>
          <strong className="text-[var(--ink)]">Logs de acesso:</strong> 6 meses (Marco Civil da
          Internet, art. 15).
        </li>
        <li>
          <strong className="text-[var(--ink)]">Dados de marketing:</strong> excluídos em até 30
          dias após revogação do consentimento.
        </li>
      </ul>
    ),
  },
  {
    id: "06",
    title: "Seus direitos como titular (LGPD, art. 18)",
    content: (
      <>
        <ul>
          <li>
            <strong className="text-[var(--ink)]">Confirmação</strong> — saber se tratamos seus
            dados
          </li>
          <li>
            <strong className="text-[var(--ink)]">Acesso</strong> — obter cópia dos dados que
            mantemos
          </li>
          <li>
            <strong className="text-[var(--ink)]">Correção</strong> — corrigir dados incorretos ou
            desatualizados
          </li>
          <li>
            <strong className="text-[var(--ink)]">Eliminação</strong> — excluir dados tratados com
            base em consentimento
          </li>
          <li>
            <strong className="text-[var(--ink)]">Portabilidade</strong> — receber seus dados em
            formato estruturado
          </li>
          <li>
            <strong className="text-[var(--ink)]">Revogação do consentimento</strong> — a qualquer
            momento, sem penalidade
          </li>
          <li>
            <strong className="text-[var(--ink)]">Oposição</strong> — ao tratamento baseado em
            legítimo interesse
          </li>
        </ul>
        <p>
          Acesse <strong className="text-[var(--ink)]">Minha Conta → Privacidade</strong> ou envie
          e-mail para{" "}
          <a
            href="mailto:privacidade@axonia.com.br"
            className="underline underline-offset-2"
            style={{ color: "var(--pulse)" }}
          >
            privacidade@axonia.com.br
          </a>
          . Respondemos em até 15 dias úteis.
        </p>
      </>
    ),
  },
  {
    id: "07",
    title: "Cookies",
    content: (
      <ul>
        <li>
          <strong className="text-[var(--ink)]">Cookies essenciais:</strong> sessão de autenticação
          e CSRF. Necessários para o funcionamento — não requerem consentimento.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Cookies analíticos:</strong> coletados apenas com
          consentimento explícito (banner na primeira visita). Revogáveis nas configurações da
          conta.
        </li>
        <li>
          <strong className="text-[var(--ink)]">Cookies de marketing:</strong> não utilizamos
          cookies de rastreamento publicitário de terceiros sem consentimento prévio.
        </li>
      </ul>
    ),
  },
  {
    id: "08",
    title: "Segurança técnica",
    content: (
      <ul>
        <li>Criptografia TLS 1.3 em todas as comunicações</li>
        <li>Senhas armazenadas com bcrypt — nunca em texto puro</li>
        <li>Row Level Security (RLS) no banco — cada usuário acessa apenas seus dados</li>
        <li>Chaves de API gerenciadas via variáveis de ambiente — nunca no código-fonte</li>
        <li>QR Codes assinados com HMAC-SHA256 — impossível falsificar</li>
        <li>Backups automáticos diários com retenção de 30 dias</li>
      </ul>
    ),
  },
  {
    id: "09",
    title: "Incidentes de segurança",
    content: (
      <p>
        Em caso de incidente com risco relevante aos titulares, a AXON notificará a ANPD e os
        titulares afetados em até 72 horas (LGPD, art. 48), informando: natureza dos dados, medidas
        de segurança adotadas e ações de mitigação tomadas.
      </p>
    ),
  },
  {
    id: "10",
    title: "Crianças e adolescentes",
    content: (
      <p>
        A plataforma não é direcionada a menores de 18 anos. Não coletamos intencionalmente dados de
        crianças sem o consentimento dos responsáveis legais. Caso identificada tal coleta indevida,
        os dados serão excluídos imediatamente.
      </p>
    ),
  },
  {
    id: "11",
    title: "Reclamações e ANPD",
    content: (
      <p>
        Se não ficar satisfeito com nossa resposta, você pode contatar a{" "}
        <strong className="text-[var(--ink)]">
          Autoridade Nacional de Proteção de Dados (ANPD)
        </strong>{" "}
        pelo portal{" "}
        <a
          href="https://www.gov.br/anpd"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
          style={{ color: "var(--pulse)" }}
        >
          gov.br/anpd
        </a>
        .
      </p>
    ),
  },
]

export default function PrivacidadePage() {
  return (
    <div style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b px-5 py-16 md:py-24"
        style={{ borderColor: "var(--rule)", backgroundColor: "#08080A" }}
      >
        <div
          className="pointer-events-none absolute top-[-80px] right-[-80px] h-[300px] w-[300px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(200,255,0,0.25) 0%, transparent 70%)",
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
              Documento legal · LGPD
            </span>
          </div>
          <h1
            className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            Política de{" "}
            <span style={{ color: "var(--pulse)", textShadow: "0 0 20px rgba(200,255,0,0.3)" }}>
              Privacidade
            </span>
          </h1>
          <p className="text-[15px] text-white/50">
            Última atualização: 18 de maio de 2026 · Em conformidade com a Lei 13.709/2018
          </p>
        </div>
      </section>

      {/* Aviso LGPD */}
      <div
        className="border-b px-5 py-4"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
      >
        <div className="mx-auto max-w-3xl">
          <p className="text-[13px]" style={{ color: "var(--mute)" }}>
            Seus dados estão protegidos pela{" "}
            <strong style={{ color: "var(--ink)" }}>
              Lei Geral de Proteção de Dados (Lei 13.709/2018)
            </strong>
            . Coletamos apenas o mínimo necessário e nunca vendemos suas informações.
          </p>
        </div>
      </div>

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
                className="space-y-3 pl-8 text-[15px] leading-relaxed [&_li]:flex [&_li]:gap-2 [&_li]:before:shrink-0 [&_li]:before:text-[var(--pulse)] [&_li]:before:content-['–'] [&_ul]:list-none [&_ul]:space-y-2 [&_ul]:pl-5"
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
          <p className="mb-2 text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
            Encarregado de dados (DPO)
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--mute)" }}>
            <a
              href="mailto:privacidade@axonia.com.br"
              className="underline underline-offset-2"
              style={{ color: "var(--pulse)" }}
            >
              privacidade@axonia.com.br
            </a>{" "}
            · AXON — Natal, RN, Brasil · Respondemos em até 15 dias úteis.
          </p>
          <p className="mt-3 text-[13px]" style={{ color: "var(--mute)" }}>
            Veja também:{" "}
            <Link
              href="/termos"
              className="underline underline-offset-2"
              style={{ color: "var(--ink)" }}
            >
              Termos de Uso
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
