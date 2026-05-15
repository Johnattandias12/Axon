/**
 * AXON · Logo system
 * Triângulo monolítico (A). SEM detalhes/pulso/nodo dentro do triângulo.
 *
 * Variantes:
 *   <AxonSymbol />      → símbolo (triângulo) apenas
 *   <AxonSymbolMono />  → alias do mesmo símbolo (compat)
 *   <AxonLogo />        → wordmark horizontal "AXON" + triângulo
 */

type Tone = "auto" | "ink" | "paper" | "pulse"

const TONE_COLOR: Record<Tone, string> = {
  auto: "currentColor",
  ink: "var(--ink)",
  paper: "var(--paper)",
  pulse: "var(--pulse)",
}

interface BaseProps {
  size?: number
  className?: string
  tone?: Tone
}

export function AxonSymbol({ size = 24, className = "", tone = "auto" }: BaseProps) {
  const stroke = TONE_COLOR[tone]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="AXON"
      className={className}
    >
      <title>AXON</title>
      <path
        d="M50 6 L94 94 L6 94 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="10"
        strokeLinejoin="miter"
      />
    </svg>
  )
}

export const AxonSymbolMono = AxonSymbol

interface LogoProps extends BaseProps {
  variant?: "wordmark" | "symbol" | "mono"
}

export function AxonLogo({
  size = 24,
  className = "",
  tone = "auto",
  variant = "symbol",
}: LogoProps) {
  if (variant === "mono" || variant === "symbol") {
    return <AxonSymbol size={size} className={className} tone={tone} />
  }
  const stroke = TONE_COLOR[tone]
  const h = size
  const w = size * (600 / 140)
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 600 140"
      role="img"
      aria-label="AXON"
      className={className}
    >
      <title>AXON</title>
      <g transform="translate(10, 18) scale(1.04)">
        <path
          d="M50 6 L94 94 L6 94 Z"
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinejoin="miter"
        />
      </g>
      <text
        x="140"
        y="100"
        fontFamily="Geist, Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize="110"
        letterSpacing="-0.05em"
        fill={stroke}
      >
        AXON
      </text>
    </svg>
  )
}
