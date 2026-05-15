import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "AXON — Ingressos online sem complicação"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const INK = "#0a0a0b"
const PAPER = "#fafaf7"
const PULSE = "#c8ff00"

export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        backgroundColor: INK,
        fontFamily: "Geist, system-ui, -apple-system, sans-serif",
        color: PAPER,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Pulse glow */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(200,255,0,0.45) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -160,
          left: -120,
          width: 460,
          height: 460,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(200,255,0,0.18) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      {/* Top row — wordmark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          position: "relative",
        }}
      >
        <svg width="74" height="74" viewBox="0 0 100 100">
          <path
            d="M50 13 L92 86 L8 86 Z"
            fill="none"
            stroke={PULSE}
            strokeWidth="7"
            strokeLinejoin="miter"
          />
        </svg>
        <span
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-0.045em",
            color: PULSE,
            lineHeight: 1,
          }}
        >
          AXON
        </span>
      </div>

      {/* Headline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
        <p
          style={{
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(250,250,247,0.55)",
            margin: 0,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              width: 32,
              height: 2,
              backgroundColor: PULSE,
              display: "inline-block",
            }}
          />
          Ingressos online
        </p>
        <p
          style={{
            fontSize: 90,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
            margin: 0,
            color: PAPER,
            maxWidth: 980,
          }}
        >
          Compre, valide e <span style={{ color: PULSE }}>aproveite</span>.
        </p>
        <p
          style={{
            fontSize: 30,
            lineHeight: 1.45,
            margin: 0,
            color: "rgba(250,250,247,0.65)",
            maxWidth: 880,
          }}
        >
          Pix instantâneo, QR Code assinado e acesso verificado na porta. Tudo no celular.
        </p>
      </div>

      {/* Bottom row — chips + url */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {["Pix", "QR Code", "D+1"].map((t) => (
            <span
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid rgba(200,255,0,0.35)",
                backgroundColor: "rgba(200,255,0,0.08)",
                borderRadius: 9999,
                padding: "12px 22px",
                fontSize: 22,
                fontWeight: 700,
                color: PULSE,
                letterSpacing: "-0.01em",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  backgroundColor: PULSE,
                  display: "inline-block",
                }}
              />
              {t}
            </span>
          ))}
        </div>
        <span
          style={{
            fontSize: 24,
            color: "rgba(250,250,247,0.5)",
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: "-0.01em",
          }}
        >
          axonia.vercel.app
        </span>
      </div>
    </div>,
    { ...size }
  )
}
