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
import { generateUniqueSlug } from "@/lib/utils"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { triggerEventCreatedEmailAction } from "../[id]/actions"

const step1Schema = z.object({
  title: z.string().min(5, "Título muito curto (mín. 5 caracteres)").max(100),
  description: z.string().optional(),
  category: z.enum(["show", "esporte", "religioso", "curso", "outro"]),
  age_rating: z.string().optional(),
})

const step2Schema = z.object({
  venue_name: z.string().min(2, "Local obrigatório"),
  address: z.string().optional(),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF com 2 letras"),
  starts_at: z.string().min(1, "Data de início obrigatória"),
  ends_at: z.string().optional(),
})

const step3Schema = z.object({
  refund_days: z.coerce.number().min(0).max(30).default(7),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>

interface Props {
  organizerId: string
}

export function EventWizard({ organizerId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [s1, setS1] = useState<Step1 | null>(null)
  const [s2, setS2] = useState<Step2 | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const form1 = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: { category: "show" },
  })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: { refund_days: 7 },
  })

  const onStep1 = (data: Step1) => {
    setS1(data)
    setStep(2)
  }
  const onStep2 = (data: Step2) => {
    setS2(data)
    setStep(3)
  }

  const onStep3 = async (data: Step3) => {
    if (!s1 || !s2) return
    setSubmitting(true)
    setError("")

    const supabase = createClient()
    const slug = generateUniqueSlug(s1.title)

    const { data: event, error: err } = await supabase
      .from("events")
      .insert({
        organizer_id: organizerId,
        slug,
        title: s1.title,
        description: s1.description ?? null,
        category: s1.category,
        age_rating: s1.age_rating ?? null,
        venue_name: s2.venue_name,
        address: s2.address ?? null,
        city: s2.city,
        state: s2.state.toUpperCase(),
        starts_at: new Date(s2.starts_at).toISOString(),
        ends_at: s2.ends_at ? new Date(s2.ends_at).toISOString() : null,
        cover_policy: { refund_days: data.refund_days, partial_refund_pct: 100 },
        status: "draft",
      })
      .select("id")
      .single()

    if (err || !event) {
      setError("Erro ao criar evento. Tente novamente.")
      setSubmitting(false)
      return
    }

    try {
      await triggerEventCreatedEmailAction(event.id)
    } catch (e) {
      console.error("Erro ao enviar e-mail de criação de evento:", e)
    }

    router.push(`/organizador/eventos/${event.id}/lotes`)
  }

  const categories = [
    { value: "show", label: "Show" },
    { value: "esporte", label: "Esporte" },
    { value: "religioso", label: "Religioso" },
    { value: "curso", label: "Curso" },
    { value: "outro", label: "Outro" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: n <= step ? "var(--pulse)" : "var(--rule)" }}
            />
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--mute)" }}>
          Etapa {step} de 3 — {["Básico", "Local e data", "Política"][step - 1]}
        </p>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
          <Field label="Título do evento" error={form1.formState.errors.title?.message}>
            <Input
              {...form1.register("title")}
              placeholder="Ex: Carnaxelita 2025 · Currais Novos"
              autoFocus
            />
          </Field>

          <Field label="Descrição (opcional)">
            <textarea
              {...form1.register("description")}
              placeholder="Conte sobre o evento…"
              rows={4}
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
                    {...form1.register("category")}
                    className="sr-only"
                  />
                  <span
                    className="inline-block rounded-lg border px-3 py-1.5 text-sm transition-all"
                    style={{
                      borderColor:
                        form1.watch("category") === cat.value ? "var(--pulse)" : "var(--rule)",
                      backgroundColor:
                        form1.watch("category") === cat.value
                          ? "var(--pulse)"
                          : "var(--paper-pure)",
                      color:
                        form1.watch("category") === cat.value ? "var(--pulse-ink)" : "var(--ink-4)",
                    }}
                  >
                    {cat.label}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Classificação etária (opcional)">
            <Input {...form1.register("age_rating")} placeholder='Ex: "Livre", "16+", "18+"' />
          </Field>

          <Button
            type="submit"
            className="w-full gap-2"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)", fontWeight: 600 }}
          >
            Continuar <ArrowRight size={16} />
          </Button>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
          <Field label="Local do evento" error={form2.formState.errors.venue_name?.message}>
            <Input {...form2.register("venue_name")} placeholder="Ex: Arena RN" autoFocus />
          </Field>

          <Field label="Endereço (opcional)">
            <Input {...form2.register("address")} placeholder="Rua, número, bairro" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade" error={form2.formState.errors.city?.message}>
              <Input {...form2.register("city")} placeholder="Currais Novos" />
            </Field>
            <Field label="UF" error={form2.formState.errors.state?.message}>
              <Input
                {...form2.register("state")}
                placeholder="RN"
                maxLength={2}
                className="uppercase"
              />
            </Field>
          </div>

          <Field label="Início" error={form2.formState.errors.starts_at?.message}>
            <Input {...form2.register("starts_at")} type="datetime-local" />
          </Field>

          <Field label="Término (opcional)">
            <Input {...form2.register("ends_at")} type="datetime-local" />
          </Field>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              <ArrowLeft size={15} className="mr-1" /> Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              style={{
                backgroundColor: "var(--pulse)",
                color: "var(--pulse-ink)",
                fontWeight: 600,
              }}
            >
              Continuar <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-4">
          <Field label="Dias para reembolso" error={form3.formState.errors.refund_days?.message}>
            <Input
              {...form3.register("refund_days")}
              type="number"
              min={0}
              max={30}
              placeholder="7"
            />
            <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
              Comprador pode pedir reembolso até N dias após a compra (CDC mínimo: 7).
            </p>
          </Field>

          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
              <ArrowLeft size={15} className="mr-1" /> Voltar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 gap-2"
              style={{
                backgroundColor: "var(--pulse)",
                color: "var(--pulse-ink)",
                fontWeight: 600,
              }}
            >
              {submitting ? "Criando…" : "Criar evento"} {!submitting && <ArrowRight size={16} />}
            </Button>
          </div>
        </form>
      )}
    </div>
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
