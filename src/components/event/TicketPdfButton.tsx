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
const INK_SOFT = [40, 40, 42] as const
const PAPER = [250, 250, 247] as const
const PAPER_PURE = [255, 255, 255] as const
const PULSE = [200, 255, 0] as const
const MUTE = [107, 107, 112] as const
const MUTE_SOFT = [180, 180, 185] as const
const RULE = [229, 229, 224] as const
const WATERMARK = [245, 245, 240] as const

/**
 * Gera PDF premium dos ingressos no padrão AXON.
 * Layout A4 retrato com:
 *  - Side strip ink vertical (stub de ingresso)
 *  - Watermark AXON repetido em diagonal
 *  - QR grande com moldura pulse
 *  - Selo anti-fraude HMAC-SHA256
 *  - Perfuração tracejada
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
      const STUB_W = 18

      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i]
        if (!t) continue
        if (i > 0) doc.addPage()

        const contentX = STUB_W
        const contentW = PAGE_W - STUB_W

        // ─── Background paper ──────────────────────────
        doc.setFillColor(...PAPER)
        doc.rect(0, 0, PAGE_W, PAGE_H, "F")

        // ─── Watermark AXON repetido em diagonal ───────
        doc.setTextColor(...WATERMARK)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(46)
        for (let row = -1; row < 8; row++) {
          for (let col = -1; col < 4; col++) {
            const wx = col * 90 + (row % 2 === 0 ? 0 : 45)
            const wy = row * 45 + 30
            // jsPDF "angle" parameter
            doc.text("AXON", wx, wy, { angle: -28 })
          }
        }

        // ─── Side strip (ink) vertical à esquerda ──────
        doc.setFillColor(...INK)
        doc.rect(0, 0, STUB_W, PAGE_H, "F")
        // Borda pulse no encontro
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(0.4)
        doc.line(STUB_W, 0, STUB_W, PAGE_H)

        // Texto vertical "TICKET · INGRESSO" no stub
        doc.setTextColor(...PULSE)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.text(`TICKET · INGRESSO ${i + 1} DE ${tickets.length}`, STUB_W / 2 + 2, PAGE_H - 18, {
          angle: 90,
        })

        // Mini-logo triangular no topo do stub
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(0.6)
        const triCx = STUB_W / 2
        const triCy = 14
        doc.triangle(triCx, triCy - 4, triCx + 4.5, triCy + 3, triCx - 4.5, triCy + 3, "S")

        // ─── Top band com logo + título ────────────────
        const BAND_H = 28
        doc.setFillColor(...INK)
        doc.rect(contentX, 0, contentW, BAND_H, "F")

        // Logo + wordmark AXON
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(0.7)
        const wmCy = BAND_H / 2
        doc.triangle(contentX + 12, wmCy - 5, contentX + 18, wmCy + 4, contentX + 6, wmCy + 4, "S")

        doc.setTextColor(...PULSE)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(20)
        doc.text("AXON", contentX + 24, wmCy + 3)

        // Tag à direita
        doc.setTextColor(...PAPER)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`INGRESSO ${i + 1} / ${tickets.length}`, PAGE_W - 12, wmCy - 1, { align: "right" })
        doc.setFontSize(7)
        doc.setTextColor(...MUTE_SOFT)
        doc.text(`#${orderId.slice(0, 12).toUpperCase()}`, PAGE_W - 12, wmCy + 5, {
          align: "right",
        })

        // Linha pulse abaixo do header
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(1)
        doc.line(contentX, BAND_H, PAGE_W, BAND_H)

        // ─── Título do evento ──────────────────────────
        const titleY = BAND_H + 20
        doc.setTextColor(...INK)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(26)
        const titleLines = doc.splitTextToSize(eventTitle, contentW - 30) as string[]
        titleLines.slice(0, 3).forEach((line, idx) => {
          doc.text(line, contentX + contentW / 2, titleY + idx * 10, { align: "center" })
        })

        const afterTitle = titleY + Math.min(titleLines.length, 3) * 10

        // Data + local centralizados
        doc.setFont("helvetica", "normal")
        doc.setFontSize(11)
        doc.setTextColor(...INK_SOFT)
        doc.text(eventDate, contentX + contentW / 2, afterTitle + 4, { align: "center" })
        if (eventLocation) {
          doc.setTextColor(...MUTE)
          doc.setFontSize(10)
          doc.text(eventLocation, contentX + contentW / 2, afterTitle + 10, { align: "center" })
        }

        // ─── QR Code central grande ────────────────────
        const qrDataUrl = await QRCode.toDataURL(t.qr_hash, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 800,
          color: { dark: "#0a0a0b", light: "#ffffff" },
        })

        const QR_SIZE = 92
        const qrY = afterTitle + 22
        const qrX = contentX + (contentW - QR_SIZE) / 2

        // Moldura externa pulse
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(1.2)
        doc.setFillColor(...PAPER_PURE)
        doc.roundedRect(qrX - 6, qrY - 6, QR_SIZE + 12, QR_SIZE + 12, 4, 4, "FD")

        // Cantos decorativos (Lucide-like brackets)
        const corner = 8
        doc.setDrawColor(...INK)
        doc.setLineWidth(1.4)
        // top-left
        doc.line(qrX - 3, qrY - 3, qrX - 3 + corner, qrY - 3)
        doc.line(qrX - 3, qrY - 3, qrX - 3, qrY - 3 + corner)
        // top-right
        doc.line(qrX + QR_SIZE + 3, qrY - 3, qrX + QR_SIZE + 3 - corner, qrY - 3)
        doc.line(qrX + QR_SIZE + 3, qrY - 3, qrX + QR_SIZE + 3, qrY - 3 + corner)
        // bottom-left
        doc.line(qrX - 3, qrY + QR_SIZE + 3, qrX - 3 + corner, qrY + QR_SIZE + 3)
        doc.line(qrX - 3, qrY + QR_SIZE + 3, qrX - 3, qrY + QR_SIZE + 3 - corner)
        // bottom-right
        doc.line(
          qrX + QR_SIZE + 3,
          qrY + QR_SIZE + 3,
          qrX + QR_SIZE + 3 - corner,
          qrY + QR_SIZE + 3
        )
        doc.line(
          qrX + QR_SIZE + 3,
          qrY + QR_SIZE + 3,
          qrX + QR_SIZE + 3,
          qrY + QR_SIZE + 3 - corner
        )

        doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE)

        // Hash curto embaixo do QR
        const hashShort =
          t.qr_hash.length > 40 ? `${t.qr_hash.slice(0, 16)}…${t.qr_hash.slice(-16)}` : t.qr_hash
        doc.setFontSize(7)
        doc.setTextColor(...MUTE)
        doc.setFont("courier", "normal")
        doc.text(hashShort, contentX + contentW / 2, qrY + QR_SIZE + 12, { align: "center" })

        // ─── Card de dados ────────────────────────────
        const cardY = qrY + QR_SIZE + 20
        const CARD_H = 48
        const CARD_X = contentX + 12
        const CARD_W = contentW - 24

        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.3)
        doc.setFillColor(...PAPER_PURE)
        doc.roundedRect(CARD_X, cardY, CARD_W, CARD_H, 4, 4, "FD")

        // Faixa pulse fininha do lado esquerdo do card
        doc.setFillColor(...PULSE)
        doc.rect(CARD_X, cardY, 2, CARD_H, "F")

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
          const cx = CARD_X + 10 + col * COL_W
          const cy = cardY + 11 + row * 21

          doc.setFont("helvetica", "bold")
          doc.setFontSize(7)
          doc.setTextColor(...MUTE)
          doc.text(labels[r] ?? "", cx, cy)

          doc.setFont("helvetica", "normal")
          doc.setFontSize(11)
          doc.setTextColor(...INK)
          const v = values[r] ?? ""
          const maxW = COL_W - 14
          const vTrim = doc.splitTextToSize(v, maxW)[0] ?? v
          doc.text(vTrim, cx, cy + 7)
        }

        // ─── Selo anti-fraude ──────────────────────────
        const sealY = cardY + CARD_H + 8
        doc.setFillColor(...INK)
        doc.roundedRect(contentX + contentW / 2 - 38, sealY, 76, 10, 5, 5, "F")
        doc.setTextColor(...PULSE)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.text("VERIFICADO · HMAC-SHA256", contentX + contentW / 2, sealY + 6.5, {
          align: "center",
        })

        // ─── Perfuração + Footer ───────────────────────
        const perfY = PAGE_H - 26
        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.25)
        for (let x = contentX + 4; x < PAGE_W - 4; x += 4) {
          doc.line(x, perfY, x + 2, perfY)
        }

        doc.setTextColor(...INK_SOFT)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.text(
          "Apresente este QR Code na entrada do evento",
          contentX + contentW / 2,
          PAGE_H - 18,
          {
            align: "center",
          }
        )

        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        doc.setTextColor(...MUTE)
        doc.text(
          "Documento original · não é necessário imprimir · transferível pela plataforma",
          contentX + contentW / 2,
          PAGE_H - 13,
          { align: "center" }
        )

        doc.setFontSize(7)
        doc.setTextColor(...MUTE_SOFT)
        doc.text("axonia.vercel.app", contentX + contentW / 2, PAGE_H - 7, { align: "center" })
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
