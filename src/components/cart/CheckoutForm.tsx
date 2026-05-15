"use client"

import { useActionState, useTransition } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { checkoutDemo, type CheckoutState } from "@/app/carrinho/actions"

export function CheckoutForm() {
  const [state, action] = useActionState<CheckoutState, FormData>(checkoutDemo, null)
  const [pending, startTransition] = useTransition()

  function submit(fd: FormData) {
    startTransition(() => action(fd))
  }

  return (
    <form action={submit} className="space-y-3">
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
          className="w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none focus:border-[var(--pulse)]"
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
          className="w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none focus:border-[var(--pulse)]"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-soft)",
            color: "var(--ink)",
          }}
        />
      </div>

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
