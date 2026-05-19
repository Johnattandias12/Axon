"use client"

import { useEffect, useState } from "react"
import { Copy, CheckCircle2, ShieldCheck, CreditCard, Wallet, Loader2 } from "lucide-react"
import QRCode from "qrcode"
import { centsToBRL } from "@/lib/utils"
import { SalesPopup } from "@/components/checkout/SalesPopup"

interface CheckoutClientProps {
  orderId: string
  subtotal: number
  fee: number
  total: number
  pixPayload: string | null
}

export function CheckoutClient({ orderId, subtotal, fee, total, pixPayload }: CheckoutClientProps) {
  const [method, setMethod] = useState<"pix" | "card">("pix")
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loadingPix, setLoadingPix] = useState(false)

  // Em um ambiente real, o pixPayload já viria do Pagar.me.
  // Como fallback para os testes de agora, vamos gerar um payload PIX genérico para a pessoa poder ver o QR Code gerado.
  const finalPixPayload = pixPayload || "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266554400005204000053039865802BR5913AXON INGRESSOS6008BRASILIA62070503***6304ABCD"

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
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Finalizar Pagamento
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--mute)" }}>
            Você está a um passo de garantir sua presença.
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
                  className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                    method === "pix" ? "text-white" : ""
                  }`}
                  style={{
                    backgroundColor: method === "pix" ? "var(--rule)" : "transparent",
                    color: method === "pix" ? "var(--pulse)" : "var(--mute)",
                  }}
                >
                  <Wallet size={18} />
                  PIX
                </button>
                <button
                  onClick={() => setMethod("card")}
                  className={`flex flex-1 items-center justify-center gap-2 border-l py-4 text-sm font-bold transition-colors ${
                    method === "card" ? "text-white" : ""
                  }`}
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
                    <div className="mb-6 rounded-lg bg-green-500/10 p-3 text-sm font-medium text-green-400 border border-green-500/20">
                      Aprovação instantânea. Seu ingresso é liberado na hora!
                    </div>

                    {/* Container do QR Code */}
                    <div className="relative mx-auto mb-6 flex aspect-square w-[240px] items-center justify-center rounded-2xl bg-white p-3 shadow-2xl">
                      {loadingPix || !qrCodeDataUrl ? (
                        <Loader2 className="animate-spin text-black" size={32} />
                      ) : (
                        <>
                          <img src={qrCodeDataUrl} alt="QR Code PIX" className="h-full w-full rounded-xl" />
                          {/* Logo da AXON no centro */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black shadow-lg border border-gray-800">
                              <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <path d="M50 6 L94 94 L6 94 Z" fill="none" stroke="var(--pulse)" strokeWidth="12" />
                              </svg>
                            </div>
                          </div>
                        </>
                      )}
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

                    <p className="mt-4 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--mute)" }}>
                      <ShieldCheck size={14} />
                      Pagamento 100% seguro processado pelo Pagar.me
                    </p>
                  </div>
                </div>
              )}

              {/* Área do Cartão (Genérica por enquanto) */}
              {method === "card" && (
                <div className="p-6 sm:p-8">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--mute)" }}>Número do Cartão</label>
                      <input type="text" placeholder="0000 0000 0000 0000" className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--rule)", color: "white" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--mute)" }}>Validade</label>
                        <input type="text" placeholder="MM/AA" className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--rule)", color: "white" }} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--mute)" }}>CVC</label>
                        <input type="text" placeholder="123" className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--rule)", color: "white" }} />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--mute)" }}>Nome no Cartão</label>
                      <input type="text" placeholder="NOME IMPRESSO" className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--rule)", color: "white" }} />
                    </div>

                    <button className="mt-4 w-full rounded-xl py-4 text-sm font-bold opacity-50 cursor-not-allowed" style={{ backgroundColor: "var(--rule)", color: "white" }} disabled>
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
              className="rounded-2xl border p-6 sticky top-24"
              style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
            >
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Resumo da Compra
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between" style={{ color: "var(--mute)" }}>
                  <span>Ingresso (Subtotal)</span>
                  <span className="text-white">{centsToBRL(subtotal)}</span>
                </div>
                <div className="flex justify-between border-b pb-4" style={{ color: "var(--mute)", borderColor: "var(--rule)" }}>
                  <span className="flex items-center gap-1">
                    Taxa AXON (8.99%)
                    <div className="group relative cursor-help">
                      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-800 text-[9px] font-bold text-gray-400 hover:bg-gray-700">?</div>
                      <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-md bg-gray-800 p-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 pointer-events-none">
                        Taxa de serviço e processamento da plataforma.
                      </div>
                    </div>
                  </span>
                  <span className="text-white">{centsToBRL(fee)}</span>
                </div>
                
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-white">Total a Pagar</span>
                  <span className="font-mono text-xl font-bold" style={{ color: "var(--pulse)" }}>
                    {centsToBRL(total)}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-gray-900/50 p-4 border border-gray-800 text-xs text-gray-400">
                Ao prosseguir, você concorda que o comprador assume a taxa de conveniência de 8.99% referente ao processamento da venda online.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
