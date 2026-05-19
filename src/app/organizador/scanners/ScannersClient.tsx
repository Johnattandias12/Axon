"use client"

import { useActionState, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  createScannerAction,
  revokeScannerAction,
  resendScannerInviteAction,
  type ActionState,
} from "./actions"
import { QrCode, Phone, Mail, Copy, CheckCircle2, XCircle, Send, Plus, Loader2 } from "lucide-react"

interface EventOption {
  id: string
  title: string
  starts_at: string
  status: string
}
interface ScannerRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  gate: string | null
  token: string
  revoked_at: string | null
  last_used_at: string | null
  created_at: string
}
interface Props {
  events: EventOption[]
  selectedEventId: string | null
  scanners: ScannerRow[]
  baseUrl: string
}

export function ScannersClient({ events, selectedEventId, scanners, baseUrl }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [createState, createForm] = useActionState<ActionState, FormData>(createScannerAction, null)
  const [, revokeForm] = useActionState<ActionState, FormData>(revokeScannerAction, null)
  const [, pending] = useTransition()
  void pending

  function buildScanUrl(token: string) {
    return `${baseUrl.replace(/\/$/, "")}/scan/${token}`
  }

  function buildWhatsAppLink(scanner: ScannerRow, eventTitle: string) {
    const phone = (scanner.phone || "").replace(/\D/g, "")
    const msg = `Olá ${scanner.name}, aqui é da AXON. Esse é seu link de portaria pro ${eventTitle}: ${buildScanUrl(scanner.token)}\n\nAbra no celular, a câmera vai pedir permissão.`
    return phone
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  const [copyingId, setCopyingId] = useState<string | null>(null)
  async function copyToClipboard(text: string, scannerId: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyingId(scannerId)
      toast.success("Link copiado")
      setTimeout(() => setCopyingId(null), 1500)
    } catch {
      toast.error("Não foi possível copiar.")
    }
  }

  async function resendEmail(scannerId: string) {
    const fd = new FormData()
    fd.set("scannerId", scannerId)
    fd.set("channel", "email")
    const res = await resendScannerInviteAction(null, fd)
    if (res?.ok) toast.success(res.message ?? "Enviado.")
    else toast.error(res?.error ?? "Falhou.")
  }

  function changeEvent(eventId: string) {
    const url = new URL(window.location.href)
    url.searchParams.set("eventId", eventId)
    router.push(url.pathname + url.search)
    void sp
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12 md:px-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-black tracking-tight sm:text-3xl"
          style={{ color: "var(--ink)" }}
        >
          Portaria do evento
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          Cadastra a galera da entrada. Sistema gera um link e você manda no WhatsApp ou email. Sem
          precisar criar conta.
        </p>
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <p className="text-sm" style={{ color: "var(--mute)" }}>
            Você ainda não tem eventos. Crie um primeiro.
          </p>
        </div>
      ) : (
        <>
          {/* Event selector */}
          <div className="mb-6">
            <label
              className="mb-1.5 block text-[11px] font-bold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Evento
            </label>
            <select
              value={selectedEventId ?? ""}
              onChange={(e) => changeEvent(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--pulse)] sm:max-w-md"
              style={{
                borderColor: "var(--rule)",
                backgroundColor: "var(--paper-pure)",
                color: "var(--ink)",
              }}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} — {new Date(e.starts_at).toLocaleDateString("pt-BR")}
                </option>
              ))}
            </select>
          </div>

          {/* Create form */}
          <form
            action={createForm}
            className="mb-8 rounded-2xl border p-5"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <input type="hidden" name="eventId" value={selectedEventId ?? ""} />
            <p
              className="mb-3 text-[11px] font-bold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              Adicionar scanner
            </p>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <input
                name="name"
                required
                placeholder="Nome (ex: Maria)"
                className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--pulse)]"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--paper-soft)",
                  color: "var(--ink)",
                }}
              />
              <input
                name="phone"
                placeholder="WhatsApp (84) 9..."
                inputMode="tel"
                className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--pulse)]"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--paper-soft)",
                  color: "var(--ink)",
                }}
              />
              <input
                name="email"
                type="email"
                placeholder="email@exemplo.com"
                className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--pulse)]"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--paper-soft)",
                  color: "var(--ink)",
                }}
              />
              <input
                name="gate"
                placeholder="Portão (opcional)"
                className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--pulse)]"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--paper-soft)",
                  color: "var(--ink)",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!selectedEventId}
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              <Plus size={16} />
              Criar e gerar link
            </button>
            {createState?.ok === false && (
              <p
                className="mt-3 inline-flex items-center gap-1.5 text-xs"
                style={{ color: "var(--danger)" }}
              >
                <XCircle size={12} />
                {createState.error}
              </p>
            )}
            {createState?.ok && createState.scanner && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
              >
                <p className="text-xs" style={{ color: "var(--ink)" }}>
                  Link criado:{" "}
                  <code style={{ color: "var(--pulse)" }}>{createState.scanner.url}</code>
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createState.scanner!.url, "new")}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                >
                  <Copy size={12} />
                  Copiar
                </button>
              </div>
            )}
          </form>

          {/* List */}
          {scanners.length === 0 ? (
            <div
              className="rounded-2xl border p-8 text-center"
              style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
            >
              <QrCode size={32} className="mx-auto mb-2" style={{ color: "var(--mute)" }} />
              <p className="text-sm" style={{ color: "var(--mute)" }}>
                Nenhum scanner cadastrado pra esse evento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scanners.map((s) => {
                const url = buildScanUrl(s.token)
                const revoked = !!s.revoked_at
                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border p-4 sm:p-5"
                    style={{
                      borderColor: "var(--rule)",
                      backgroundColor: revoked ? "var(--paper-soft)" : "var(--paper-pure)",
                      opacity: revoked ? 0.55 : 1,
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p
                          className="flex items-center gap-2 text-sm font-bold"
                          style={{ color: "var(--ink)" }}
                        >
                          {s.name}
                          {revoked && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                              style={{
                                backgroundColor: "var(--danger-soft)",
                                color: "var(--danger)",
                              }}
                            >
                              Revogado
                            </span>
                          )}
                          {!revoked && s.last_used_at && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                              style={{
                                backgroundColor: "var(--pulse-soft)",
                                color: "var(--pulse-deep)",
                              }}
                            >
                              Ativo
                            </span>
                          )}
                        </p>
                        <div
                          className="mt-1 flex flex-wrap gap-3 text-xs"
                          style={{ color: "var(--mute)" }}
                        >
                          {s.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={11} />
                              {s.phone}
                            </span>
                          )}
                          {s.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail size={11} />
                              {s.email}
                            </span>
                          )}
                          {s.gate && <span>Portão {s.gate}</span>}
                        </div>
                      </div>

                      {!revoked && (
                        <div className="flex flex-wrap gap-2">
                          {s.phone && (
                            <a
                              href={buildWhatsAppLink(s, selectedEvent?.title ?? "evento")}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white"
                              style={{ backgroundColor: "#25D366" }}
                            >
                              <Send size={12} />
                              WhatsApp
                            </a>
                          )}
                          {s.email && (
                            <button
                              type="button"
                              onClick={() => resendEmail(s.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold"
                              style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                            >
                              <Mail size={12} />
                              E-mail
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(url, s.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold"
                            style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                          >
                            {copyingId === s.id ? (
                              <>
                                <CheckCircle2 size={12} />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                Copiar link
                              </>
                            )}
                          </button>
                          <form action={revokeForm}>
                            <input type="hidden" name="scannerId" value={s.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-[var(--danger-soft)]"
                              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                            >
                              <XCircle size={12} />
                              Revogar
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export const Spinner = Loader2
