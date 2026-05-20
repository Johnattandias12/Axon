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

const BG_DARK = [10, 10, 12] as const
const BG_CARD = [20, 20, 24] as const
const BG_STUB = [14, 14, 16] as const
const PAPER = [255, 255, 255] as const
const PULSE = [200, 255, 0] as const
const MUTE = [145, 145, 150] as const
const WATERMARK = [16, 16, 20] as const
const RULE = [32, 32, 38] as const

/**
 * Gera PDF premium de ingressos no padrão AXON.
 * Layout A4 retrato "Dark Mode" com posições fixadas
 * para evitar qualquer sobreposição de textos.
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
        const BAND_H = 28
        doc.setFillColor(...BG_CARD)
        doc.rect(contentX, 0, contentW, BAND_H, "F")

        // Logo AXON (Apenas UM triângulo, redesenhado perfeitamente)
        doc.setDrawColor(...PULSE)
        doc.setLineWidth(1.2)
        const wmCy = BAND_H / 2
        doc.triangle(contentX + 16, wmCy - 6, contentX + 24, wmCy + 5, contentX + 8, wmCy + 5, "S")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(20)

        // Main white logo text
        doc.setTextColor(...PAPER)
        doc.text("AXON", contentX + 30, wmCy + 2)

        // Infos do pedido à direita
        doc.setTextColor(...PULSE)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text(`INGRESSO ${i + 1} / ${tickets.length}`, PAGE_W - 12, wmCy - 1, { align: "right" })
        doc.setFontSize(7)
        doc.setTextColor(...MUTE)
        doc.text(`#${orderId.slice(0, 12).toUpperCase()}`, PAGE_W - 12, wmCy + 4, {
          align: "right",
        })

        // Linha inferior do header
        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.5)
        doc.line(contentX, BAND_H, PAGE_W, BAND_H)

        // ─── Título do evento ──────────────────────────
        const titleY = BAND_H + 18
        doc.setTextColor(...PAPER)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(22)

        // Limita o título em até 2 linhas e adiciona reticências se passar
        const titleLinesRaw = doc.splitTextToSize(eventTitle, contentW - 32) as string[]
        const titleLines = titleLinesRaw.slice(0, 2)
        if (titleLinesRaw.length > 2 && titleLines[1]) {
          titleLines[1] = titleLines[1].slice(0, -3) + "..."
        }

        titleLines.forEach((line, idx) => {
          doc.text(line, contentX + contentW / 2, titleY + idx * 8.5, { align: "center" })
        })

        // Data + local em posições fixas, independentes de layout dinâmico
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(...PULSE)
        doc.text(eventDate, contentX + contentW / 2, BAND_H + 39, { align: "center" })

        if (eventLocation) {
          doc.setTextColor(...MUTE)
          doc.setFontSize(9)
          doc.text(eventLocation, contentX + contentW / 2, BAND_H + 45, { align: "center" })
        }

        // ─── QR Code (Design Neon) ─────────────────────
        const qrDataUrl = await QRCode.toDataURL(t.qr_hash, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 800,
          color: { dark: "#0A0A0C", light: "#C8FF00" },
        })

        const QR_SIZE = 70
        const qrY = BAND_H + 54
        const qrX = contentX + (contentW - QR_SIZE) / 2

        // Sombra / Glow Pulse
        doc.setFillColor(25, 30, 0)
        doc.roundedRect(qrX - 3, qrY - 3, QR_SIZE + 6, QR_SIZE + 6, 4, 4, "F")

        doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE)

        // Cantos minimalistas (Brackets)
        const corner = 8
        doc.setDrawColor(...PAPER)
        doc.setLineWidth(1.0)
        // top-left
        doc.line(qrX - 5, qrY - 5, qrX - 5 + corner, qrY - 5)
        doc.line(qrX - 5, qrY - 5, qrX - 5, qrY - 5 + corner)
        // top-right
        doc.line(qrX + QR_SIZE + 5, qrY - 5, qrX + QR_SIZE + 5 - corner, qrY - 5)
        doc.line(qrX + QR_SIZE + 5, qrY - 5, qrX + QR_SIZE + 5, qrY - 5 + corner)
        // bottom-left
        doc.line(qrX - 5, qrY + QR_SIZE + 5, qrX - 5 + corner, qrY + QR_SIZE + 5)
        doc.line(qrX - 5, qrY + QR_SIZE + 5, qrX - 5, qrY + QR_SIZE + 5 - corner)
        // bottom-right
        doc.line(
          qrX + QR_SIZE + 5,
          qrY + QR_SIZE + 5,
          qrX + QR_SIZE + 5 - corner,
          qrY + QR_SIZE + 5
        )
        doc.line(
          qrX + QR_SIZE + 5,
          qrY + QR_SIZE + 5,
          qrX + QR_SIZE + 5,
          qrY + QR_SIZE + 5 - corner
        )

        // Hash curto embaixo do QR
        const hashShort =
          t.qr_hash.length > 40 ? `${t.qr_hash.slice(0, 16)}…${t.qr_hash.slice(-16)}` : t.qr_hash
        doc.setFontSize(8)
        doc.setTextColor(...MUTE)
        doc.setFont("courier", "normal")
        doc.text(hashShort, contentX + contentW / 2, qrY + QR_SIZE + 10, { align: "center" })

        // ─── Card de dados do titular (Posicionado com Y Fixo) ───
        const cardY = BAND_H + 144
        const CARD_H = 44
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
          const cy = cardY + 10 + row * 19

          doc.setFont("helvetica", "bold")
          doc.setFontSize(7)
          doc.setTextColor(...MUTE)
          doc.text(labels[r] ?? "", cx, cy)

          doc.setFont("helvetica", "bold")
          doc.setFontSize(10)
          doc.setTextColor(...PAPER)
          const v = values[r] ?? ""
          const maxW = COL_W - 16
          const vTrim = doc.splitTextToSize(v, maxW)[0] ?? v
          doc.text(vTrim, cx, cy + 6)
        }

        // ─── Selo anti-fraude (Y Fixo) ──────────────────
        const sealY = cardY + CARD_H + 8
        doc.setFillColor(...BG_STUB)
        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.3)
        doc.roundedRect(contentX + contentW / 2 - 40, sealY, 80, 8, 4, 4, "FD")

        doc.setTextColor(...PULSE)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(6.5)
        doc.text("VERIFICADO · MODO OFFLINE · HMAC-SHA256", contentX + contentW / 2, sealY + 5.5, {
          align: "center",
        })

        // ─── Footer (Y Fixo próximo ao rodapé) ────────────
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
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-[0_8px_24px_-8px_rgba(200,255,0,0.6)] disabled:opacity-60"
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
