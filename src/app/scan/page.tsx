"use client"

import { useState } from "react"
import { QrCode, ScanLine, Search, History, CheckCircle2, XCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ScanAppPage() {
  const [activeTab, setActiveTab] = useState<"scan" | "history">("scan")
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error">("idle")

  // Simula um scan
  const handleSimulateScan = (status: "success" | "error") => {
    setScanStatus(status)
    setTimeout(() => setScanStatus("idle"), 3000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white md:mx-auto md:max-w-md md:border-x md:border-white/10 md:shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-900 p-4">
        <div>
          <h1 className="text-lg font-bold">Validação na Porta</h1>
          <p className="flex items-center gap-1 text-xs text-lime-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-lime-500"></span>
            Modo Online Ativo
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black">428</p>
          <p className="text-xs text-zinc-400">Check-ins</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {activeTab === "scan" ? (
          <div className="flex flex-1 flex-col">
            {/* Viewfinder Simulado */}
            <div className="relative flex flex-1 flex-col items-center justify-center bg-zinc-950">
              {/* Câmera Placeholder */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-20"></div>

              {/* Scan Overlay */}
              <div className="relative z-10 p-8">
                <div
                  className={`relative flex h-64 w-64 items-center justify-center rounded-3xl border-2 transition-colors duration-300 ${
                    scanStatus === "idle"
                      ? "border-white/30"
                      : scanStatus === "success"
                        ? "border-green-500 bg-green-500/20"
                        : "border-red-500 bg-red-500/20"
                  }`}
                >
                  {/* Canto do viewfinder */}
                  <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-3xl border-t-4 border-l-4 border-lime-500"></div>
                  <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-3xl border-t-4 border-r-4 border-lime-500"></div>
                  <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-3xl border-b-4 border-l-4 border-lime-500"></div>
                  <div className="absolute right-0 bottom-0 h-8 w-8 rounded-br-3xl border-r-4 border-b-4 border-lime-500"></div>

                  {/* Feedback Status */}
                  {scanStatus === "idle" && (
                    <ScanLine className="h-16 w-16 animate-pulse text-white/50" />
                  )}
                  {scanStatus === "success" && (
                    <div className="animate-in zoom-in text-center">
                      <CheckCircle2 className="mx-auto mb-2 h-16 w-16 text-green-500" />
                      <p className="text-xl font-bold text-green-500">APROVADO</p>
                    </div>
                  )}
                  {scanStatus === "error" && (
                    <div className="animate-in zoom-in text-center">
                      <XCircle className="mx-auto mb-2 h-16 w-16 text-red-500" />
                      <p className="text-xl font-bold text-red-500">INVÁLIDO</p>
                    </div>
                  )}

                  {/* Linha de scan animada */}
                  {scanStatus === "idle" && (
                    <div className="absolute top-0 left-0 h-0.5 w-full animate-[scan_2s_ease-in-out_infinite] bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.8)]"></div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-8 left-0 z-10 flex w-full justify-center gap-4 px-6">
                <Button
                  variant="outline"
                  className="border-white/20 bg-black/50 text-white backdrop-blur-md"
                  onClick={() => handleSimulateScan("success")}
                >
                  Simular Sucesso
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-black/50 text-white backdrop-blur-md"
                  onClick={() => handleSimulateScan("error")}
                >
                  Simular Erro
                </Button>
              </div>
            </div>

            {/* Busca Manual */}
            <div className="border-t border-white/10 bg-zinc-900 p-4">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Buscar por CPF ou Nome..."
                  className="w-full border-white/10 bg-black pl-10 text-white placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-black p-4">
            <h2 className="mb-4 text-lg font-semibold text-white">Últimos Check-ins</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-white/5 bg-zinc-900 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-500/20 text-lime-500">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">João da Silva Pereira</p>
                    <p className="text-xs text-zinc-400">Pista - Lote 1 • Ingresso #AX{1000 + i}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-zinc-500">Agora</p>
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex border-t border-white/10 bg-zinc-900">
        <button
          className={`flex flex-1 flex-col items-center gap-1 py-4 transition-colors ${activeTab === "scan" ? "text-lime-500" : "text-zinc-500 hover:text-zinc-300"}`}
          onClick={() => setActiveTab("scan")}
        >
          <QrCode className="h-6 w-6" />
          <span className="text-xs font-medium">Escanear</span>
        </button>
        <button
          className={`flex flex-1 flex-col items-center gap-1 py-4 transition-colors ${activeTab === "history" ? "text-lime-500" : "text-zinc-500 hover:text-zinc-300"}`}
          onClick={() => setActiveTab("history")}
        >
          <History className="h-6 w-6" />
          <span className="text-xs font-medium">Histórico</span>
        </button>
      </nav>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `,
        }}
      />
    </div>
  )
}
