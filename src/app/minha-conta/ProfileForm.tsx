"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { formatCPF, formatPhone, validateCPF } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

const schema = z.object({
  full_name: z.string().min(3, "Nome muito curto"),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  cpf: z
    .string()
    .optional()
    .refine((v) => !v || validateCPF(v.replace(/\D/g, "")), "CPF inválido"),
})

type FormData = z.infer<typeof schema>

interface Props {
  userId: string
  initialData: { full_name: string; phone: string; cpf: string; birth_date: string }
}

export function ProfileForm({ userId, initialData }: Props) {
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  })

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone?.replace(/\D/g, "") ?? null,
        cpf: data.cpf?.replace(/\D/g, "") ?? null,
        birth_date: data.birth_date ? data.birth_date : null,
      })
      .eq("id", userId)

    if (error) {
      setError("root", { message: "Erro ao salvar. Tente novamente." })
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label style={{ color: "var(--ink)" }}>Nome completo</Label>
        <Input {...register("full_name")} placeholder="Seu nome" />
        {errors.full_name && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            {errors.full_name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label style={{ color: "var(--ink)" }}>Telefone</Label>
        <Input
          {...register("phone")}
          placeholder="(84) 99999-9999"
          onChange={(e) => setValue("phone", formatPhone(e.target.value), { shouldDirty: true })}
        />
        <p className="text-xs" style={{ color: "var(--mute-2)" }}>
          Importante para integrações futuras (receber ingressos e códigos por WhatsApp/SMS).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label style={{ color: "var(--ink)" }}>Data de Nascimento</Label>
        <Input type="date" {...register("birth_date")} className="w-full" />
        <p className="text-xs" style={{ color: "var(--mute-2)" }}>
          Necessário para eventos com restrição de faixa etária.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label style={{ color: "var(--ink)" }}>CPF</Label>
        <Input
          {...register("cpf")}
          placeholder="000.000.000-00"
          onChange={(e) => setValue("cpf", formatCPF(e.target.value), { shouldDirty: true })}
        />
        {errors.cpf && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            {errors.cpf.message}
          </p>
        )}
        <p className="text-xs" style={{ color: "var(--mute-2)" }}>
          Necessário para meia-entrada e emissão de nota.
        </p>
      </div>

      {errors.root && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {errors.root.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          style={{
            backgroundColor: "var(--pulse)",
            color: "var(--pulse-ink)",
            fontWeight: 600,
            opacity: !isDirty ? 0.5 : 1,
          }}
        >
          {isSubmitting ? "Salvando…" : "Salvar alterações"}
        </Button>
        {saved && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
            <span className="text-sm" style={{ color: "var(--success)" }}>
              Salvo.
            </span>
          </div>
        )}
      </div>
    </form>
  )
}
