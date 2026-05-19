"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ResetPasswordButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setLoading(true)
    const toastId = toast.loading("Enviando email...")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const body = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null

      if (!res.ok || !body?.ok) {
        toast.error(body?.error || "Não conseguimos enviar agora. Tente em alguns minutos.", {
          id: toastId,
        })
        return
      }
      toast.success("E-mail de redefinição enviado. Confere a caixa de entrada (e o spam).", {
        id: toastId,
        duration: 6000,
      })
    } catch {
      toast.error("Erro inesperado ao enviar.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleReset}
      disabled={loading}
      className="w-full sm:w-auto"
      style={{
        backgroundColor: "var(--paper-pure)",
        color: "var(--ink)",
        border: "1px solid var(--rule)",
      }}
    >
      {loading ? "Enviando..." : "Enviar link de redefinição"}
    </Button>
  )
}
