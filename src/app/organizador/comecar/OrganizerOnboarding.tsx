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
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ, formatPhone } from "@/lib/utils"
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"

const step1Schema = z.object({
  kind: z.enum(["pf", "pj"]),
})

const step2Schema = z
  .object({
    kind: z.enum(["pf", "pj"]),
    legal_name: z.string().min(3, "Nome obrigatório"),
    trade_name: z.string().optional(),
    cnpj_or_cpf: z.string().min(11, "Documento obrigatório"),
    contact_phone: z.string().min(10, "Telefone obrigatório"),
  })
  .superRefine((data, ctx) => {
    const doc = data.cnpj_or_cpf.replace(/\D/g, "")
    if (data.kind === "pf" && !validateCPF(doc)) {
      ctx.addIssue({ code: "custom", path: ["cnpj_or_cpf"], message: "CPF inválido" })
    }
    if (data.kind === "pj" && !validateCNPJ(doc)) {
      ctx.addIssue({ code: "custom", path: ["cnpj_or_cpf"], message: "CNPJ inválido" })
    }
  })

const step3Schema = z.object({
  bank: z.string().min(1, "Banco obrigatório"),
  agency: z.string().min(1, "Agência obrigatória"),
  account: z.string().min(1, "Conta obrigatória"),
  account_type: z.enum(["corrente", "poupanca"]),
  holder: z.string().min(3, "Titular obrigatório"),
  holder_doc: z.string().min(11, "CPF/CNPJ do titular obrigatório"),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

interface Props {
  userId: string
}

export function OrganizerOnboarding({ userId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { kind: "pj" },
  })

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { kind: step1Data?.kind ?? "pj" },
  })

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { account_type: "corrente" },
  })

  const onStep1 = (data: Step1Data) => {
    setStep1Data(data)
    step2Form.setValue("kind", data.kind)
    setStep(2)
  }

  const onStep2 = (data: Step2Data) => {
    setStep2Data(data)
    setStep(3)
  }

  const onStep3 = (data: Step3Data) => {
    if (!termsAccepted) {
      setError("Aceite os termos para continuar.")
      return
    }
    handleSubmit(data)
  }

  const handleSubmit = async (bankData: Step3Data) => {
    if (!step1Data || !step2Data) return
    setSubmitting(true)
    setError("")

    const supabase = createClient()

    const { error: insertErr } = await supabase.from("organizers").insert({
      user_id: userId,
      kind: step1Data.kind,
      legal_name: step2Data.legal_name,
      trade_name: step2Data.trade_name ?? null,
      cnpj_or_cpf: step2Data.cnpj_or_cpf.replace(/\D/g, ""),
      contact_phone: step2Data.contact_phone.replace(/\D/g, ""),
      bank_account: {
        bank: bankData.bank,
        agency: bankData.agency,
        account: bankData.account,
        type: bankData.account_type,
        holder: bankData.holder,
        holder_doc: bankData.holder_doc.replace(/\D/g, ""),
      },
      kyc_status: "pending",
    })

    if (insertErr) {
      setError("Erro ao salvar. Tente novamente.")
      setSubmitting(false)
      return
    }

    // Atualizar role no profile
    await supabase.from("profiles").update({ role: "organizer" }).eq("id", userId)

    setStep(5)
    setTimeout(() => router.push("/organizador"), 2000)
  }

  const totalSteps = 4

  if (step === 5) {
    return (
      <div className="space-y-4 py-12 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--success-soft)" }}
        >
          <CheckCircle2 size={26} style={{ color: "var(--success)" }} />
        </div>
        <div>
          <p
            className="text-xl font-semibold"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Conta configurada.
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
            Redirecionando para o painel…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: "var(--mute)" }}>
            Etapa {step} de {totalSteps}
          </p>
          <p className="text-xs" style={{ color: "var(--mute-2)" }}>
            {["Tipo", "Dados", "Banco", "Termos"][step - 1]}
          </p>
        </div>
        <div
          className="h-1 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--rule)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(step / totalSteps) * 100}%`,
              backgroundColor: "var(--pulse)",
            }}
          />
        </div>
      </div>

      {/* Step 1 — Tipo */}
      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(onStep1)} className="space-y-6">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
            >
              Tipo de conta
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
              Como você vai emitir eventos?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["pj", "pf"] as const).map((kind) => (
              <label
                key={kind}
                className="cursor-pointer rounded-xl border-2 p-4 transition-all"
                style={{
                  borderColor: step1Form.watch("kind") === kind ? "var(--pulse)" : "var(--rule)",
                  backgroundColor: "var(--paper-pure)",
                }}
              >
                <input
                  type="radio"
                  value={kind}
                  {...step1Form.register("kind")}
                  className="sr-only"
                />
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  {kind === "pj" ? "Pessoa Jurídica" : "Pessoa Física"}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
                  {kind === "pj" ? "CNPJ · empresa ou MEI" : "CPF · produtor individual"}
                </p>
              </label>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)", fontWeight: 600 }}
          >
            Continuar <ArrowRight size={16} />
          </Button>
        </form>
      )}

      {/* Step 2 — Dados */}
      {step === 2 && step1Data && (
        <form onSubmit={step2Form.handleSubmit(onStep2)} className="space-y-4">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
            >
              Seus dados
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
              {step1Data.kind === "pj" ? "Dados da empresa" : "Dados pessoais"}
            </p>
          </div>

          <Field
            label={step1Data.kind === "pj" ? "Razão social" : "Nome completo"}
            error={step2Form.formState.errors.legal_name?.message}
          >
            <Input {...step2Form.register("legal_name")} placeholder="Nome legal" />
          </Field>

          <Field label="Nome fantasia (opcional)">
            <Input {...step2Form.register("trade_name")} placeholder="Como quer ser exibido" />
          </Field>

          <Field
            label={step1Data.kind === "pj" ? "CNPJ" : "CPF"}
            error={step2Form.formState.errors.cnpj_or_cpf?.message}
          >
            <Input
              {...step2Form.register("cnpj_or_cpf")}
              placeholder={step1Data.kind === "pj" ? "00.000.000/0001-00" : "000.000.000-00"}
              onChange={(e) => {
                const fmt =
                  step1Data.kind === "pj" ? formatCNPJ(e.target.value) : formatCPF(e.target.value)
                step2Form.setValue("cnpj_or_cpf", fmt, { shouldValidate: false })
              }}
            />
          </Field>

          <Field label="Telefone" error={step2Form.formState.errors.contact_phone?.message}>
            <Input
              {...step2Form.register("contact_phone")}
              placeholder="(84) 99999-9999"
              onChange={(e) => {
                step2Form.setValue("contact_phone", formatPhone(e.target.value), {
                  shouldValidate: false,
                })
              }}
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={15} /> Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-1"
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

      {/* Step 3 — Dados bancários */}
      {step === 3 && (
        <form onSubmit={step3Form.handleSubmit(onStep3)} className="space-y-4">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
            >
              Dados bancários
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
              Para receber suas vendas.
            </p>
          </div>

          <Field label="Banco" error={step3Form.formState.errors.bank?.message}>
            <Input {...step3Form.register("bank")} placeholder="Ex: Itaú, Nubank, BB" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Agência" error={step3Form.formState.errors.agency?.message}>
              <Input {...step3Form.register("agency")} placeholder="0001" />
            </Field>
            <Field label="Conta" error={step3Form.formState.errors.account?.message}>
              <Input {...step3Form.register("account")} placeholder="00000-0" />
            </Field>
          </div>

          <Field label="Tipo de conta">
            <div className="flex gap-3">
              {(["corrente", "poupanca"] as const).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value={t} {...step3Form.register("account_type")} />
                  <span className="text-sm capitalize" style={{ color: "var(--ink)" }}>
                    {t === "corrente" ? "Corrente" : "Poupança"}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Titular da conta" error={step3Form.formState.errors.holder?.message}>
            <Input {...step3Form.register("holder")} placeholder="Nome do titular" />
          </Field>

          <Field label="CPF/CNPJ do titular" error={step3Form.formState.errors.holder_doc?.message}>
            <Input {...step3Form.register("holder_doc")} placeholder="000.000.000-00" />
          </Field>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => setStep(2)}
            >
              <ArrowLeft size={15} /> Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-1"
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

      {/* Step 4 — Termos */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
            >
              Termos do organizador
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
              Leia e aceite antes de publicar eventos.
            </p>
          </div>

          <div
            className="max-h-56 space-y-3 overflow-y-auto rounded-xl border p-4 text-sm"
            style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
          >
            <p className="font-semibold" style={{ color: "var(--ink)" }}>
              Termos do organizador AXON
            </p>

            {/* Taxa em destaque */}
            <div
              className="rounded-lg border p-3 space-y-2"
              style={{ borderColor: "var(--pulse)", backgroundColor: "rgba(200,255,0,0.05)" }}
            >
              <p className="font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--pulse)" }}>
                Estrutura de taxas
              </p>
              <ul className="space-y-1 text-xs" style={{ color: "var(--ink-3)" }}>
                <li><strong style={{ color: "var(--ink)" }}>Pix:</strong> R$ 1,00 por pedido (comprador) · recebimento instantâneo</li>
                <li><strong style={{ color: "var(--ink)" }}>Cartão 1x:</strong> +5% (comprador) · recebimento D+17</li>
                <li><strong style={{ color: "var(--ink)" }}>Cartão 2–12x:</strong> +8% a +18% (comprador) · recebimento D+17</li>
                <li><strong style={{ color: "var(--ink)" }}>Comissão AXON:</strong> 9% sobre o valor do ingresso</li>
              </ul>
            </div>

            <p>
              Ao criar eventos na plataforma AXON, você concorda em ser o responsável exclusivo pela
              qualidade, segurança e realização do evento. A AXON atua como marketplace intermediário.
            </p>
            <p>
              <strong style={{ color: "var(--ink)" }}>Repasse:</strong> via Pix disponível em D+1 após
              confirmação do pagamento; via cartão em D+17 (2 dias após o recebimento do gateway).
              A comissão AXON de 9% é retida automaticamente no split — você já recebe o valor líquido.
            </p>
            <p>
              <strong style={{ color: "var(--ink)" }}>Cancelamentos:</strong> em caso de cancelamento
              do evento, reembolso integral a todos os compradores dentro do prazo legal (CDC).
            </p>
            <p>
              <strong style={{ color: "var(--ink)" }}>Meia-entrada:</strong> 40% dos ingressos devem
              ser reservados para meia-entrada, conforme Lei 12.933/2013.
            </p>
            <p>
              <strong style={{ color: "var(--ink)" }}>LGPD:</strong> dados dos compradores são tratados
              conforme a Política de Privacidade AXON. Vedado uso para outros fins.
            </p>
          </div>


          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked)
                setError("")
              }}
              className="mt-0.5"
            />
            <span className="text-sm" style={{ color: "var(--ink)" }}>
              Li e aceito os termos de uso do organizador AXON.
            </span>
          </label>

          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => setStep(3)}
            >
              <ArrowLeft size={15} /> Voltar
            </Button>
            <Button
              type="button"
              className="flex-1 gap-1"
              disabled={submitting}
              onClick={() => {
                if (!termsAccepted) {
                  setError("Aceite os termos para continuar.")
                  return
                }
                step3Form.handleSubmit(onStep3)()
              }}
              style={{
                backgroundColor: "var(--pulse)",
                color: "var(--pulse-ink)",
                fontWeight: 600,
              }}
            >
              {submitting ? "Criando conta…" : "Confirmar"}{" "}
              {!submitting && <ArrowRight size={16} />}
            </Button>
          </div>
        </div>
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
