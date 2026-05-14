"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { UserPlus, Trash2 } from "lucide-react"

type Validator = {
  user_id: string
  gate: string | null
  added_at: string
  profiles: { full_name: string | null; role: string } | null
}

interface Props {
  eventId: string
  initialValidators: Validator[]
}

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  gate: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function TeamManager({ eventId, initialValidators }: Props) {
  const [validators, setValidators] = useState<Validator[]>(
    // Ignorar tipo que pode ser array por causa do join do Supabase
    initialValidators.map((v) => ({
      ...v,
      profiles: Array.isArray(v.profiles) ? (v.profiles[0] ?? null) : v.profiles,
    }))
  )
  const [adding, setAdding] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError("")
    setSuccess("")

    const res = await fetch("/api/organizador/convidar-validador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, email: data.email, gate: data.gate ?? null }),
    })

    const result = (await res.json()) as { error?: string; userId?: string; name?: string }

    if (!res.ok || result.error) {
      setError(result.error ?? "Erro ao convidar. Tente novamente.")
      return
    }

    setValidators((prev) => [
      ...prev,
      {
        user_id: result.userId ?? "",
        gate: data.gate ?? null,
        added_at: new Date().toISOString(),
        profiles: { full_name: result.name ?? data.email, role: "validator" },
      },
    ])

    setSuccess(`${data.email} convidado com sucesso.`)
    reset()
    setAdding(false)
  }

  const remove = async (userId: string) => {
    const supabase = createClient()
    await supabase.from("event_validators").delete().eq("event_id", eventId).eq("user_id", userId)
    setValidators((prev) => prev.filter((v) => v.user_id !== userId))
  }

  return (
    <div className="space-y-4">
      {success && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}
        >
          {success}
        </p>
      )}

      {validators.length === 0 ? (
        <div
          className="rounded-xl border border-dashed p-8 text-center"
          style={{ borderColor: "var(--rule)" }}
        >
          <p className="text-sm" style={{ color: "var(--mute)" }}>
            Nenhum validador ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {validators.map((v) => (
            <div
              key={v.user_id}
              className="flex items-center gap-3 rounded-xl border p-3"
              style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
              >
                {(v.profiles?.full_name ?? "V")[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                  {v.profiles?.full_name ?? "Pendente"}
                </p>
                {v.gate && (
                  <p className="text-xs" style={{ color: "var(--mute)" }}>
                    Portão: {v.gate}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(v.user_id)}
                className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
                style={{ color: "var(--danger)" }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 rounded-xl border p-4"
          style={{ borderColor: "var(--pulse)", backgroundColor: "var(--paper-pure)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Convidar validador
          </p>
          <div className="space-y-1.5">
            <Label style={{ color: "var(--ink)" }}>E-mail</Label>
            <Input
              {...register("email")}
              type="email"
              placeholder="validador@email.com"
              autoFocus
            />
            {errors.email && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: "var(--ink)" }}>Portão (opcional)</Label>
            <Input {...register("gate")} placeholder='Ex: "Portão A"' />
          </div>
          {error && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAdding(false)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              style={{
                backgroundColor: "var(--pulse)",
                color: "var(--pulse-ink)",
                fontWeight: 600,
              }}
            >
              {isSubmitting ? "Convidando…" : "Convidar"}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          onClick={() => setAdding(true)}
          className="gap-2"
          style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
        >
          <UserPlus size={15} /> Convidar validador
        </Button>
      )}
    </div>
  )
}
