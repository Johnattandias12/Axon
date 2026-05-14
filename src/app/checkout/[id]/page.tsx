"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, CreditCard, QrCode, Lock, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit">("pix")

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Header Simplificado para Checkout */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/eventos/demo-event"
            className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Voltar para o evento</span>
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-green-500">Checkout Seguro</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl flex-1 px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Coluna da Esquerda: Dados e Pagamento */}
          <div className="space-y-8 lg:col-span-7">
            {/* Seção 1: Identificação */}
            <section className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-500 text-xs font-bold text-black">
                  1
                </span>
                Seus Dados
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Nome Completo</label>
                  <Input
                    placeholder="Digite seu nome"
                    className="border-white/10 bg-black"
                    defaultValue="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">E-mail</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    className="border-white/10 bg-black"
                    defaultValue="joao@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">CPF</label>
                  <Input placeholder="000.000.000-00" className="border-white/10 bg-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Telefone</label>
                  <Input placeholder="(00) 00000-0000" className="border-white/10 bg-black" />
                </div>
              </div>
            </section>

            {/* Seção 2: Pagamento */}
            <section className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-500 text-xs font-bold text-black">
                  2
                </span>
                Forma de Pagamento
              </h2>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod("pix")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all",
                    paymentMethod === "pix"
                      ? "border-lime-500 bg-lime-500/10 text-lime-500"
                      : "border-white/10 bg-black text-zinc-400 hover:border-white/30"
                  )}
                >
                  <QrCode className="mb-2 h-6 w-6" />
                  <span className="font-medium">PIX</span>
                  <span className="mt-1 text-xs opacity-80">Aprovação instantânea</span>
                </button>

                <button
                  onClick={() => setPaymentMethod("credit")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all",
                    paymentMethod === "credit"
                      ? "border-lime-500 bg-lime-500/10 text-lime-500"
                      : "border-white/10 bg-black text-zinc-400 hover:border-white/30"
                  )}
                >
                  <CreditCard className="mb-2 h-6 w-6" />
                  <span className="font-medium">Cartão de Crédito</span>
                  <span className="mt-1 text-xs opacity-80">Até 12x</span>
                </button>
              </div>

              {paymentMethod === "credit" && (
                <div className="animate-in fade-in slide-in-from-top-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Número do Cartão</label>
                    <Input placeholder="0000 0000 0000 0000" className="border-white/10 bg-black" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">Validade</label>
                      <Input placeholder="MM/AA" className="border-white/10 bg-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">CVV</label>
                      <Input placeholder="123" className="border-white/10 bg-black" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Nome no Cartão</label>
                    <Input
                      placeholder="Nome impresso no cartão"
                      className="border-white/10 bg-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Parcelamento</label>
                    <select className="h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:ring-2 focus:ring-lime-500 focus:outline-none">
                      <option value="1">1x de R$ 132,00 (Sem juros)</option>
                      <option value="2">2x de R$ 69,50</option>
                      <option value="3">3x de R$ 47,20</option>
                    </select>
                  </div>
                </div>
              )}

              {paymentMethod === "pix" && (
                <div className="animate-in fade-in slide-in-from-top-4 rounded-xl border border-lime-500/30 bg-black p-6 text-center">
                  <QrCode className="mx-auto mb-4 h-12 w-12 text-lime-500" />
                  <h3 className="mb-2 text-lg font-medium text-white">Pague via PIX</h3>
                  <p className="mb-4 text-sm text-zinc-400">
                    O código PIX será gerado na próxima etapa. A confirmação é instantânea e seu
                    ingresso é liberado na hora.
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full bg-lime-500/10 px-3 py-1.5 text-xs text-lime-500">
                    <ShieldCheck className="h-4 w-4" />
                    Transação criptografada
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Coluna da Direita: Resumo do Pedido */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-zinc-900 p-6">
              <h2 className="mb-6 border-b border-white/10 pb-4 text-xl font-semibold">
                Resumo do Pedido
              </h2>

              {/* Evento Info */}
              <div className="mb-6 flex gap-4">
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  <div className="h-full w-full bg-gradient-to-br from-lime-500/20 to-purple-500/20"></div>
                </div>
                <div>
                  <h3 className="line-clamp-2 font-medium text-white">
                    Baile da AXON - Edição Especial
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">Sáb, 24 de Agosto • 22h</p>
                  <p className="text-sm text-zinc-400">Complexo XPTO, São Paulo</p>
                </div>
              </div>

              {/* Ingressos */}
              <div className="mb-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">2x Pista - Lote 1</p>
                    <p className="text-sm text-zinc-400">R$ 60,00 cada</p>
                  </div>
                  <p className="font-medium text-white">R$ 120,00</p>
                </div>
              </div>

              {/* Totais */}
              <div className="mb-6 space-y-3 border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Subtotal</span>
                  <span>R$ 120,00</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Taxa de serviço (10%)</span>
                  <span>R$ 12,00</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2 text-xl font-bold text-white">
                  <span>Total</span>
                  <span className="text-lime-500">R$ 132,00</span>
                </div>
              </div>

              {/* Botão Finalizar */}
              <Button className="h-12 w-full bg-lime-500 text-lg font-semibold text-black hover:bg-lime-400">
                {paymentMethod === "pix" ? "Gerar PIX" : "Finalizar Compra"}
              </Button>

              <div className="mt-4 text-center">
                <p className="flex items-center justify-center gap-1 text-xs text-zinc-500">
                  <Lock className="h-3 w-3" />
                  Pagamento 100% seguro processado via Pagar.me
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
