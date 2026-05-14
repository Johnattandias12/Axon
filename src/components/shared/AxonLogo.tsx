export function AxonLogo({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-label="AXON"
      className={className}
    >
      <path
        d="M50 8 L92 92 L8 92 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  )
}
