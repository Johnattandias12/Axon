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
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"

const schema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres").max(72, "Senha muito longa"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Use uma senha diferente da atual",
    path: ["newPassword"],
  })

type FormData = z.infer<typeof schema>

export function SecurityForm({ email }: { email: string }) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email,
      password: data.currentPassword,
    })

    if (reauthErr) {
      toast.error("Senha atual incorreta.")
      return
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: data.newPassword })
    if (updateErr) {
      toast.error("Não foi possível atualizar a senha. Tente novamente.")
      return
    }

    toast.success("Senha atualizada.")
    setSuccess(true)
    reset()
    setTimeout(() => setSuccess(false), 4000)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border p-5"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      noValidate
    >
      <PasswordField
        id="current-pass"
        label="Senha atual"
        autoComplete="current-password"
        show={showCurrent}
        onToggle={() => setShowCurrent((v) => !v)}
        {...register("currentPassword")}
        error={errors.currentPassword?.message}
      />
      <PasswordField
        id="new-pass"
        label="Nova senha"
        autoComplete="new-password"
        show={showNew}
        onToggle={() => setShowNew((v) => !v)}
        {...register("newPassword")}
        error={errors.newPassword?.message}
      />
      <PasswordField
        id="confirm-pass"
        label="Confirme a nova senha"
        autoComplete="new-password"
        show={showNew}
        onToggle={() => setShowNew((v) => !v)}
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: "var(--pulse)",
            color: "var(--pulse-ink)",
            fontWeight: 600,
          }}
        >
          {isSubmitting ? "Atualizando…" : "Trocar senha"}
        </Button>
        {success && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
            <span className="text-sm" style={{ color: "var(--success)" }}>
              Senha atualizada.
            </span>
          </div>
        )}
      </div>
    </form>
  )
}

type PasswordFieldProps = React.ComponentProps<"input"> & {
  id: string
  label: string
  show: boolean
  onToggle: () => void
  error?: string | undefined
}

function PasswordField({ id, label, show, onToggle, error, ...inputProps }: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} style={{ color: "var(--ink)" }}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          className="h-10 pr-12 text-base md:h-9 md:text-sm"
          {...inputProps}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          className="absolute top-1/2 right-2 flex h-7 w-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors hover:bg-black/5"
          style={{ color: "var(--mute)" }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--danger)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
