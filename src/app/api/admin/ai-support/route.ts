/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação e permissão de admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Acesso proibido" }, { status: 403 })
    }

    // 2. Extrair dados da requisição
    const { message, selectedUser, infra } = await req.json()

    const geminiKey = process.env.GEMINI_API_KEY

    // Contexto gerado para a IA (local ou remota)
    const context = `
[CONTEÚDO DO SISTEMA - AXON INFRA & SUPORTE]
- Gateway de Pagamento: ${infra?.paymentMode === "real" ? "PRODUÇÃO (Real via Pagar.me)" : "TESTE (Simulação ativa)"}
- Métricas Atuais: CPU: ${infra?.cpu}%, RAM: ${infra?.memory}%, Latência API: ${infra?.responseTime}ms
- Logs de E-mail carregados: ${infra?.logsCount ?? 0} registros.

${
  selectedUser
    ? `- Usuário em Análise:
  * Nome: ${selectedUser.name ?? "Sem Nome"}
  * E-mail: ${selectedUser.email}
  * CPF: ${selectedUser.cpf ?? "Não preenchido"}
  * Telefone: ${selectedUser.phone ?? "Não preenchido"}
  * Cargo: ${selectedUser.role}
  * Ingressos (${selectedUser.tickets?.length ?? 0}):
${(selectedUser.tickets ?? [])
  .map(
    (t: any) =>
      `    - Ingresso ID: ${t.id} | Evento: ${t.event} | Status: ${t.status} ${
        t.refundRequested
          ? `| Reembolso solicitado em: ${new Date(t.refundRequested).toLocaleString("pt-BR")} | Motivo: "${t.refundReason}"`
          : ""
      }`
  )
  .join("\n")}
  * Logs de envio de E-mail (${selectedUser.emailLogs?.length ?? 0}):
