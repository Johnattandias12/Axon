/**
 * Placeholder gradiente para eventos sem banner.
 * Família de gradientes ink+pulse com leve variação por categoria.
 * Usado em listing, hero, cards e uploader vazio.
 */
const GRADIENTS: Record<string, string> = {
  show: "linear-gradient(135deg, #1a2200 0%, #0a0a0b 55%, #050507 100%)",
  esporte: "linear-gradient(135deg, #0a0a0b 0%, #16161a 55%, #1f1e08 100%)",
  religioso: "linear-gradient(160deg, #16161a 0%, #0a0a0b 45%, #1c2400 100%)",
  curso: "linear-gradient(135deg, #0a0a0b 0%, #14140d 60%, #050507 100%)",
  outro: "linear-gradient(135deg, #16161a 0%, #0a0a0b 50%, #1a2200 100%)",
}

interface Props {
  category?: string
  className?: string
}

export function EventBannerPlaceholder({ category = "outro", className = "" }: Props) {
  const grad = GRADIENTS[category] ?? GRADIENTS["outro"]
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: grad }}
      aria-hidden="true"
    >
      {/* Pulse glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[80%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: "var(--pulse)" }}
      />
      {/* Grid pattern */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="evt-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="rgba(200,255,0,0.15)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#evt-grid)" />
      </svg>
      {/* Triângulo AXON sutil */}
      <svg
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        width="48%"
        height="48%"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 13 L92 86 L8 86 Z"
          fill="none"
          stroke="rgba(200,255,0,0.35)"
          strokeWidth="3"
          strokeLinejoin="miter"
        />
      </svg>
    </div>
  )
}
