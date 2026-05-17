"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Check, DollarSign, Loader2 } from "lucide-react"
import { adminMarkReferralPaid, adminPayAllPending } from "./actions"

interface Props {
  referralId?: string
  affiliateId?: string
  pendingCount?: number
  pendingTotalLabel?: string
}

/**
 * Botão de ação admin: marca 1 referral OU paga todas pendentes de um afiliado.
 * Decisão por presença das props.
 */
export function AdminAffiliateActions({
  referralId,
  affiliateId,
  pendingCount,
  pendingTotalLabel,
}: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function run(fn: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    startTransition(async () => {
      const r = await fn()
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else {
        toast.error(r.error)
      }
    })
  }

  if (referralId) {
    return (
      <button
        type="button"
        onClick={() => run(() => adminMarkReferralPaid(referralId))}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-black/5 disabled:opacity-60"
        style={{ borderColor: "var(--success)", color: "var(--success)" }}
      >
        {pending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
        Marcar pago
      </button>
    )
  }

  if (affiliateId) {
    return (
      <button
        type="button"
        onClick={() => run(() => adminPayAllPending(affiliateId))}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-transform hover:scale-[1.02] disabled:opacity-60"
        style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
      >
        {pending ? <Loader2 size={11} className="animate-spin" /> : <DollarSign size={11} />}
        Pagar {pendingCount ?? ""} · {pendingTotalLabel ?? ""}
      </button>
    )
  }

  return null
}
