"use client"

import { useState, useTransition, useEffect } from "react"
import {
  QrCode,
  ScanLine,
  Search,
  History,
  CheckCircle2,
  XCircle,
  User,
  Clock,
  Loader2,
  Wifi,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { AxonSymbol } from "@/components/shared/AxonLogo"
import { QrCameraScanner } from "@/components/shared/QrCameraScanner"
import { validateQr, type ValidateResult } from "./actions"

interface HistoryItem extends Extract<ValidateResult, { ok: true }> {
  at: number
}

export default function ScanAppPage() {
  const [activeTab, setActiveTab] = useState<"scan" | "history">("scan")
  const [input, setInput] = useState("")
  const [result, setResult] = useState<ValidateResult | null>(null)
  const [pending, startTransition] = useTransition()
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    if (result?.ok && result.status === "valid") {
      setHistory((h) => [{ ...result, at: Date.now() }, ...h].slice(0, 20))
    }
  }, [result])

  function run(payload: string) {
    if (!payload.trim()) return
    setResult(null)
    startTransition(async () => {
      const r = await validateQr(payload.trim())
      setResult(r)
      setTimeout(() => setResult(null), 5000)
    })
  }

  const successCount = history.filter((h) => h.ok && h.status === "valid").length

  return (
    <div
      className="flex min-h-screen flex-col md:mx-auto md:max-w-md md:border-x md:shadow-2xl"
      style={{
        backgroundColor: "var(--ink)",
        color: "var(--paper)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between border-b p-4"
        style={{
          backgroundColor: "var(--ink-2)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-70"
          aria-label="Voltar"
        >
          <ArrowLeft size={16} style={{ color: "rgba(250,250,247,0.5)" }} />
          <AxonSymbol size={22} tone="pulse" />
        </Link>
        <div>
          <h1 className="text-sm font-bold tracking-tight">Validação na Porta</h1>
          <p className="flex items-center gap-1 text-[11px]" style={{ color: "var(--pulse)" }}>
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ backgroundColor: "var(--pulse)" }}
            />
            <Wifi size={9} />
            Online
          </p>
        </div>
        <div className="text-right">
          <p
            className="font-mono text-xl font-black tabular-nums"
            style={{ letterSpacing: "-0.02em" }}
          >
            {successCount}
          </p>
          <p className="text-[10px]" style={{ color: "rgba(250,250,247,0.5)" }}>
            check-ins
          </p>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {activeTab === "scan" ? (
          <div className="flex flex-1 flex-col">
            {/* Viewfinder */}
            <div
              className="relative flex flex-1 flex-col items-center justify-center"
              style={{ backgroundColor: "#050507" }}
            >
              {/* Grid background */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id="scan-grid"
                    x="0"
                    y="0"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 24 0 L 0 0 0 24"
                      fill="none"
                      stroke="rgba(200,255,0,0.15)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#scan-grid)" />
              </svg>

              {/* Pulse glow */}
              <div
                className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25"
                style={{
                  background: "radial-gradient(circle, rgba(200,255,0,0.5) 0%, transparent 60%)",
                  filter: "blur(80px)",
                }}
                aria-hidden="true"
              />

              {/* Viewfinder frame */}
              <div className="relative z-10 p-8">
                <div
                  className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-3xl border-2 transition-colors duration-300"
                  style={{
                    borderColor: !result
                      ? "rgba(200,255,0,0.25)"
                      : result.ok && result.status === "valid"
                        ? "var(--success)"
                        : result.ok
                          ? "var(--warning)"
                          : "var(--danger)",
                    backgroundColor: !result
                      ? "transparent"
                      : result.ok && result.status === "valid"
                        ? "rgba(0,185,107,0.15)"
                        : result.ok
                          ? "rgba(232,148,0,0.15)"
                          : "rgba(229,52,43,0.15)",
                  }}
                >
                  {/* Câmera (renderiza só na aba "scan" e quando não há resultado) */}
                  {activeTab === "scan" && !result && !pending && (
                    <QrCameraScanner onDetect={(v) => run(v)} paused={pending || !!result} />
                  )}
                  {/* Corners */}
                  {(["t", "r", "b", "l"] as const).map((c) => (
                    <span
                      key={c}
                      className="absolute h-8 w-8 border-[var(--pulse)]"
                      style={{
                        top: c === "t" || c === "l" ? 0 : c === "r" ? 0 : "auto",
                        right: c === "r" || c === "t" ? 0 : "auto",
                        bottom: c === "b" || c === "l" ? 0 : "auto",
                        left: c === "l" || c === "b" ? 0 : "auto",
                        borderTopWidth: c === "t" || c === "l" || c === "r" ? 4 : 0,
                        borderLeftWidth: c === "l" || c === "t" || c === "b" ? 4 : 0,
                        borderRightWidth: c === "r" ? 4 : c === "t" ? 0 : 0,
                        borderBottomWidth: c === "b" ? 4 : c === "l" || c === "r" ? 0 : 0,
                        borderTopLeftRadius: c === "t" || c === "l" ? "1.5rem" : 0,
                        borderTopRightRadius: c === "r" ? "1.5rem" : 0,
                        borderBottomLeftRadius: c === "l" || c === "b" ? "1.5rem" : 0,
                        borderBottomRightRadius: c === "b" ? "1.5rem" : 0,
                      }}
                    />
                  ))}

                  {pending ? (
                    <div className="text-center">
                      <Loader2
                        size={48}
                        className="mx-auto animate-spin"
                        style={{ color: "var(--pulse)" }}
                      />
                      <p className="mt-3 text-xs" style={{ color: "rgba(250,250,247,0.6)" }}>
                        Validando…
                      </p>
                    </div>
                  ) : !result ? (
                    <ScanLine
                      size={56}
                      className="animate-pulse"
                      style={{ color: "rgba(250,250,247,0.4)" }}
                    />
                  ) : result.ok && result.status === "valid" ? (
                    <FeedbackOK r={result} />
                  ) : result.ok ? (
                    <FeedbackWarn r={result} />
                  ) : (
                    <FeedbackError msg={result.error} />
                  )}

                  {/* Linha de scan */}
                  {!result && !pending && (
                    <div
                      className="pointer-events-none absolute top-0 left-0 h-0.5 w-full"
                      style={{
                        backgroundColor: "var(--pulse)",
                        boxShadow: "0 0 12px var(--pulse)",
                        animation: "scan 2s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>
              </div>

              <p
                className="px-6 text-center text-[11px]"
                style={{ color: "rgba(250,250,247,0.5)" }}
              >
                Aponte a câmera para o QR Code do ingresso.
                <br />
                Ou cole o código manualmente abaixo.
              </p>
            </div>

            {/* Input manual */}
            <div
              className="border-t p-4"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "var(--ink-2)",
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  run(input)
                }}
                className="relative"
              >
                <Search
                  size={14}
                  className="absolute top-1/2 left-3 -translate-y-1/2"
                  style={{ color: "rgba(250,250,247,0.4)" }}
                />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="AXN1.xxxxxxxx…"
                  className="w-full rounded-xl border py-3 pr-24 pl-10 font-mono text-xs transition-colors outline-none focus:border-[var(--pulse)]"
                  style={{
                    borderColor: "rgba(255,255,255,0.1)",
                    backgroundColor: "var(--ink)",
                    color: "var(--paper)",
                  }}
                />
                <button
                  type="submit"
                  disabled={pending || !input.trim()}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-transform hover:scale-[1.03] disabled:opacity-50"
                  style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
                >
                  Validar
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: "var(--ink)" }}>
            <h2 className="mb-4 text-sm font-semibold">Últimos check-ins</h2>
            {history.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed p-12 text-center"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <History size={28} className="mx-auto" style={{ color: "rgba(250,250,247,0.3)" }} />
                <p className="mt-3 text-sm" style={{ color: "rgba(250,250,247,0.6)" }}>
                  Nenhum check-in nesta sessão
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((h, idx) => (
                  <div
                    key={`${h.ticketId}-${idx}`}
                    className="flex items-center gap-3 rounded-xl border p-3"
                    style={{
                      borderColor: "rgba(255,255,255,0.08)",
                      backgroundColor: "var(--ink-2)",
                    }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: "rgba(200,255,0,0.12)",
                        color: "var(--pulse)",
                      }}
                    >
                      <User size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{h.holderName}</p>
                      <p
                        className="truncate text-[10px]"
                        style={{ color: "rgba(250,250,247,0.5)" }}
                      >
                        {h.typeName} · {h.lotName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className="font-mono text-[10px]"
                        style={{ color: "rgba(250,250,247,0.4)" }}
                      >
                        {new Date(h.at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav
        className="flex border-t"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          backgroundColor: "var(--ink-2)",
        }}
      >
        <button
          className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors"
          style={{
            color: activeTab === "scan" ? "var(--pulse)" : "rgba(250,250,247,0.45)",
          }}
          onClick={() => setActiveTab("scan")}
        >
          <QrCode size={18} />
          <span className="text-[10px] font-medium">Escanear</span>
        </button>
        <button
          className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors"
          style={{
            color: activeTab === "history" ? "var(--pulse)" : "rgba(250,250,247,0.45)",
          }}
          onClick={() => setActiveTab("history")}
        >
          <History size={18} />
          <span className="text-[10px] font-medium">Histórico</span>
        </button>
      </nav>

      <style>{`@keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}</style>
    </div>
  )
}

function FeedbackOK({ r }: { r: Extract<ValidateResult, { ok: true }> }) {
  return (
    <div className="text-center">
      <CheckCircle2 size={56} className="mx-auto" style={{ color: "var(--success)" }} />
      <p
        className="mt-2 font-mono text-base font-black tracking-wider"
        style={{ color: "var(--success)" }}
      >
        APROVADO
      </p>
      <p className="mt-1 text-xs font-semibold">{r.holderName}</p>
      <p className="text-[10px]" style={{ color: "rgba(250,250,247,0.6)" }}>
        {r.typeName} · {r.lotName}
      </p>
    </div>
  )
}

function FeedbackWarn({ r }: { r: Extract<ValidateResult, { ok: true }> }) {
  const label =
    r.status === "already_used"
      ? "JÁ UTILIZADO"
      : r.status === "cancelled"
        ? "CANCELADO"
        : r.status === "paused"
          ? "PAUSADO"
          : "REEMBOLSADO"
  return (
    <div className="text-center">
      <Clock size={48} className="mx-auto" style={{ color: "var(--warning)" }} />
      <p
        className="mt-2 font-mono text-sm font-black tracking-wider"
        style={{ color: "var(--warning)" }}
      >
        {label}
      </p>
      <p className="mt-1 text-[11px] font-semibold">{r.holderName}</p>
      {r.usedAt && (
        <p className="text-[10px]" style={{ color: "rgba(250,250,247,0.6)" }}>
          em {new Date(r.usedAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  )
}

function FeedbackError({ msg }: { msg: string }) {
  return (
    <div className="px-3 text-center">
      <XCircle size={56} className="mx-auto" style={{ color: "var(--danger)" }} />
      <p
        className="mt-2 font-mono text-base font-black tracking-wider"
        style={{ color: "var(--danger)" }}
      >
        INVÁLIDO
      </p>
      <p className="mt-1 text-[10px]" style={{ color: "rgba(250,250,247,0.6)" }}>
        {msg}
      </p>
    </div>
  )
}
