"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"

interface TicketForPdf {
  id: string
  qr_hash: string
  holder_name: string
  holder_cpf: string
  type_name: string
  lot_name: string
  is_half_price: boolean
}

interface Props {
  eventTitle: string
  eventDate: string
  eventLocation: string
  orderId: string
  tickets: TicketForPdf[]
}

/**
 * Gera e baixa PDF dos ingressos client-side com jsPDF + qrcode.
 * Mantém identidade AXON (preto, lime, sans-serif bold).
 */
export function TicketPdfButton({
  eventTitle,
  eventDate,
  eventLocation,
  orderId,
  tickets,
}: Props) {
  const [pending, setPending] = useState(false)

  async function generate() {
    setPending(true)
    try {
      const [{ default: jsPDF }, QRCode] = await Promise.all([
        import("jspdf"),
        import("qrcode"),
      ])
      const doc = new jsPDF({ unit: "mm", format: "a4" })

      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i]
        if (!t) continue
        if (i > 0) doc.addPage()

        // Header preto com AXON e PULSE
        doc.setFillColor(10, 10, 11)
        doc.rect(0, 0, 210, 28, "F")

        // "AXON"
        doc.setTextColor(200, 255, 0)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(22)
        doc.text("AXON", 15, 17)

        // Triângulo da logo
        doc.setDrawColor(200, 255, 0)
        doc.setLineWidth(0.6)
        doc.triangle(40, 10, 47, 22, 33, 22)

        // "INGRESSO"
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text(`INGRESSO ${i + 1}/${tickets.length}`, 195, 17, { align: "right" })

        // Linha pulse abaixo do header
        doc.setDrawColor(200, 255, 0)
        doc.setLineWidth(0.8)
        doc.line(0, 30, 210, 30)

        // Título do evento
        doc.setTextColor(10, 10, 11)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        const titleLines = doc.splitTextToSize(eventTitle, 130)
        doc.text(titleLines, 15, 45)

        // Data e local
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 90)
        doc.text(eventDate, 15, 58 + (titleLines.length - 1) * 6)
        doc.text(eventLocation, 15, 64 + (titleLines.length - 1) * 6)

        // QR Code
        const qrDataUrl = await QRCode.toDataURL(t.qr_hash, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 400,
        })
        doc.addImage(qrDataUrl, "PNG", 145, 40, 50, 50)

        // Box dos dados
        doc.setDrawColor(229, 229, 224)
        doc.setLineWidth(0.3)
        doc.roundedRect(15, 90, 180, 50, 3, 3, "S")

        const dataY = 100
        doc.setFont("helvetica", "bold")
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 125)
        doc.text("SETOR", 22, dataY)
        doc.text("LOTE", 22, dataY + 12)
        doc.text("TITULAR", 22, dataY + 24)
        doc.text("DOCUMENTO", 22, dataY + 36)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(11)
        doc.setTextColor(10, 10, 11)
        doc.text(t.type_name, 60, dataY)
        doc.text(t.lot_name + (t.is_half_price ? "  · MEIA" : ""), 60, dataY + 12)
        doc.text(t.holder_name, 60, dataY + 24)
        const cpf =
          t.holder_cpf.length >= 11
            ? `${t.holder_cpf.slice(0, 3)}.***.***-${t.holder_cpf.slice(-2)}`
            : t.holder_cpf
        doc.text(cpf, 60, dataY + 36)

        // Hash sob o QR
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 155)
        doc.setFont("courier", "normal")
        doc.text(t.qr_hash, 170, 94, { align: "center", maxWidth: 60 })

        // Faixa inferior
        doc.setFillColor(244, 244, 238)
        doc.rect(0, 150, 210, 10, "F")
        doc.setTextColor(120, 120, 125)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.text("Apresente este QR Code na entrada · axonia.vercel.app", 15, 156)
        doc.text(`Pedido #${orderId.slice(0, 8)}`, 195, 156, { align: "right" })

        // Linha tracejada decorativa (perfuração)
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.1)
        for (let x = 0; x < 210; x += 4) {
          doc.line(x, 145, x + 2, 145)
        }
      }

      doc.save(`ingresso-axon-${orderId.slice(0, 8)}.pdf`)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-transform hover:scale-[1.02] disabled:opacity-60"
      style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
    >
      {pending ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          Gerando…
        </>
      ) : (
        <>
          <Download size={12} />
          Baixar PDF
        </>
      )}
    </button>
  )
}
