/**
 * AXON · Logo system (v2)
 * Triângulo equilátero aberto (stroke fino) + wordmark "AXON" ao lado.
 * Inspirado na arte oficial: triângulo limpo, sem nenhum detalhe interno.
 *
 * Variantes:
 *   <AxonSymbol />              → só o triângulo (quadrado 1:1)
 *   <AxonSymbolMono />          → alias para AxonSymbol (compat)
 *   <AxonLogo />                → padrão: triângulo + AXON inline (wordmark)
 *   <AxonLogo variant="symbol"/>→ força só o símbolo
 *
 * Tones:
 *   "auto"  → currentColor (default; herda do contexto)
 *   "ink"   → var(--ink) — preto sobre fundo claro
 *   "paper" → var(--paper) — branco sobre fundo escuro
 *   "pulse" → var(--pulse) — verde lime sobre fundo escuro
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

/** Apenas o triângulo, sem texto. Sempre 1:1. */
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
        d="M50 13 L92 86 L8 86 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="7"
        strokeLinejoin="miter"
      />
    </svg>
  )
}

export const AxonSymbolMono = AxonSymbol

interface LogoProps extends BaseProps {
  /** "symbol" = só o triângulo · "wordmark" = triângulo + AXON (padrão) */
  variant?: "wordmark" | "symbol" | "mono"
}

/**
 * Wordmark padrão: triângulo + "AXON" inline, alinhados pelo cap-height.
 * `size` é a altura do conjunto. Largura cresce proporcional.
 */
export function AxonLogo({
  size = 24,
  className = "",
  tone = "auto",
  variant = "wordmark",
}: LogoProps) {
  if (variant === "mono" || variant === "symbol") {
    return <AxonSymbol size={size} className={className} tone={tone} />
  }

  const stroke = TONE_COLOR[tone]
  // ViewBox proporcional. Altura = 100, largura ≈ 380 (triângulo 100 + gap 16 + texto ~264).
  const h = size
  const w = (size * 380) / 100

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 380 100"
      role="img"
      aria-label="AXON"
      className={className}
    >
      <title>AXON</title>
      {/* Triângulo */}
      <path
        d="M50 13 L92 86 L8 86 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="7"
        strokeLinejoin="miter"
      />
      {/* Wordmark — alinhado pelo cap-height do triângulo */}
      <text
        x="116"
        y="83"
        fontFamily="Geist, 'Helvetica Neue', Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="92"
        letterSpacing="-2"
        fill={stroke}
      >
        AXON
      </text>
    </svg>
  )
}
