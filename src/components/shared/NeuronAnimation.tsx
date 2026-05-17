"use client"

/**
 * Animação decorativa de neurônio se ramificando.
 * Sinapses crescem do centro, pulsam em pulse-lime, fade-out e reinicia.
 * Pensada pra fundo da hero — leve, sem JS de animação (CSS puro).
 */
export function NeuronAnimation({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      viewBox="0 0 1400 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="neuron-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(200,255,0,0.95)" />
          <stop offset="40%" stopColor="rgba(200,255,0,0.45)" />
          <stop offset="100%" stopColor="rgba(200,255,0,0)" />
        </radialGradient>
        <filter id="neuron-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow central pulsando */}
      <circle
        cx="700"
        cy="300"
        r="120"
        fill="url(#neuron-core)"
        style={{ animation: "neuron-core-pulse 4s var(--ease-in-out, ease-in-out) infinite" }}
      />

      {/* Galhos principais — 6 raios saindo do centro com impulso viajando */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 6
        const len = 280 + (i % 2) * 80
        const x2 = 700 + Math.cos(angle) * len
        const y2 = 300 + Math.sin(angle) * len * 0.55
        const cx = 700 + Math.cos(angle) * len * 0.55 + Math.sin(angle) * 40
        const cy = 300 + Math.sin(angle) * len * 0.3 - Math.cos(angle) * 30
        const pathId = `axon-path-${i}`
        const pathD = `M 700 300 Q ${cx} ${cy} ${x2} ${y2}`
        const impulseDur = 3 + (i % 3) * 0.5
        const impulseDelay = i * 0.5
        return (
          <g key={`branch-${i}`}>
            {/* Axônio (path base) */}
            <path
              id={pathId}
              d={pathD}
              stroke="rgba(200,255,0,0.5)"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="600"
              filter="url(#neuron-glow)"
              style={{
                animation: `neuron-branch ${5 + i * 0.4}s var(--ease-in-out, cubic-bezier(0.4,0,0.2,1)) infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
            {/* Impulso elétrico viajando ao longo do axônio */}
            <circle r="3" fill="rgba(220,255,80,1)" filter="url(#neuron-glow)" opacity="0.95">
              <animateMotion
                dur={`${impulseDur}s`}
                begin={`${impulseDelay}s`}
                repeatCount="indefinite"
                rotate="auto"
                keyTimes="0;0.85;1"
                keySplines="0.25 0.1 0.25 1; 0.4 0 1 1"
                calcMode="spline"
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.15;0.8;1"
                dur={`${impulseDur}s`}
                begin={`${impulseDelay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="1.5;3.5;3;1"
                keyTimes="0;0.2;0.8;1"
                dur={`${impulseDur}s`}
                begin={`${impulseDelay}s`}
                repeatCount="indefinite"
              />
            </circle>
            {/* Trilha curta atrás do impulso */}
            <circle r="2" fill="rgba(200,255,0,0.5)" filter="url(#neuron-glow)">
              <animateMotion
                dur={`${impulseDur}s`}
                begin={`${impulseDelay + 0.15}s`}
                repeatCount="indefinite"
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;0.6;0"
                keyTimes="0;0.5;1"
                dur={`${impulseDur}s`}
                begin={`${impulseDelay + 0.15}s`}
                repeatCount="indefinite"
              />
            </circle>
            {/* Nodo terminal — acende ao receber o impulso */}
            <circle
              cx={x2}
              cy={y2}
              r="3"
              fill="rgba(200,255,0,0.9)"
              filter="url(#neuron-glow)"
              style={{
                animation: `neuron-node ${impulseDur}s var(--ease-in-out) infinite`,
                animationDelay: `${impulseDelay + impulseDur * 0.85}s`,
              }}
            />
            {/* Sub-ramificação pequena no meio do galho */}
            <path
              d={`M ${cx} ${cy} l ${Math.cos(angle + 0.8) * 60} ${Math.sin(angle + 0.8) * 30}`}
              stroke="rgba(200,255,0,0.3)"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="80"
              style={{
                animation: `neuron-sub ${6 + i * 0.3}s var(--ease-in-out) infinite`,
                animationDelay: `${i * 0.3 + 1.2}s`,
              }}
            />
            <path
              d={`M ${cx} ${cy} l ${Math.cos(angle - 0.6) * 50} ${Math.sin(angle - 0.6) * 25}`}
              stroke="rgba(200,255,0,0.25)"
              strokeWidth="0.7"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="70"
              style={{
                animation: `neuron-sub ${6.5 + i * 0.25}s var(--ease-in-out) infinite`,
                animationDelay: `${i * 0.3 + 1.5}s`,
              }}
            />
          </g>
        )
      })}

      {/* Nodos sinápticos flutuantes ao fundo */}
      {[
        [200, 150, 2, "6s"],
        [1180, 180, 1.5, "5s"],
        [240, 480, 1.8, "7s"],
        [1240, 460, 2.2, "6.5s"],
        [560, 80, 1.2, "8s"],
        [880, 540, 1.4, "5.5s"],
      ].map(([cx, cy, r, dur], i) => (
        <circle
          key={`node-${i}`}
          cx={cx as number}
          cy={cy as number}
          r={r as number}
          fill="rgba(200,255,0,0.6)"
          filter="url(#neuron-glow)"
          style={{
            animation: `neuron-float ${dur as string} ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </svg>
  )
}
