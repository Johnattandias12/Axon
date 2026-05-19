"use client"

import { useActionState, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createAffiliateInvite, deleteAffiliateInvite, type CreateInviteState } from "./actions"
import {
  Send,
  Copy,
  Trash2,
  Mail,
  Percent,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Clock,
} from "lucide-react"

export interface InviteRow {
  id: string
  email: string
  token: string
  commission_pct: number
  note: string | null
  created_at: string
  expires_at: string
  used_at: string | null
  inviteUrl: string
}

export function AdminInvitePanel({
  pendingInvites,
  usedCount,
}: {
  pendingInvites: InviteRow[]
  usedCount: number
}) {
  const router = useRouter()
  const [state, formAction] = useActionState<CreateInviteState, FormData>(
    createAffiliateInvite,
    null
  )
  const [pending, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)

  function submit(fd: FormData) {
    startTransition(() => formAction(fd))
  }

  async function copy(text: string, what = "Link copiado.") {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(what)
    } catch {
      toast.error("Não foi possível copiar.")
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Send size={14} style={{ color: "var(--pulse-deep)" }} />
          <h2
            className="text-sm font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Convites ({pendingInvites.length} pendentes
            {usedCount > 0 ? ` · ${usedCount} usados` : ""})
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-transform hover:scale-[1.03]"
          style={{
            backgroundColor: showNew ? "var(--paper-soft)" : "var(--pulse)",
            color: showNew ? "var(--mute)" : "var(--pulse-ink)",
          }}
        >
          {showNew ? "Fechar" : "+ Convidar afiliado"}
        </button>
      </div>

      {showNew && (
        <form
          action={submit}
          className="space-y-3 rounded-2xl border p-4 sm:p-5"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
            <div className="space-y-1.5">
              <label
                htmlFor="invite-email"
                className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--mute)" }}
              >
                <Mail size={11} />
                E-mail do convidado
              </label>
              <input
                id="invite-email"
                name="email"
                type="email"
                inputMode="email"
                required
                placeholder="influencer@exemplo.com"
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-[var(--pulse)]"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--paper-soft)",
                  color: "var(--ink)",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="invite-pct"
                className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--mute)" }}
              >
                <Percent size={11} />
                Comissão
              </label>
              <input
                id="invite-pct"
                name="commissionPct"
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                defaultValue="5"
                required
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-[var(--pulse)]"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--paper-soft)",
                  color: "var(--ink)",
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="invite-note"
              className="text-[11px] font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Observação (opcional)
            </label>
            <textarea
              id="invite-note"
              name="note"
              maxLength={280}
              rows={2}
              placeholder="Ex.: parceria divulgação show de junho"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--pulse)]"
              style={{
                borderColor: "var(--rule)",
                backgroundColor: "var(--paper-soft)",
                color: "var(--ink)",
              }}
            />
          </div>

          {state?.ok === false && (
            <p
              className="rounded-lg border px-3 py-2 text-xs"
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

          {state?.ok && (
            <div
              className="space-y-2 rounded-lg border p-3 text-xs"
              style={{
                borderColor: "var(--success)",
                backgroundColor: "var(--success-soft)",
              }}
            >
              <p
                className="flex items-center gap-1.5 font-semibold"
                style={{ color: "var(--success)" }}
              >
                <CheckCircle2 size={13} />
                Convite criado. Compartilhe o link abaixo:
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 truncate rounded-md px-2 py-1.5 font-mono text-[11px]"
                  style={{ backgroundColor: "var(--paper-pure)", color: "var(--ink-4)" }}
                >
                  {state.inviteUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copy(state.inviteUrl)}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-colors hover:bg-black/5"
                  style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
                >
                  <Copy size={11} />
                  Copiar
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-transform hover:scale-[1.02] disabled:opacity-60"
            style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {pending ? "Gerando…" : "Gerar convite"}
          </button>
        </form>
      )}

      {pendingInvites.length > 0 && (
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          {pendingInvites.map((inv) => {
            const expired = new Date(inv.expires_at) < new Date()
            return (
              <div
                key={inv.id}
                className="flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "var(--rule)" }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className="truncate font-mono text-xs font-semibold"
                      style={{ color: "var(--ink)" }}
                    >
                      {inv.email}
                    </p>
                    <span
                      className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold"
                      style={{
                        backgroundColor: "var(--pulse-soft)",
                        color: "var(--pulse-deep)",
                      }}
                    >
                      {inv.commission_pct}%
                    </span>
                    {expired && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase"
                        style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}
                      >
                        Expirado
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-0.5 inline-flex items-center gap-1 text-[10px]"
                    style={{ color: "var(--mute)" }}
                  >
                    <Clock size={10} />
                    Expira{" "}
                    {new Date(inv.expires_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {inv.note && (
                    <p className="mt-1 text-[11px] italic" style={{ color: "var(--mute)" }}>
                      "{inv.note}"
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={inv.inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-black/5"
                    style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
                  >
                    <ExternalLink size={11} />
                    Abrir
                  </a>
                  <button
                    type="button"
                    onClick={() => copy(inv.inviteUrl)}
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-black/5"
                    style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
                  >
                    <Copy size={11} />
                    Copiar
                  </button>
                  <form
                    action={(fd) =>
                      startTransition(async () => {
                        const r = await deleteAffiliateInvite(fd)
                        if (r.ok) {
                          toast.success(r.message)
                          router.refresh()
                        } else toast.error(r.error)
                      })
                    }
                  >
                    <input type="hidden" name="id" value={inv.id} />
                    <button
                      type="submit"
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[var(--danger-soft)] disabled:opacity-60"
                      style={{ borderColor: "var(--rule)", color: "var(--danger)" }}
                    >
                      <Trash2 size={11} />
                      Apagar
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
