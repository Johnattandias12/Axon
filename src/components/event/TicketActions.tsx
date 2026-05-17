"use client"

import { useState, useTransition } from "react"
import { Send, RotateCcw, AlertTriangle, Loader2, Copy, Check, X, Mail } from "lucide-react"
import {
  transferTicket,
  cancelTransfer,
  requestRefund,
  cancelRefundRequest,
  type TicketActionResult,
} from "@/app/minha-conta/ingressos/[orderId]/actions"

interface Props {
  ticketId: string
  status: string
  hasTransferToken: boolean
  hasRefundRequest: boolean
}

export function TicketActions({ ticketId, status, hasTransferToken, hasRefundRequest }: Props) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<TicketActionResult | null>(null)
  const [transferUrl, setTransferUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showRefundReason, setShowRefundReason] = useState(false)
  const [reason, setReason] = useState("")
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")

  function fd(extra?: Record<string, string>) {
    const f = new FormData()
    f.set("ticketId", ticketId)
    if (extra) Object.entries(extra).forEach(([k, v]) => f.set(k, v))
    return f
  }

  function runTransfer(email?: string) {
    setResult(null)
    setTransferUrl(null)
    startTransition(async () => {
      const r = await transferTicket(null, fd({ recipientEmail: email ?? "" }))
      setResult(r)
      if (r.ok && r.transferUrl) {
        setTransferUrl(r.transferUrl)
        setShowTransferForm(false)
      }
    })
  }

  function runCancelTransfer() {
    setResult(null)
    startTransition(async () => {
      const r = await cancelTransfer(null, fd())
      setResult(r)
      if (r.ok) setTransferUrl(null)
    })
  }

  function runRefund() {
    setResult(null)
    setShowRefundReason(false)
    startTransition(async () => {
      const r = await requestRefund(null, fd({ reason }))
      setResult(r)
    })
  }

  function runCancelRefund() {
    setResult(null)
    startTransition(async () => {
      const r = await cancelRefundRequest(null, fd())
      setResult(r)
    })
  }

  function copyUrl() {
    if (!transferUrl) return
    navigator.clipboard.writeText(transferUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  // ─── Estados visíveis ─────────────────────────
  if (status === "used") {
    return (
      <p className="text-[11px]" style={{ color: "var(--mute)" }}>
        Ingresso já utilizado. Não dá pra transferir ou pedir reembolso.
      </p>
    )
  }
  if (status === "refunded") {
    return (
      <p className="text-[11px]" style={{ color: "var(--mute)" }}>
        Reembolso processado.
      </p>
    )
  }
  if (status === "cancelled") {
    return (
      <p className="text-[11px]" style={{ color: "var(--mute)" }}>
        Ingresso cancelado.
      </p>
    )
  }

  // Pausado: ou transferência ou reembolso
  if (status === "paused" && hasTransferToken) {
    return (
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]"
          style={{ backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}
        >
          <Send size={11} />
          Em transferência. Compartilha o link com quem vai pegar.
        </div>
        {transferUrl && (
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={transferUrl}
              className="flex-1 truncate rounded-lg border px-3 py-2 font-mono text-[11px]"
              style={{
                borderColor: "var(--rule)",
                backgroundColor: "var(--paper-soft)",
                color: "var(--ink)",
              }}
            />
            <button
              type="button"
              onClick={copyUrl}
              className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
              aria-label="Copiar"
            >
              {copied ? (
                <Check size={13} style={{ color: "var(--success)" }} />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={runCancelTransfer}
          disabled={pending}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors hover:bg-black/5 disabled:opacity-60"
          style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
        >
          {pending ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
          Cancelar transferência
        </button>
      </div>
    )
  }

  if (status === "paused" && hasRefundRequest) {
    return (
      <div className="space-y-2">
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 text-[11px]"
          style={{ backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}
        >
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          <span>
            Pedido de reembolso em análise. O organizador vai te procurar. Ingresso pausado até lá.
          </span>
        </div>
        <button
          type="button"
          onClick={runCancelRefund}
          disabled={pending}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors hover:bg-black/5 disabled:opacity-60"
          style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
        >
          {pending ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
          Desistir e voltar a usar
        </button>
      </div>
    )
  }

  // Status valid: oferece os 2 botões
  return (
    <div className="space-y-2">
      {showRefundReason ? (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Conta o que aconteceu (opcional)"
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-[var(--pulse)]"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-soft)",
              color: "var(--ink)",
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRefundReason(false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold"
              style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
            >
              <X size={11} />
              Voltar
            </button>
            <button
              type="button"
              onClick={runRefund}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold disabled:opacity-60"
              style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
            >
              {pending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <AlertTriangle size={11} />
              )}
              Confirmar pedido
            </button>
          </div>
        </div>
      ) : showTransferForm ? (
        <div className="space-y-2">
          <p
            className="text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Mandar pra alguém
          </p>
          <div className="flex items-center gap-2">
            <Mail size={12} style={{ color: "var(--mute)" }} />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="email@exemplo.com (opcional)"
              className="flex-1 rounded-lg border px-3 py-2 text-xs outline-none focus:border-[var(--pulse)]"
              style={{
                borderColor: "var(--rule)",
                backgroundColor: "var(--paper-soft)",
                color: "var(--ink)",
              }}
            />
          </div>
          <p className="text-[10px]" style={{ color: "var(--mute-2)" }}>
            Se informar email, mandamos o link de aceite direto. Senão você copia e manda você mesmo
            (WhatsApp, Telegram, etc).
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowTransferForm(false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold"
              style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
            >
              <X size={11} />
              Voltar
            </button>
            <button
              type="button"
              onClick={() => runTransfer(recipientEmail || undefined)}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold disabled:opacity-60"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              {pending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
              {recipientEmail ? "Enviar e gerar link" : "Gerar link"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setShowTransferForm(true)
              setResult(null)
            }}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-transform hover:scale-[1.02] disabled:opacity-60"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            {pending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            Transferir
          </button>
          <button
            type="button"
            onClick={() => setShowRefundReason(true)}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors hover:bg-black/5 disabled:opacity-60"
            style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
          >
            <AlertTriangle size={11} />
            Pedir reembolso
          </button>
        </div>
      )}

      {result && !result.ok && (
        <p
          className="rounded-lg border px-2.5 py-1.5 text-[10px]"
          style={{
            borderColor: "var(--danger)",
            backgroundColor: "var(--danger-soft)",
            color: "var(--danger)",
          }}
        >
          {result.error}
        </p>
      )}
      {result && result.ok && result.message && !transferUrl && (
        <p
          className="rounded-lg border px-2.5 py-1.5 text-[10px]"
          style={{
            borderColor: "var(--success)",
            backgroundColor: "var(--success-soft)",
            color: "var(--success)",
          }}
        >
          {result.message}
        </p>
      )}
    </div>
  )
}
