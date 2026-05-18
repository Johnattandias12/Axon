"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function ResetPasswordButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setLoading(true)
    const toastId = toast.loading("Enviando email...")
    
    try {
      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/api/auth/callback?next=/redefinir-senha`,
      })

      if (error) {
        toast.error(`Erro: ${error.message}`, { id: toastId })
      } else {
        toast.success("Email enviado! Verifique sua caixa de entrada.", { id: toastId, duration: 5000 })
      }
    } catch (err) {
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
      style={{ backgroundColor: "var(--paper-pure)", color: "var(--ink)", border: "1px solid var(--rule)" }}
    >
      {loading ? "Enviando..." : "Enviar link de redefinição"}
    </Button>
  )
}
