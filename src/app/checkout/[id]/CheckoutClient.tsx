"use client"

import { useEffect, useState } from "react"
import { Copy, CheckCircle2, ShieldCheck, CreditCard, Wallet, Loader2 } from "lucide-react"
import QRCode from "qrcode"
import { centsToBRL } from "@/lib/utils"
import { SalesPopup } from "@/components/checkout/SalesPopup"
import { approveDemoOrder } from "../actions"
import { toast } from "sonner"

interface CheckoutClientProps {
  orderId: string
  subtotal: number
  fee: number
  total: number
  pixPayload: string | null
  pixExpiresAt?: string | null
  isDemo?: boolean
}

const DEMO_PIX_PAYLOAD =
  "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266554400005204000053039865802BR5913AXON DEMO6008BRASILIA62070503***6304ABCD"

export function CheckoutClient({
  orderId,
  subtotal,
  fee,
  total,
  pixPayload,
  pixExpiresAt,
  isDemo = false,
}: CheckoutClientProps) {
  const [method, setMethod] = useState<"pix" | "card">("pix")
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loadingPix, setLoadingPix] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [approving, setApproving] = useState(false)

  const handleApproveDemo = async () => {
    setApproving(true)
    try {
      const res = await approveDemoOrder(orderId)
      if (res.ok) {
        toast.success("Pagamento fictício simulado com sucesso! Redirecionando...")
        setTimeout(() => {
          window.location.href = `/minha-conta/ingressos/${orderId}`
        }, 1500)
      } else {
        toast.error(res.error || "Erro ao aprovar pedido simulado.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Ocorreu um erro ao simular o pagamento.")
    } finally {
      setApproving(false)
    }
  }

  // Sandbox/demo: payload bonito mas sem cobrança real. Produção: vem da Pagar.me.
  const finalPixPayload = pixPayload || DEMO_PIX_PAYLOAD

  // Countdown da expiração do PIX (15min default Pagar.me)
  useEffect(() => {
    if (!pixExpiresAt) return
    const target = new Date(pixExpiresAt).getTime()
    const tick = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [pixExpiresAt])

  // Polling de status: a cada 5s checa se o webhook já confirmou pagamento.
  useEffect(() => {
    if (isDemo) return
    let cancelled = false
    const poll = async () => {
      try {
        const r = await fetch(`/api/checkout/${orderId}/status`, { cache: "no-store" })
        if (!r.ok || cancelled) return
        const j = (await r.json()) as { status?: string }
        if (j.status === "paid") {
          window.location.href = `/minha-conta/ingressos/${orderId}`
        }
      } catch {
        /* ignore */
      }
    }
    const i = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(i)
    }
  }, [orderId, isDemo])

  useEffect(() => {
    if (method === "pix") {
      setLoadingPix(true)
      QRCode.toDataURL(finalPixPayload, {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error(err))
        .finally(() => setLoadingPix(false))
    }
  }, [method, finalPixPayload])

  const handleCopyPix = () => {
    navigator.clipboard.writeText(finalPixPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen pt-10 pb-20" style={{ backgroundColor: "var(--paper)" }}>
      <SalesPopup />

      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "var(--ink)" }}
          >
            Finalizar Pagamento
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--mute)" }}>
            Sua compra é 100% segura. Conclua o pagamento para receber seus ingressos na hora.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          {/* Lado Esquerdo: Metódos de Pagamento */}
          <div className="space-y-6">
            <div
              className="overflow-hidden rounded-2xl border"
              style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
            >
              {/* Seleção de Métodos */}
              <div className="flex border-b" style={{ borderColor: "var(--rule)" }}>
                <button
                  onClick={() => setMethod("pix")}
                  className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold transition-colors"
                  style={{
                    backgroundColor: method === "pix" ? "var(--ink)" : "transparent",
                    color: method === "pix" ? "var(--pulse)" : "var(--mute)",
                  }}
                >
                  <Wallet size={18} />
                  PIX
                </button>
                <button
                  onClick={() => setMethod("card")}
                  className="flex flex-1 items-center justify-center gap-2 border-l py-4 text-sm font-bold transition-colors"
                  style={{
                    backgroundColor: method === "card" ? "var(--rule)" : "transparent",
                    borderColor: "var(--rule)",
                    color: method === "card" ? "var(--ink)" : "var(--mute)",
                  }}
                >
                  <CreditCard size={18} />
                  Cartão de Crédito
                </button>
              </div>

              {/* Área do PIX */}
              {method === "pix" && (
                <div className="p-6 sm:p-8">
                  <div className="mx-auto max-w-sm text-center">
                    <div
                      className="mb-6 rounded-lg border p-3 text-sm font-medium"
                      style={
                        isDemo
                          ? {
                              borderColor: "color-mix(in srgb, var(--warning) 20%, transparent)",
                              backgroundColor: "var(--warning-soft)",
                              color: "var(--warning)",
                            }
                          : {
                              borderColor: "color-mix(in srgb, var(--success) 20%, transparent)",
                              backgroundColor: "var(--success-soft)",
                              color: "var(--success)",
                            }
                      }
                    >
                      {isDemo
                        ? "Modo demonstração — QR ilustrativo, sem cobrança real."
                        : "Pagamento Seguro · Seus ingressos são liberados imediatamente após a confirmação!"}
                    </div>

                    {secondsLeft !== null && secondsLeft > 0 && (
                      <p
                        className="mb-4 text-xs font-medium"
                        style={{ color: secondsLeft < 60 ? "var(--danger)" : "var(--mute)" }}
                      >
                        Expira em{" "}
                        <span className="font-mono font-bold">
                          {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                        </span>
                      </p>
                    )}

                    {/* Container do QR Code */}
                    <div className="relative mx-auto mb-6 flex aspect-square w-[240px] items-center justify-center rounded-2xl bg-white p-3 shadow-2xl">
                      {loadingPix || !qrCodeDataUrl ? (
                        <Loader2 className="animate-spin text-black" size={32} />
                      ) : (
                        <>
                          <img
                            src={qrCodeDataUrl}
                            alt="QR Code PIX"
                            className="h-full w-full rounded-xl"
                          />
                          {/* Logo da AXON no centro */}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-lg border shadow-lg"
                              style={{
                                backgroundColor: "var(--ink)",
                                borderColor: "var(--ink-2)",
                              }}
                            >
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M50 6 L94 94 L6 94 Z"
                                  fill="none"
                                  stroke="var(--pulse)"
                                  strokeWidth="12"
                                />
                              </svg>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Código Copia e Cola Visível */}
                    <div className="mb-4 text-left">
                      <label
                        className="mb-1 block text-[10px] font-bold tracking-wider uppercase"
                        style={{ color: "var(--mute)" }}
                      >
                        Código PIX Copia e Cola
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={finalPixPayload}
                        onClick={(e) => {
                          ;(e.target as HTMLInputElement).select()
                          handleCopyPix()
                        }}
                        className="w-full rounded-lg border px-3 py-2.5 font-mono text-[10px] transition-colors outline-none"
                        style={{
                          borderColor: "var(--rule)",
                          backgroundColor: "var(--paper-soft)",
                          color: "var(--ink-3)",
                        }}
                      />
                    </div>

                    <button
                      onClick={handleCopyPix}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: "var(--pulse)", color: "#000000" }}
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 size={18} />
                          Código Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          Copiar Código PIX
                        </>
                      )}
                    </button>

                    {isDemo && (
                      <button
                        onClick={handleApproveDemo}
                        disabled={approving}
                        className="group mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border py-4 text-sm font-bold transition-all hover:scale-[1.02]"
                        style={{
                          backgroundColor: "var(--success-soft)",
                          borderColor: "var(--success)",
                          color: "var(--success)",
                        }}
                      >
                        {approving ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Liberando Ingressos...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            Simular Pagamento (Aprovar)
                          </>
                        )}
                      </button>
                    )}

                    <p
                      className="mt-4 flex items-center justify-center gap-1.5 text-xs"
                      style={{ color: "var(--mute)" }}
                    >
                      <ShieldCheck size={14} className={isDemo ? "" : "text-green-500"} />
                      {isDemo
                        ? "Pagamento simulado seguro para fins de demonstração"
                        : "Pagamento 100% seguro processado pelo Pagar.me com criptografia SSL"}
                    </p>
                  </div>
                </div>
              )}

              {/* Área do Cartão (Genérica por enquanto) */}
              {method === "card" && (
                <div className="p-6 sm:p-8">
                  <div className="space-y-4">
                    <div>
                      <label
                        className="mb-1.5 block text-xs font-medium"
                        style={{ color: "var(--mute)" }}
                      >
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        className="w-full rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
                        style={{
                          backgroundColor: "var(--bg-base)",
                          borderColor: "var(--rule)",
                          color: "white",
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className="mb-1.5 block text-xs font-medium"
                          style={{ color: "var(--mute)" }}
                        >
                          Validade
                        </label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          className="w-full rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
                          style={{
                            backgroundColor: "var(--bg-base)",
                            borderColor: "var(--rule)",
                            color: "white",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          className="mb-1.5 block text-xs font-medium"
                          style={{ color: "var(--mute)" }}
                        >
                          CVC
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
                          style={{
                            backgroundColor: "var(--bg-base)",
                            borderColor: "var(--rule)",
                            color: "white",
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className="mb-1.5 block text-xs font-medium"
                        style={{ color: "var(--mute)" }}
                      >
                        Nome no Cartão
                      </label>
                      <input
                        type="text"
                        placeholder="NOME IMPRESSO"
                        className="w-full rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
                        style={{
                          backgroundColor: "var(--bg-base)",
                          borderColor: "var(--rule)",
                          color: "white",
                        }}
                      />
                    </div>

                    <button
                      className="mt-4 w-full cursor-not-allowed rounded-xl py-4 text-sm font-bold opacity-50"
                      style={{ backgroundColor: "var(--rule)", color: "white" }}
                      disabled
                    >
                      Pagar com Cartão (Em Breve)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Resumo do Pedido */}
          <div className="space-y-4">
            <div
              className="sticky top-24 rounded-2xl border p-6"
              style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
            >
              <h2
                className="mb-4 text-sm font-bold tracking-wider uppercase"
                style={{ color: "var(--ink)" }}
              >
                Resumo da Compra
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between" style={{ color: "var(--mute)" }}>
                  <span>Ingresso (Subtotal)</span>
                  <span style={{ color: "var(--ink)" }}>{centsToBRL(subtotal)}</span>
                </div>
                <div
                  className="flex justify-between border-b pb-4"
                  style={{ color: "var(--mute)", borderColor: "var(--rule)" }}
                >
                  <span className="flex items-center gap-1">
                    Taxa de serviço AXON
                    <div className="group relative cursor-help">
                      <div
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold transition-colors"
                        style={{
                          backgroundColor: "var(--rule)",
                          color: "var(--mute)",
                        }}
                      >
                        ?
                      </div>
                      <div
                        className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-md p-2 text-xs opacity-0 shadow-xl transition-opacity group-hover:opacity-100"
                        style={{
                          backgroundColor: "var(--ink)",
                          color: "var(--paper)",
                        }}
                      >
                        Taxa de serviço e processamento da plataforma.
                      </div>
                    </div>
                  </span>
                  <span style={{ color: "var(--ink)" }}>{centsToBRL(fee)}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="font-bold" style={{ color: "var(--ink)" }}>
                    Total a Pagar
                  </span>
                  <span
                    className="font-mono text-xl font-bold"
                    style={{ color: "var(--pulse-deep)" }}
                  >
                    {centsToBRL(total)}
                  </span>
                </div>
              </div>

              <div
                className="mt-6 rounded-lg border p-4 text-xs"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--paper-soft)",
                  color: "var(--mute)",
                }}
              >
                Ao concluir, você concorda com os termos de compra e com a taxa de processamento
                online inclusa no valor total.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