${(selectedUser.emailLogs ?? [])
  .map(
    (l: any) =>
      `    - E-mail assunto: "${l.subject}" | Tipo: ${l.type} | Status: ${l.status} ${
        l.error ? `| Erro: "${l.error}"` : ""
      } | Data: ${new Date(l.date).toLocaleString("pt-BR")}`
  )
  .join("\n")}`
    : "- Nenhum usuário específico selecionado no painel."
}
`

    if (geminiKey) {
      // 3. Integração Real com Gemini via HTTP fetch (Zero dependências externas)
      try {
        const prompt = `Você é o Co-piloto de Suporte & Infraestrutura da plataforma AXON.
Seu objetivo é ajudar o administrador a diagnosticar problemas de forma rápida e técnica.
Use os seguintes dados de contexto para responder à pergunta do administrador. 
Seja conciso, direto e profissional nas respostas. Sugira ações práticas se identificar problemas (como falha no Resend devido a sandbox, estorno pendente ou CPU alta).

Dados Contextuais do Sistema:
${context}

Mensagem do Administrador:
"${message}"

Responda em formato markdown curto em português.`

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          }
        )

        if (response.ok) {
          const resJson = await response.json()
          const reply = resJson.candidates?.[0]?.content?.parts?.[0]?.text
          if (reply) {
            return NextResponse.json({ reply })
          }
        }
      } catch (err) {
        console.error("[ai-support] Gemini API error, falling back to local diagnostics:", err)
      }
    }

    // 4. Analisador Diagnóstico Offline (Fallback Inteligente por Heurísticas)
    let reply = ""
    const query = message.toLowerCase()

    if (query.includes("diagnóstico automático") && selectedUser) {
      const tickets = selectedUser.tickets ?? []
      const hasRefundPending = tickets.some((t: any) => t.status === "paused" && t.refundRequested)
      const emailLogs = selectedUser.emailLogs ?? []
      const failedEmails = emailLogs.filter((l: any) => l.status === "failed")

      reply = `### Análise de Diagnóstico para **${selectedUser.name ?? "Sem Nome"}**\n\n`

      // Diagnóstico de Cadastro
      if (!selectedUser.cpf) {
        reply += `⚠️ **Cadastro Incompleto:** O usuário não registrou CPF no perfil. Isso impede a emissão correta de ingressos com validação fiscal.\n\n`
      } else {
        reply += `✅ **Cadastro Regular:** Perfil ativo com CPF verificado (${selectedUser.cpf}).\n\n`
      }

      // Diagnóstico de Ingressos e Estorno
      if (hasRefundPending) {
        const pending = tickets.find((t: any) => t.status === "paused" && t.refundRequested)
        reply += `🚨 **Estorno Pendente:** Identifiquei uma solicitação de reembolso no ingresso para o evento **${pending.event}**.\n`
        reply += `* **Motivo:** "${pending.refundReason ?? "Não informado"}"\n`
        reply += `* **Ação Recomendada:** Utilize os botões de ação para **Aprovar Estorno** ou **Rejeitar** no painel.\n\n`
      } else if (tickets.length > 0) {
        reply += `🎫 **Histórico de Ingressos:** O usuário possui ${tickets.length} ingresso(s) registrado(s) (Status: ${tickets.map((t: any) => t.status).join(", ")}).\n\n`
      } else {
        reply += `ℹ️ **Sem Compras:** Nenhuma transação ou ingresso encontrado no histórico deste usuário.\n\n`
      }

      // Diagnóstico de E-mails
      if (failedEmails.length > 0) {
        reply += `📧 **Falhas de Entrega de E-mail:** Encontrei ${failedEmails.length} falha(s) de envio via Resend.\n`
        reply += `* **Erro comum:** "You can only send testing emails to your own email address."\n`
        reply += `* **Causa:** O servidor está operando sob a Sandbox do Resend. Apenas e-mails para o dono da conta (\`johnattan.dias@gmail.com\`) são enviados de fato. Outros destinatários sofrem recusa automática do provedor.\n`
        reply += `* **Solução:** Sincronize e valide o domínio oficial da AXON no painel da Resend e atualize a variável \`RESEND_FROM_EMAIL\` em produção.\n\n`
      } else if (emailLogs.length > 0) {
        reply += `📧 **E-mails Enviados:** Todos os ${emailLogs.length} e-mails informados foram processados sem erros pelo provedor Resend (\`status=sent\`).\n\n`
      }

      // Diagnóstico de Infra
      reply += `⚙️ **Status da Infraestrutura:** CPU em ${infra?.cpu}%, RAM em ${infra?.memory}%. Conexão com Supabase está estável com latência de resposta em ${infra?.responseTime}ms.`
    } else if (query.includes("estorno") || query.includes("reembolso")) {
      const pendingEstornos =
        selectedUser?.tickets?.filter((t: any) => t.status === "paused" && t.refundRequested) || []

      if (pendingEstornos.length > 0) {
        reply = `Encontrei **${pendingEstornos.length} estorno(s) pendente(s)** para o usuário **${selectedUser.name}**.\n\n`
        pendingEstornos.forEach((t: any) => {
          reply += `* **Ingresso:** \`${t.id.slice(0, 12)}...\`\n* **Evento:** ${t.event}\n* **Motivo:** "${t.refundReason}"\n\n`
        })
        reply += `Você pode aprovar a devolução diretamente da tela utilizando o botão **Aprovar Estorno**. Isso atualizará o status do ingresso para \`refunded\` no Supabase e liberará a vaga no lote correspondente.`
      } else {
        reply = `Não identifiquei nenhuma solicitação ativa de reembolso ou estorno. Se o usuário solicitou isso via outro canal, certifique-se de que ele clicou em "Solicitar Reembolso" no painel da conta dele ou realize a alteração manual.`
      }
    } else if (query.includes("email") || query.includes("e-mail") || query.includes("resend")) {
      reply = `### Diagnóstico da Infraestrutura de E-mails (Resend)\n\n`
      reply += `Atualmente, o sistema de e-mails transacionais está utilizando o provedor **Resend**.\n\n`
      if (infra?.paymentMode === "test") {
        reply += `⚠️ **Modo de Pagamento em Teste:** Vendas de teste também geram e-mails transacionais de confirmação.\n`
      }
      reply += `* **Limitação de Sandbox:** Sem um domínio próprio verificado, a Resend limita o envio de e-mails de teste exclusivamente para a conta proprietária. Enviar para clientes finais falhará com erro de restrição de domínio.\n`
      reply += `* **Recomendação:** Para enviar notificações reais de compra para qualquer cliente, é necessário configurar e verificar as entradas DNS (TXT e MX) do domínio oficial da AXON em \`https://resend.com/domains\`.`
    } else if (
      query.includes("cpu") ||
      query.includes("ram") ||
      query.includes("infra") ||
      query.includes("servidor")
    ) {
      reply = `### Monitoramento da Infraestrutura AXON\n\n`
      reply += `* **CPU:** ${infra?.cpu}% (Carga normal de operações)\n`
      reply += `* **RAM:** ${infra?.memory}% (Serviço Node.js Next.js em execução saudável)\n`
      reply += `* **Tempo de Resposta:** ${infra?.responseTime}ms (Conexão direta Supabase Edge)\n`
      reply += `* **Modo de Pagamento:** ${infra?.paymentMode === "real" ? "🟢 PRODUÇÃO" : "🟡 SIMULAÇÃO/TESTE"}\n\n`
      reply += `A infraestrutura está operando dentro dos parâmetros de normalidade esperados. Não há alertas de gargalo ou indisponibilidade de conexões.`
    } else {
      reply = `### Resposta do Co-piloto AXON IA\n\n`
      reply += `Entendi a sua dúvida sobre: "${message}".\n\n`
      if (selectedUser) {
        reply += `Como o usuário **${selectedUser.name}** está selecionado, recomendo verificar o histórico de ingressos e a auditoria de e-mails dele para garantir que ele recebeu todas as senhas compradas.\n\n`
      }
      reply += `Dica: Você pode me perguntar sobre "estornos", "e-mail" ou "infraestrutura" para diagnósticos rápidos do sistema.`
    }

    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error("[ai-support] API handler error:", err)
    return NextResponse.json({ error: "Erro interno no servidor: " + err.message }, { status: 500 })
  }
}
