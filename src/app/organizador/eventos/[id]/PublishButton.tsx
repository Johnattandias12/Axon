"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Globe } from "lucide-react"

interface Props {
  eventId: string
  disabled?: boolean
}

export function PublishButton({ eventId, disabled }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const publish = async () => {
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error: err } = await supabase
      .from("events")
      .update({ status: "published" })
      .eq("id", eventId)

    if (err) {
      // Trigger do banco vai rejeitar se meia-entrada < 40%
      const msg = err.message.includes("meia_entrada_insuficiente")
        ? "Meia-entrada insuficiente. Adicione mais lotes de meia antes de publicar."
        : err.message.includes("evento_sem_lotes")
          ? "Adicione pelo menos um lote antes de publicar."
          : "Erro ao publicar. Tente novamente."
      setError(msg)
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <div className="space-y-1.5">
      <Button
        onClick={publish}
        disabled={disabled || loading}
        size="sm"
        style={{
          backgroundColor: disabled ? "var(--paper-soft)" : "var(--pulse)",
          color: disabled ? "var(--mute)" : "var(--pulse-ink)",
          fontWeight: 600,
        }}
      >
        <Globe size={14} className="mr-1.5" />
        {loading ? "Publicando…" : "Publicar"}
      </Button>
      {error && (
        <p className="max-w-xs text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  )
}
