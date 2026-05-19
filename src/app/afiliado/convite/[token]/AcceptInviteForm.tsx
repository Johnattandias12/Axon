"use client"

import { useActionState, useTransition } from "react"
import { acceptAffiliateInvite, type AcceptInviteState } from "./actions"
import { Loader2, ArrowRight } from "lucide-react"

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<AcceptInviteState, FormData>(
    acceptAffiliateInvite,
    null
  )
  const [pending, startTransition] = useTransition()

  return (
    <form action={(fd) => startTransition(() => formAction(fd))} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state?.ok === false && (
        <p
          className="rounded-xl border px-3 py-2 text-xs"
          style={{
            borderColor: "var(--danger)",
            backgroundColor: "var(--danger-soft)",
            color: "var(--danger)",
          }}
          role="alert"
        >
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:scale-[1.02] disabled:opacity-60"
        style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Aceitando…
          </>
        ) : (
          <>
            Aceitar convite <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  )
}
