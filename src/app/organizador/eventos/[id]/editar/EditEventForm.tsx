"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { EventBannerUploader } from "@/components/event/EventBannerUploader"

const schema = z.object({
  title: z.string().min(5, "Título muito curto"),
  description: z.string().optional(),
  category: z.enum(["show", "esporte", "religioso", "curso", "outro"]),
  age_rating: z.string().optional(),
  venue_name: z.string().min(2, "Local obrigatório"),
  address: z.string().optional(),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF com 2 letras"),
  starts_at: z.string().min(1, "Data de início obrigatória"),
  ends_at: z.string().optional(),
  refund_days: z.coerce.number().min(0).max(30).default(7),
})

type FormData = z.infer<typeof schema>

interface Props {
  eventId: string
  organizerId: string
  bannerUrl: string | null
  initial: FormData
}

const categories = [
  { value: "show", label: "Show" },
  { value: "esporte", label: "Esporte" },
  { value: "religioso", label: "Religioso" },
  { value: "curso", label: "Curso" },
  { value: "outro", label: "Outro" },
]

export function EditEventForm({ eventId, organizerId, bannerUrl, initial }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError("")
    setSuccess(false)

    const supabase = createClient()
    const { error: err } = await supabase
      .from("events")
      .update({
        title: data.title,
        description: data.description ?? null,
        category: data.category,
        age_rating: data.age_rating ?? null,
        venue_name: data.venue_name,
        address: data.address ?? null,
        city: data.city,
        state: data.state.toUpperCase(),
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
        cover_policy: { refund_days: data.refund_days, partial_refund_pct: 100 },
      })
      .eq("id", eventId)

    if (err) {
      setError("Erro ao salvar. Tente novamente.")
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    router.refresh()
    router.push(`/organizador/eventos/${eventId}`)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div
        className="space-y-5 rounded-xl border p-5"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Imagem de capa
        </p>
        <EventBannerUploader eventId={eventId} organizerId={organizerId} initialUrl={bannerUrl} />
      </div>

      <div
        className="space-y-5 rounded-xl border p-5"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Informações básicas
        </p>

        <Field label="Título do evento" error={form.formState.errors.title?.message}>
          <Input {...form.register("title")} />
        </Field>

        <Field label="Descrição (opcional)">
          <textarea
            {...form.register("description")}
            rows={3}
            className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: "var(--rule-strong)",
              backgroundColor: "var(--paper-pure)",
              color: "var(--ink)",
            }}
          />
        </Field>

        <Field label="Categoria">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <label key={cat.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={cat.value}
                  {...form.register("category")}
                  className="sr-only"
                />
                <span
                  className="inline-block rounded-lg border px-3 py-1.5 text-sm transition-all"
                  style={{
                    borderColor:
                      form.watch("category") === cat.value ? "var(--pulse)" : "var(--rule)",
                    backgroundColor:
                      form.watch("category") === cat.value ? "var(--pulse)" : "var(--paper-pure)",
                    color:
                      form.watch("category") === cat.value ? "var(--pulse-ink)" : "var(--ink-4)",
                  }}
                >
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Classificação etária (opcional)">
          <Input {...form.register("age_rating")} placeholder='Ex: "Livre", "16+", "18+"' />
        </Field>
      </div>

      <div
        className="space-y-5 rounded-xl border p-5"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Local e data
        </p>

        <Field label="Local do evento" error={form.formState.errors.venue_name?.message}>
          <Input {...form.register("venue_name")} />
        </Field>

        <Field label="Endereço (opcional)">
          <Input {...form.register("address")} placeholder="Rua, número, bairro" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade" error={form.formState.errors.city?.message}>
            <Input {...form.register("city")} />
          </Field>
          <Field label="UF" error={form.formState.errors.state?.message}>
            <Input {...form.register("state")} maxLength={2} className="uppercase" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Início" error={form.formState.errors.starts_at?.message}>
            <Input {...form.register("starts_at")} type="datetime-local" />
          </Field>
          <Field label="Término (opcional)">
            <Input {...form.register("ends_at")} type="datetime-local" />
          </Field>
        </div>
      </div>

      <div
        className="space-y-5 rounded-xl border p-5"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Política de reembolso
        </p>

        <Field label="Dias para reembolso" error={form.formState.errors.refund_days?.message}>
          <Input {...form.register("refund_days")} type="number" min={0} max={30} />
          <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
            Mínimo 7 dias (CDC). Comprador pode pedir reembolso até N dias após a compra.
          </p>
        </Field>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm" style={{ color: "var(--success)" }}>
          Evento salvo com sucesso!
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/organizador/eventos/${eventId}`)}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="flex-1"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)", fontWeight: 600 }}
        >
          {submitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label style={{ color: "var(--ink)" }}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  )
}
