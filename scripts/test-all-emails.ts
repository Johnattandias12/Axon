import {
  sendTicketConfirmation,
  sendTicketTransferred,
  sendRefundProcessed,
  sendLoginNotification,
  sendPasswordReset,
  sendMagicLink,
  sendScannerInvite,
  sendCrewInvite,
  sendAffiliateCommission,
  sendEventCreated,
  sendAbandonedCart,
  sendEventReminder,
  sendEventFeedback,
} from "../src/lib/email/send"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const targetEmail = "francisco.johnattan.103@ufrn.edu.br"

async function main() {
  console.log("=== ENVIANDO TODOS OS TEMPLATES DE TESTE ===")

  // 1. Confirmação de Ingresso
  console.log("Enviando Ticket Confirmation...")
  await sendTicketConfirmation({
    to: targetEmail,
    buyerName: "Francisco Johnattan",
    eventTitle: "AXON Summit 2026",
    eventDate: "Terça-feira, 15 de Outubro de 2026 às 14:00",
    eventLocation: "Teatro Riachuelo, Natal - RN",
    ticketCount: 1,
    totalCents: 9900,
    orderUrl: "https://axonia.vercel.app/minha-conta/ingressos",
    qrPayloads: ["axon-summit-qr-ticket-1"],
  })

  // 2. Transferência de Ingresso
  console.log("Enviando Ticket Transferred...")
  await sendTicketTransferred({
    to: targetEmail,
    fromName: "Johnattan Dias",
    eventTitle: "AXON Summit 2026",
    eventDate: "15/10/2026",
    eventLocation: "Teatro Riachuelo, Natal - RN",
    acceptUrl: "https://axonia.vercel.app/aceitar-transferencia/token-xyz",
  })

  // 3. Reembolso Aprovado
  console.log("Enviando Refund Approved...")
  await sendRefundProcessed({
    to: targetEmail,
    buyerName: "Francisco Johnattan",
    eventTitle: "AXON Summit 2026",
    decision: "approved",
    amountCents: 9900,
    reason: "Desistência solicitada pelo cliente",
  })

  // 4. Notificação de Login
  console.log("Enviando Login Notification...")
  await sendLoginNotification({
    to: targetEmail,
    userName: "Francisco Johnattan",
    ip: "186.223.45.12",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    location: "Natal, RN - Brasil",
  })

  // 5. Redefinição de Senha
  console.log("Enviando Password Reset...")
  await sendPasswordReset({
    to: targetEmail,
    userName: "Francisco Johnattan",
    resetUrl: "https://axonia.vercel.app/redefinir-senha?token=abc-123",
  })

  // 6. Link Mágico
  console.log("Enviando Magic Link...")
  await sendMagicLink({
    to: targetEmail,
    userName: "Francisco Johnattan",
    magicUrl: "https://axonia.vercel.app/api/auth/callback?token=magic-456",
  })

  // 7. Convite de Scanner
  console.log("Enviando Scanner Invite...")
  await sendScannerInvite({
    to: targetEmail,
    scannerName: "Validador João",
    eventTitle: "AXON Summit 2026",
    eventDate: "15/10/2026",
    scanUrl: "https://axonia.vercel.app/scanner/entrar?invite=scanner-token",
  })

  // 8. Convite de Equipe (Crew Invite)
  console.log("Enviando Crew Invite...")
  await sendCrewInvite({
    to: targetEmail,
    inviterName: "Johnattan Dias",
    crewName: "Coordenação de Acesso",
    eventTitle: "AXON Summit 2026",
    eventDate: "15/10/2026",
    joinUrl: "https://axonia.vercel.app/equipe/aceitar?token=crew-token",
  })

  // 9. Comissão de Afiliado
  console.log("Enviando Affiliate Commission...")
  await sendAffiliateCommission({
    to: targetEmail,
    affiliateName: "Francisco Johnattan",
    eventTitle: "AXON Summit 2026",
    amountCents: 1500,
    commissionRatePct: 15,
    balanceCents: 4500,
  })

  // 10. Evento Criado
  console.log("Enviando Event Created...")
  await sendEventCreated({
    to: targetEmail,
    organizerName: "Produtora Axon",
    eventTitle: "AXON Summit 2026",
    eventDate: "15/10/2026 às 14:00",
    eventLocation: "Teatro Riachuelo",
    eventUrl: "https://axonia.vercel.app/eventos/axon-summit-2026",
  })

  // 11. Carrinho Abandonado
  console.log("Enviando Abandoned Cart...")
  await sendAbandonedCart({
    to: targetEmail,
    buyerName: "Francisco Johnattan",
    eventTitle: "AXON Summit 2026",
    eventDate: "15/10/2026",
    checkoutUrl: "https://axonia.vercel.app/carrinho?abandoned=true",
  })

  // 12. Lembrete de Evento
  console.log("Enviando Event Reminder...")
  await sendEventReminder({
    to: targetEmail,
    buyerName: "Francisco Johnattan",
    eventTitle: "AXON Summit 2026",
    eventDate: "Amanhã, 15 de Outubro de 2026 às 14:00",
    eventLocation: "Teatro Riachuelo, Natal - RN",
    ticketsUrl: "https://axonia.vercel.app/minha-conta/ingressos",
  })

  // 13. Feedback Pós-Evento
  console.log("Enviando Event Feedback...")
  await sendEventFeedback({
    to: targetEmail,
    buyerName: "Francisco Johnattan",
    eventTitle: "AXON Summit 2026",
    feedbackUrl: "https://axonia.vercel.app/eventos/axon-summit-2026/feedback",
  })

  console.log("✅ Todos os e-mails de teste foram disparados!")
}

main().catch(console.error)
