"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, Loader2, Pencil } from "lucide-react"

const schema = z.object({
  newEmail: z.string().email("Informe um e-mail válido"),
})

type FormData = z.infer<typeof schema>

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newEmail: "" },
  })

  const onSubmit = async (data: FormData) => {
    if (data.newEmail === currentEmail) {
      toast.error("Este já é o seu e-mail atual.")
      return
    }

    const supabase = createClient()
    // A documentação do Supabase diz que o updateUser para email envia
    // e-mails de confirmação para o antigo e o novo endereço.
    const { error } = await supabase.auth.updateUser({ email: data.newEmail })

    if (error) {
      toast.error("Não foi possível atualizar o e-mail. " + error.message)
      return
    }

    toast.success(
      "Verifique sua caixa de entrada no e-mail novo e no antigo para confirmar a alteração."
    )
    setSuccess(true)
    setEditing(false)
    reset()
    setTimeout(() => setSuccess(false), 8000)
  }

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            E-mail atual
          </p>
          <p className="mt-1 font-mono text-sm" style={{ color: "var(--ink)" }}>
            {currentEmail}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg p-2 transition-colors hover:bg-black/5"
            style={{ color: "var(--ink-3)" }}
            title="Alterar E-mail"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 border-t pt-4"
          style={{ borderColor: "var(--rule)" }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="newEmail" style={{ color: "var(--ink)", fontSize: "12px" }}>
              Novo e-mail
            </Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="exemplo@email.com"
              className="h-9 text-sm"
              {...register("newEmail")}
              aria-invalid={!!errors.newEmail}
            />
            {errors.newEmail && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {errors.newEmail.message}
              </p>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              style={{
                backgroundColor: "var(--pulse)",
                color: "var(--pulse-ink)",
                fontWeight: 600,
              }}
            >
              {isSubmitting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
              {isSubmitting ? "Enviando..." : "Atualizar E-mail"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false)
                reset()
              }}
              style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
            >
              Cancelar
            </Button>
          </div>
          <p className="mt-3 text-[10px]" style={{ color: "var(--mute)" }}>
            * Por segurança, você receberá um e-mail de confirmação no seu endereço atual e no novo.
            Você precisa clicar no link de confirmação para efetivar a troca.
          </p>
        </form>
      )}

      {success && !editing && (
        <div
          className="mt-4 flex items-start gap-2 rounded-lg p-3"
          style={{ backgroundColor: "var(--success-soft)" }}
        >
          <CheckCircle2
            size={16}
            style={{ color: "var(--success)", flexShrink: 0, marginTop: "2px" }}
          />
          <p className="text-xs" style={{ color: "var(--success)" }}>
            Enviamos os links de confirmação! Verifique suas caixas de entrada (inclusive spam) no
            e-mail antigo e no novo.
          </p>
        </div>
      )}
    </div>
  )
}
