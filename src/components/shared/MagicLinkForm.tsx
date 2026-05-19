"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, CheckCircle2 } from "lucide-react"

const schema = z.object({
  email: z.string().email("E-mail inválido"),
})

type FormData = z.infer<typeof schema>

interface MagicLinkFormProps {
  redirectTo?: string
}

export function MagicLinkForm({ redirectTo: _redirectTo = "/" }: MagicLinkFormProps) {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  void _redirectTo

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
      })
      const body = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null
      if (!res.ok || !body?.ok) {
        setError("email", {
          message: body?.error || "Não foi possível enviar agora. Tente novamente.",
        })
        return
      }
      setSentEmail(data.email)
      setSent(true)
    } catch {
      setError("email", { message: "Erro inesperado. Tente novamente." })
    }
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--success-soft)" }}
        >
          <CheckCircle2 size={22} style={{ color: "var(--success)" }} />
        </div>
        <div>
          <p className="font-semibold" style={{ color: "var(--ink)" }}>
            Link enviado.
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
            Verifique <span style={{ color: "var(--ink)" }}>{sentEmail}</span>
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--mute-2)" }}>
          Não recebeu? Verifique a caixa de spam ou{" "}
          <button
            onClick={() => setSent(false)}
            className="underline underline-offset-2"
            style={{ color: "var(--ink-4)" }}
          >
            tente novamente
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" style={{ color: "var(--ink)" }}>
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          autoFocus
          {...register("email")}
          style={{
            borderColor: errors.email ? "var(--danger)" : "var(--rule-strong)",
          }}
        />
        {errors.email && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full gap-2"
        disabled={isSubmitting}
        style={{
          backgroundColor: "var(--pulse)",
          color: "var(--pulse-ink)",
          fontWeight: 600,
        }}
      >
        {isSubmitting ? "Enviando…" : "Receber link no e-mail"}
        {!isSubmitting && <ArrowRight size={16} />}
      </Button>
    </form>
  )
}
