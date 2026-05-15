import QRCode from "qrcode"
import { AxonSymbol } from "@/components/shared/AxonLogo"
import { centsToBRL, formatDate } from "@/lib/utils"

interface TicketCardProps {
  ticket: {
    id: string
    qr_hash: string
    holder_name: string
    holder_cpf: string
    is_half_price: boolean
    status: string
  }
  event: {
    title: string
    starts_at: string
    venue_name: string | null
    city: string | null
    state: string | null
    category: string
  }
  typeName: string
  lotName: string
  pricePaidCents: number
  index?: number
  total?: number
}

/**
 * Cartão de ingresso com identidade AXON.
 * Layout estilo bilhete físico: corpo principal + canhoto separado por linha tracejada.
 * Renderizado server-side com QR Code SVG.
 */
export async function TicketCard({
  ticket,
  event,
  typeName,
  lotName,
  pricePaidCents,
  index,
  total,
}: TicketCardProps) {
  const qrSvg = await QRCode.toString(ticket.qr_hash, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#0a0a0b", light: "#00000000" },
  })

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    valid: { label: "Válido", color: "var(--success)", bg: "var(--success-soft)" },
    used: { label: "Utilizado", color: "var(--mute)", bg: "var(--paper-soft)" },
    cancelled: { label: "Cancelado", color: "var(--danger)", bg: "var(--danger-soft)" },
    refunded: { label: "Reembolsado", color: "var(--warning)", bg: "var(--warning-soft)" },
  }
  const st = statusLabel[ticket.status] ?? statusLabel["valid"]!

  const cpfMasked =
    ticket.holder_cpf.length >= 11
      ? `${ticket.holder_cpf.slice(0, 3)}.***.***.${ticket.holder_cpf.slice(-2)}`
      : ticket.holder_cpf

  return (
    <article
      className="axon-fade-up relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "var(--paper-pure)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Top dark band */}
      <div
        className="relative flex items-center justify-between px-5 py-3.5"
        style={{
          backgroundColor: "var(--ink)",
          backgroundImage: "linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <AxonSymbol size={20} tone="paper" />
          <span
            className="font-black tracking-[-0.04em]"
            style={{ color: "var(--paper)", fontSize: 16 }}
          >
            AXON
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
          style={{ backgroundColor: st.bg, color: st.color }}
        >
          {st.label}
        </span>
      </div>

      {/* Decorative pulse line */}
      <svg
        className="pointer-events-none absolute top-[44px] right-0 left-0 w-full"
        height="3"
        viewBox="0 0 800 3"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1="0"
          y1="1.5"
          x2="800"
          y2="1.5"
          stroke="var(--pulse)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[1fr_180px]">
        {/* Info */}
        <div className="space-y-3.5">
          <div>
            <p
              className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Evento
            </p>
            <h3
              className="mt-0.5 text-lg leading-tight font-bold"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              {event.title}
            </h3>
            <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
              {formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" })}
            </p>
            {(event.venue_name ?? event.city) && (
              <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
                {[event.venue_name, event.city, event.state].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Setor" value={typeName} />
            <Field label="Lote" value={lotName} />
            <Field label="Titular" value={ticket.holder_name} />
            <Field label="Documento" value={cpfMasked} />
          </div>

          <div
            className="flex items-end justify-between border-t pt-3"
            style={{ borderColor: "var(--rule)" }}
          >
            <div>
              <p
                className="text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--mute)" }}
              >
                Valor pago
              </p>
              <p
                className="font-mono text-base font-bold"
                style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}
              >
                {pricePaidCents === 0 ? "Grátis" : centsToBRL(pricePaidCents)}
              </p>
            </div>
            {ticket.is_half_price && (
              <span
                className="rounded px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: "var(--warning-soft)",
                  color: "var(--warning)",
                }}
              >
                MEIA-ENTRADA
              </span>
            )}
            {typeof index === "number" && typeof total === "number" && total > 1 && (
              <span
                className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold"
                style={{
                  backgroundColor: "var(--paper-soft)",
                  color: "var(--mute)",
                }}
              >
                {index + 1}/{total}
              </span>
            )}
          </div>
        </div>

        {/* Perforation + QR */}
        <div
          className="relative flex flex-col items-center justify-center gap-2 sm:border-l sm:border-dashed sm:pl-4"
          style={{ borderColor: "var(--rule-strong)" }}
        >
          <span
            className="absolute -top-2 -left-3 hidden h-5 w-5 rounded-full sm:block"
            style={{ backgroundColor: "var(--paper)" }}
            aria-hidden="true"
          />
          <span
            className="absolute -bottom-2 -left-3 hidden h-5 w-5 rounded-full sm:block"
            style={{ backgroundColor: "var(--paper)" }}
            aria-hidden="true"
          />
          <div
            className="rounded-lg border-2 p-2"
            style={{
              borderColor: "var(--pulse)",
              backgroundColor: "var(--paper-pure)",
              boxShadow: "0 0 0 4px var(--pulse-soft)",
            }}
          >
            <div
              className="h-32 w-32"
              dangerouslySetInnerHTML={{ __html: qrSvg.replace(/width="\d+"|height="\d+"/g, "") }}
            />
          </div>
          <p
            className="text-center font-mono text-[9px] leading-tight break-all"
            style={{ color: "var(--mute)" }}
          >
            {ticket.qr_hash}
          </p>
        </div>
      </div>

      {/* Bottom ribbon */}
      <div
        className="flex items-center justify-between border-t px-5 py-2.5 text-[10px]"
        style={{
          borderColor: "var(--rule)",
          backgroundColor: "var(--paper-soft)",
          color: "var(--mute)",
        }}
      >
        <span>Apresente este QR Code na entrada</span>
        <span className="font-mono">#{ticket.id.slice(0, 8)}</span>
      </div>
    </article>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[10px] font-semibold tracking-wider uppercase"
        style={{ color: "var(--mute)" }}
      >
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-medium" style={{ color: "var(--ink)" }}>
        {value}
      </p>
    </div>
  )
}
