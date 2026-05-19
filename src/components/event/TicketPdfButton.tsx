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

const BG_DARK = [8, 8, 10] as const
const BG_CARD = [18, 18, 20] as const
const BG_STUB = [12, 12, 14] as const
const PAPER = [255, 255, 255] as const
const PULSE = [200, 255, 0] as const
const MUTE = [140, 140, 145] as const
const WATERMARK = [16, 16, 18] as const
const RULE = [30, 30, 35] as const

/**
 * Gera PDF premium dos ingressos no padrão AXON.
 * Layout A4 retrato "Dark Mode":
 *  - Background escuro total
 *  - Único logo em triângulo
 *  - Watermark AXON repetido em diagonal sutil
 *  - QR grande com moldura pulse
 *  - Selo anti-fraude HMAC-SHA256
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
      const STUB_W = 20

      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i]
        if (!t) continue
        if (i > 0) doc.addPage()

        const contentX = STUB_W
        const contentW = PAGE_W - STUB_W

        // ─── Background principal (Escuro) ─────────────
        doc.setFillColor(...BG_DARK)
        doc.rect(0, 0, PAGE_W, PAGE_H, "F")

        // ─── Watermark AXON diagonal sutil ─────────────
        doc.setTextColor(...WATERMARK)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(54)
        for (let row = -1; row < 8; row++) {
          for (let col = -1; col < 4; col++) {
            const wx = col * 90 + (row % 2 === 0 ? 0 : 45)
            const wy = row * 45 + 30
            doc.text("AXON", wx, wy, { angle: -28 })
          }
        }

        // ─── Side strip (Stub) vertical à esquerda ─────
        doc.setFillColor(...BG_STUB)
        doc.rect(0, 0, STUB_W, PAGE_H, "F")
        // Linha divisória fina
        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.5)
        doc.line(STUB_W, 0, STUB_W, PAGE_H)

        // Texto vertical no stub
        doc.setTextColor(...PULSE)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(8)
        doc.text(`TICKET · INGRESSO ${i + 1} DE ${tickets.length}`, STUB_W / 2 + 2, PAGE_H - 18, {
          angle: 90,
        })

        // ─── Top band com LOGO ÚNICO + pedido ──────────
        const BAND_H = 34
        doc.setFillColor(...BG_CARD)
        doc.rect(contentX, 0, contentW, BAND_H, "F")

        // Logo AXON (Apenas UM triângulo, redesenhado perfeitamente)
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(1.2)
        const wmCy = BAND_H / 2
        doc.triangle(contentX + 16, wmCy - 7, contentX + 24, wmCy + 5, contentX + 8, wmCy + 5, "S")

        doc.setTextColor(...PAPER)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(22)
        doc.text("AXON", contentX + 30, wmCy + 3)

        // Infos do pedido à direita
        doc.setTextColor(...PULSE)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text(`INGRESSO ${i + 1} / ${tickets.length}`, PAGE_W - 12, wmCy - 1, { align: "right" })
        doc.setFontSize(7)
        doc.setTextColor(...MUTE)
        doc.text(`#${orderId.slice(0, 12).toUpperCase()}`, PAGE_W - 12, wmCy + 5, {
          align: "right",
        })

        // Linha inferior do header
        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.5)
        doc.line(contentX, BAND_H, PAGE_W, BAND_H)

        // ─── Título do evento ──────────────────────────
        const titleY = BAND_H + 24
        doc.setTextColor(...PAPER)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(28)
        const titleLines = doc.splitTextToSize(eventTitle, contentW - 30) as string[]
        titleLines.slice(0, 3).forEach((line, idx) => {
          doc.text(line, contentX + contentW / 2, titleY + idx * 11, { align: "center" })
        })

        const afterTitle = titleY + Math.min(titleLines.length, 3) * 11

        // Data + local
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)
        doc.setTextColor(...PULSE)
        doc.text(eventDate, contentX + contentW / 2, afterTitle + 4, { align: "center" })
        
        if (eventLocation) {
          doc.setTextColor(...MUTE)
          doc.setFontSize(10)
          doc.text(eventLocation, contentX + contentW / 2, afterTitle + 10, { align: "center" })
        }

        // ─── QR Code (Design Neon) ─────────────────────
        const qrDataUrl = await QRCode.toDataURL(t.qr_hash, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 800,
          color: { dark: "#08080A", light: "#C8FF00" }, // QR Code Verde Pulse com fundo Escuro? Não, fundo Pulse com QR escuro!
        })

        const QR_SIZE = 96
        const qrY = afterTitle + 24
        const qrX = contentX + (contentW - QR_SIZE) / 2

        // Sombra / Glow Pulse
        doc.setFillColor(30, 40, 0)
        doc.roundedRect(qrX - 4, qrY - 4, QR_SIZE + 8, QR_SIZE + 8, 4, 4, "F")

        doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE)

        // Cantos minimalistas (Brackets)
        const corner = 10
        doc.setDrawColor(...PAPER)
        doc.setLineWidth(1.2)
        // top-left
        doc.line(qrX - 6, qrY - 6, qrX - 6 + corner, qrY - 6)
        doc.line(qrX - 6, qrY - 6, qrX - 6, qrY - 6 + corner)
        // top-right
        doc.line(qrX + QR_SIZE + 6, qrY - 6, qrX + QR_SIZE + 6 - corner, qrY - 6)
        doc.line(qrX + QR_SIZE + 6, qrY - 6, qrX + QR_SIZE + 6, qrY - 6 + corner)
        // bottom-left
        doc.line(qrX - 6, qrY + QR_SIZE + 6, qrX - 6 + corner, qrY + QR_SIZE + 6)
        doc.line(qrX - 6, qrY + QR_SIZE + 6, qrX - 6, qrY + QR_SIZE + 6 - corner)
        // bottom-right
        doc.line(qrX + QR_SIZE + 6, qrY + QR_SIZE + 6, qrX + QR_SIZE + 6 - corner, qrY + QR_SIZE + 6)
        doc.line(qrX + QR_SIZE + 6, qrY + QR_SIZE + 6, qrX + QR_SIZE + 6, qrY + QR_SIZE + 6 - corner)

        // Hash curto embaixo do QR
        const hashShort = t.qr_hash.length > 40 ? `${t.qr_hash.slice(0, 16)}…${t.qr_hash.slice(-16)}` : t.qr_hash
        doc.setFontSize(8)
        doc.setTextColor(...MUTE)
        doc.setFont("courier", "normal")
        doc.text(hashShort, contentX + contentW / 2, qrY + QR_SIZE + 14, { align: "center" })

        // ─── Card de dados do titular ──────────────────
        const cardY = qrY + QR_SIZE + 24
        const CARD_H = 50
        const CARD_X = contentX + 16
        const CARD_W = contentW - 32

        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.5)
        doc.setFillColor(...BG_CARD)
        doc.roundedRect(CARD_X, cardY, CARD_W, CARD_H, 4, 4, "FD")

        // Faixa pulse indicadora
        doc.setFillColor(...PULSE)
        doc.roundedRect(CARD_X, cardY, 3, CARD_H, 2, 2, "F")

        const labels = ["SETOR", "LOTE", "TITULAR", "DOCUMENTO"]
        const values = [
          t.type_name.toUpperCase(),
          (t.lot_name + (t.is_half_price ? " · MEIA" : "")).toUpperCase(),
          t.holder_name.toUpperCase(),
          t.holder_cpf.length >= 11
            ? `${t.holder_cpf.slice(0, 3)}.***.***-${t.holder_cpf.slice(-2)}`
            : t.holder_cpf,
        ]

        const COL_W = CARD_W / 2
        for (let r = 0; r < 4; r++) {
          const col = r % 2
          const row = Math.floor(r / 2)
          const cx = CARD_X + 14 + col * COL_W
          const cy = cardY + 12 + row * 22

          doc.setFont("helvetica", "bold")
          doc.setFontSize(7)
          doc.setTextColor(...MUTE)
          doc.text(labels[r] ?? "", cx, cy)

          doc.setFont("helvetica", "bold")
          doc.setFontSize(11)
          doc.setTextColor(...PAPER)
          const v = values[r] ?? ""
          const maxW = COL_W - 16
          const vTrim = doc.splitTextToSize(v, maxW)[0] ?? v
          doc.text(vTrim, cx, cy + 7)
        }

        // ─── Selo anti-fraude ──────────────────────────
        const sealY = cardY + CARD_H + 10
        doc.setFillColor(...BG_STUB)
        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.3)
        doc.roundedRect(contentX + contentW / 2 - 40, sealY, 80, 10, 5, 5, "FD")
        
        doc.setTextColor(...PULSE)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.text("VERIFICADO · MODO OFFLINE · HMAC-SHA256", contentX + contentW / 2, sealY + 6.5, {
          align: "center",
        })

        // ─── Footer ────────────────────────────────────
        doc.setTextColor(...PULSE)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.text(
          "Apresente este QR Code na entrada do evento",
          contentX + contentW / 2,
          PAGE_H - 18,
          { align: "center" }
        )

        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        doc.setTextColor(...MUTE)
        doc.text(
          "Documento original digital · não é necessário imprimir",
          contentX + contentW / 2,
          PAGE_H - 13,
          { align: "center" }
        )
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
      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-[0_8px_24px_-8px_rgba(200,255,0,0.6)] disabled:opacity-60"
      style={{
        backgroundColor: "var(--pulse)",
        color: "#000000",
      }}
    >
      {pending ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          Gerando Ingresso VIP…
        </>
      ) : (
        <>
          <Download size={12} />
          Baixar Ingresso
        </>
      )}
    </button>
  )
}
