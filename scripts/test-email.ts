import { sendTicketConfirmation } from "../src/lib/email/send"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function testEmail() {
  console.log("Testando envio de email pelo Resend com a nova API Key...")

  // Usando onboarding@resend.dev que requer que o destinatário seja o e-mail dono da conta do Resend.
  // Como eu não sei o email exato do usuário, vou disparar um email para o próprio sender ou um email de teste.
  // Vou usar um email dummy e se o Resend estiver configurado apenas para o onboarding, vai dar erro no destinatário,
  // mas mostrará se a API KEY é válida.

  // Vamos disparar para contato@axon.app (poderá falhar se o resend estiver em teste, mas validará a chave)
  const res = await sendTicketConfirmation({
    to: "francisco.johnattan.103@ufrn.edu.br",
    buyerName: "Francisco Johnattan",
    eventTitle: "AXON Arena Experience 2026",
    eventDate: "Sábado, 30 de Maio de 2026 às 21:00",
    eventLocation: "Arena AXON, Natal - RN",
    ticketCount: 2,
    totalCents: 15000,
    orderUrl: "https://axonia.vercel.app/minha-conta/ingressos",
    qrPayloads: ["axon-ticket-verified-001", "axon-ticket-verified-002"],
  })

  if (res.sent) {
    console.log(
      "✅ Sucesso! O Resend aceitou a requisição e a API Key está funcionando perfeitamente."
    )
  } else {
    console.error("❌ Erro no envio:", res.error)
    console.log(
      "Nota: Se o erro for sobre e-mail de destinatário não verificado, significa que a chave funcionou, mas como o domínio não está verificado, o Resend só permite enviar e-mails para o seu próprio e-mail pessoal cadastrado na plataforma deles."
    )
  }
}

testEmail()
