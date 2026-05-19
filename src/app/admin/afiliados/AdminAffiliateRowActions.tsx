"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { approveAffiliate, rejectAffiliate, updateAffiliateCommission } from "./actions"
import { Check, X, Loader2, Percent } from "lucide-react"

interface Props {
  id: string
  status?: "pending" | "active" | "rejected"
  commissionPct: number
}

export function AdminAffiliateRowActions({ id, status = "active", commissionPct }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [pct, setPct] = useState(commissionPct.toString())

  function call<R extends { ok: true; message: string } | { ok: false; error: string }>(
    fn: () => Promise<R>
  ) {
    startTransition(async () => {
      const r = await fn()
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else toast.error(r.error)
    })
  }

  if (status === "pending") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <form action={(fd) => call(() => approveAffiliate(fd))}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-[var(--success-soft)] disabled:opacity-60"
            style={{ borderColor: "var(--success)", color: "var(--success)" }}
          >
            {pending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            Aprovar
          </button>
        </form>
        <form action={(fd) => call(() => rejectAffiliate(fd))}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-[var(--danger-soft)] disabled:opacity-60"
            style={{ borderColor: "var(--rule)", color: "var(--danger)" }}
          >
            <X size={11} />
            Rejeitar
          </button>
        </form>
      </div>
    )
  }

  if (status === "rejected") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
        style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}
      >
        Rejeitado
      </span>
    )
  }

  // Active — editar %
  if (editing) {
    return (
      <form
        action={(fd) =>
          call(async () => {
            const r = await updateAffiliateCommission(fd)
            if (r.ok) setEditing(false)
            return r
          })
        }
        className="flex items-center gap-1"
      >
        <input type="hidden" name="id" value={id} />
        <input
          name="commissionPct"
          type="number"
          step="0.5"
          min="0.5"
          max="50"
          value={pct}
          onChange={(e) => setPct(e.target.value)}
          className="h-7 w-16 rounded-md border px-2 font-mono text-xs outline-none focus:border-[var(--pulse)]"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-soft)",
            color: "var(--ink)",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold disabled:opacity-60"
          style={{ borderColor: "var(--success)", color: "var(--success)" }}
        >
          {pending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false)
            setPct(commissionPct.toString())
          }}
          className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold"
          style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
        >
          <X size={11} />
        </button>
      </form>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-black/5"
      style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
    >
      <Percent size={11} />
      Editar %
    </button>
  )
}

export function AffiliateStatusBadge({ status }: { status?: "pending" | "active" | "rejected" }) {
  const cfg = {
    active: { label: "Ativo", bg: "var(--success-soft)", color: "var(--success)" },
    pending: { label: "Em análise", bg: "var(--warning-soft)", color: "var(--warning)" },
    rejected: { label: "Rejeitado", bg: "var(--danger-soft)", color: "var(--danger)" },
  } as const
  const s = cfg[status ?? "active"]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}
