"use client"

import { useActionState, useTransition, useState } from "react"
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react"
import { checkoutDemo, type CheckoutState } from "@/app/carrinho/actions"
import { formatCPF } from "@/lib/utils/validators"

interface Props {
  defaultName?: string
  defaultCpf?: string
}

export function CheckoutForm({ defaultName = "", defaultCpf = "" }: Props) {
  const [state, action] = useActionState<CheckoutState, FormData>(checkoutDemo, null)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(defaultName)
  const [cpf, setCpf] = useState(defaultCpf ? formatCPF(defaultCpf) : "")

  const hasSaved = defaultName.length > 0 && defaultCpf.length > 0

  function submit(fd: FormData) {
    startTransition(() => action(fd))
  }

  return (
    <form action={submit} className="space-y-3">
      {hasSaved && (
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px]"
          style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
        >
          <CheckCircle2 size={11} />
          Seus dados já estão salvos. Editou? Será atualizado no perfil.
        </div>
      )}

      <div>
        <label
          htmlFor="holderName"
          className="mb-1.5 block text-[11px] font-medium"
          style={{ color: "var(--mute)" }}
        >
          Nome do titular
        </label>
        <input
          id="holderName"
          name="holderName"
          required
          minLength={2}
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--pulse)]"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-soft)",
            color: "var(--ink)",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="holderCpf"
          className="mb-1.5 block text-[11px] font-medium"
          style={{ color: "var(--mute)" }}
        >
          CPF
        </label>
        <input
          id="holderCpf"
          name="holderCpf"
          required
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          inputMode="numeric"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--pulse)]"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-soft)",
            color: "var(--ink)",
          }}
        />
      </div>

      {/* Flag pra atualizar profile no checkout */}
      <input type="hidden" name="saveToProfile" value="1" />

      {state?.ok === false && (
        <p
          className="rounded-lg border px-3 py-2 text-[11px]"
          style={{
            borderColor: "var(--danger)",
            backgroundColor: "var(--danger-soft)",
            color: "var(--danger)",
          }}
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:scale-[1.01] disabled:opacity-60"
        style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Finalizando…
          </>
        ) : (
          <>
            <ShieldCheck size={14} />
            Finalizar compra
          </>
        )}
      </button>
    </form>
  )
}
