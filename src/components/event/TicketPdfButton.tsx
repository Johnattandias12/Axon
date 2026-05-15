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

const INK = [10, 10, 11] as const
const PAPER = [250, 250, 247] as const
const PULSE = [200, 255, 0] as const
const MUTE = [107, 107, 112] as const
const RULE = [229, 229, 224] as const

/**
 * Gera PDF dos ingressos no padrão AXON.
 * A4 retrato. Layout centralizado e limpo:
 *   - Top: band ink com wordmark
 *   - Centro: card branco com QR enorme + dados
 *   - Bottom: instruções
 */
export function TicketPdfButton({ eventTitle, eventDate, eventLocation, orderId, tickets }: Props) {
  const [pending, setPending] = useState(false)

  async function generate() {
    setPending(true)
    try {
      const [{ default: jsPDF }, QRCode] = await Promise.all([import("jspdf"), import("qrcode")])
      const doc = new jsPDF({ unit: "mm", format: "a4" })

      const PAGE_W = 210
      const PAGE_H = 297

      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i]
        if (!t) continue
        if (i > 0) doc.addPage()

        // ─── Background paper ──────────────────────────
        doc.setFillColor(...PAPER)
        doc.rect(0, 0, PAGE_W, PAGE_H, "F")

        // ─── Top ink band com logo ─────────────────────
        const BAND_H = 32
        doc.setFillColor(...INK)
        doc.rect(0, 0, PAGE_W, BAND_H, "F")

        // Triângulo AXON (logo) verde
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(0.8)
        const triCx = 22
        const triCy = BAND_H / 2
        doc.triangle(triCx, triCy - 5, triCx + 6, triCy + 4, triCx - 6, triCy + 4, "S")

        // Texto AXON
        doc.setTextColor(...PULSE)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(22)
        doc.text("AXON", 33, triCy + 3)

        // Subtítulo "INGRESSO" à direita
        doc.setTextColor(...PAPER)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text(`INGRESSO ${i + 1} DE ${tickets.length}`, PAGE_W - 15, triCy + 1, {
          align: "right",
        })
        doc.setFontSize(8)
        doc.setTextColor(180, 180, 180)
        doc.text(`#${orderId.slice(0, 8).toUpperCase()}`, PAGE_W - 15, triCy + 7, {
          align: "right",
        })

        // Linha pulse abaixo do header
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(1.2)
        doc.line(0, BAND_H, PAGE_W, BAND_H)

        // ─── Título do evento ──────────────────────────
        const titleY = BAND_H + 22
        doc.setTextColor(...INK)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(24)
        const titleLines = doc.splitTextToSize(eventTitle, 180) as string[]
        titleLines.forEach((line, idx) => {
          doc.text(line, PAGE_W / 2, titleY + idx * 10, { align: "center" })
        })

        const afterTitle = titleY + titleLines.length * 10

        // Data + local centralizados
        doc.setFont("helvetica", "normal")
        doc.setFontSize(11)
        doc.setTextColor(...MUTE)
        doc.text(eventDate, PAGE_W / 2, afterTitle + 4, { align: "center" })
        if (eventLocation) {
          doc.text(eventLocation, PAGE_W / 2, afterTitle + 10, { align: "center" })
        }

        // ─── QR Code central ──────────────────────────
        const qrDataUrl = await QRCode.toDataURL(t.qr_hash, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 600,
          color: { dark: "#0a0a0b", light: "#ffffff" },
        })

        const QR_SIZE = 80
        const qrY = afterTitle + 22
        const qrX = (PAGE_W - QR_SIZE) / 2

        // Moldura pulse atrás do QR
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(0.8)
        doc.setFillColor(...PAPER)
        doc.roundedRect(qrX - 4, qrY - 4, QR_SIZE + 8, QR_SIZE + 8, 3, 3, "FD")

        doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE)

        // Hash pequeno embaixo do QR
        doc.setFontSize(8)
        doc.setTextColor(...MUTE)
        doc.setFont("courier", "normal")
        doc.text(t.qr_hash, PAGE_W / 2, qrY + QR_SIZE + 10, {
          align: "center",
        })

        // ─── Card de dados ────────────────────────────
        const cardY = qrY + QR_SIZE + 22
        const CARD_H = 50
        const CARD_X = 25
        const CARD_W = PAGE_W - 50

        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.3)
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(CARD_X, cardY, CARD_W, CARD_H, 4, 4, "FD")

        // Dois pares de colunas
        const labels = ["SETOR", "LOTE", "TITULAR", "DOCUMENTO"]
        const values = [
          t.type_name,
          t.lot_name + (t.is_half_price ? " · MEIA" : ""),
          t.holder_name,
          t.holder_cpf.length >= 11
            ? `${t.holder_cpf.slice(0, 3)}.***.***-${t.holder_cpf.slice(-2)}`
            : t.holder_cpf,
        ]

        const COL_W = CARD_W / 2
        for (let r = 0; r < 4; r++) {
          const col = r % 2
          const row = Math.floor(r / 2)
          const cx = CARD_X + 8 + col * COL_W
          const cy = cardY + 12 + row * 22

          doc.setFont("helvetica", "bold")
          doc.setFontSize(8)
          doc.setTextColor(...MUTE)
          doc.text(labels[r] ?? "", cx, cy)

          doc.setFont("helvetica", "normal")
          doc.setFontSize(12)
          doc.setTextColor(...INK)
          const v = values[r] ?? ""
          const maxW = COL_W - 12
          const vTrim = doc.splitTextToSize(v, maxW)[0] ?? v
          doc.text(vTrim, cx, cy + 7)
        }

        // ─── Footer ────────────────────────────────────
        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.2)
        // Perfuração tracejada
        for (let x = 10; x < PAGE_W - 10; x += 4) {
          doc.line(x, PAGE_H - 30, x + 2, PAGE_H - 30)
        }

        doc.setTextColor(...MUTE)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.text("Apresente este QR Code na entrada do evento.", PAGE_W / 2, PAGE_H - 22, {
          align: "center",
        })

        doc.setFontSize(8)
        doc.setTextColor(160, 160, 160)
        doc.text("axonia.vercel.app", PAGE_W / 2, PAGE_H - 16, { align: "center" })
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
      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-[0_8px_24px_-8px_rgba(200,255,0,0.4)] disabled:opacity-60"
      style={{
        backgroundColor: "var(--ink)",
        color: "var(--pulse)",
      }}
    >
      {pending ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          Gerando PDF…
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
