"use client"

import { useActionState, useTransition, useState } from "react"
import { Loader2, Check } from "lucide-react"
import { claimTransfer, type ClaimResult } from "./actions"
import { formatCPF } from "@/lib/utils/validators"

export function ClaimForm({ token }: { token: string }) {
  const [state, action] = useActionState<ClaimResult, FormData>(claimTransfer, null)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [cpf, setCpf] = useState("")

  function submit(fd: FormData) {
    startTransition(() => action(fd))
  }

  return (
    <form
      action={submit}
      className="overflow-hidden rounded-2xl border p-5"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <input type="hidden" name="token" value={token} />

      <div className="space-y-3">
        <div>
          <label
            htmlFor="holderName"
            className="mb-1.5 block text-[11px] font-medium"
            style={{ color: "var(--mute)" }}
          >
            Seu nome
          </label>
          <input
            id="holderName"
            name="holderName"
            required
            minLength={2}
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            Seu CPF
          </label>
          <input
            id="holderCpf"
            name="holderCpf"
            required
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            inputMode="numeric"
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
              Reivindicando
            </>
          ) : (
            <>
              <Check size={14} />
              Pegar pra mim
            </>
          )}
        </button>
      </div>
    </form>
  )
}
