import { AxonSymbol } from "@/components/shared/AxonLogo"

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-pulse">
          <AxonSymbol size={32} tone="pulse" />
        </div>
        <p className="text-xs" style={{ color: "var(--mute)" }}>
          Carregando…
        </p>
      </div>
    </div>
  )
}
