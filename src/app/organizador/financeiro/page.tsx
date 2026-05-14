"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  History,
  Download,
  Banknote,
  Building2,
} from "lucide-react"

export default function FinanceiroPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Financeiro</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus recebíveis, solicite saques e acompanhe o fluxo de caixa.
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Saldo Disponível</CardTitle>
            <Wallet className="h-4 w-4 text-lime-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ 12.450,00</div>
            <p className="mt-1 text-xs text-zinc-500">Pronto para saque imediato</p>
            <Button className="mt-4 w-full bg-lime-500 text-black hover:bg-lime-400">
              Solicitar Saque
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">A Receber (Futuro)</CardTitle>
            <History className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ 5.230,00</div>
            <p className="mt-1 text-xs text-zinc-500">Compras em cartão (prazo de liberação)</p>
            <Button
              variant="outline"
              className="mt-4 w-full border-white/10 text-white hover:bg-white/5"
            >
              Antecipar Recebíveis
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Transacionado</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ 45.890,00</div>
            <p className="mt-1 text-xs text-zinc-500">Soma de todas as vendas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Histórico de Transações */}
        <Card className="col-span-4 border-white/10 bg-zinc-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Últimas Transações</CardTitle>
                <CardDescription>Histórico recente de vendas e saques.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex gap-2 border-white/10 text-white hover:bg-white/5"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  type: "sale",
                  desc: "Ingresso - Baile da AXON",
                  amount: "+ R$ 132,00",
                  date: "Hoje, 14:32",
                  method: "PIX",
                  status: "Aprovado",
                },
                {
                  type: "sale",
                  desc: "Ingresso - Baile da AXON",
                  amount: "+ R$ 60,00",
                  date: "Hoje, 11:15",
                  method: "Cartão",
                  status: "Aprovado",
                },
                {
                  type: "payout",
                  desc: "Saque Conta Bradesco",
                  amount: "- R$ 5.000,00",
                  date: "Ontem, 09:00",
                  method: "TED",
                  status: "Concluído",
                },
                {
                  type: "sale",
                  desc: "Ingresso - Baile da AXON",
                  amount: "+ R$ 132,00",
                  date: "Ontem, 22:10",
                  method: "PIX",
                  status: "Aprovado",
                },
                {
                  type: "sale",
                  desc: "Ingresso - Baile da AXON",
                  amount: "+ R$ 132,00",
                  date: "Ontem, 20:45",
                  method: "Cartão",
                  status: "Aprovado",
                },
              ].map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${tx.type === "sale" ? "bg-lime-500/10 text-lime-500" : "bg-red-500/10 text-red-500"}`}
                    >
                      {tx.type === "sale" ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tx.desc}</p>
                      <p className="text-xs text-zinc-500">
                        {tx.date} • {tx.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${tx.type === "sale" ? "text-lime-500" : "text-white"}`}
                    >
                      {tx.amount}
                    </p>
                    <p className="text-xs text-zinc-500">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dados Bancários */}
        <Card className="col-span-3 border-white/10 bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-white">Dados Bancários</CardTitle>
            <CardDescription>Conta vinculada para recebimento dos saques.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-black p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
                <Building2 className="h-6 w-6 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Banco Bradesco S.A.</p>
                <p className="mt-1 text-sm text-zinc-400">Agência: 1234 • Conta: 12345-6</p>
                <p className="mt-2 text-xs text-zinc-500">CNPJ: 00.000.000/0001-00</p>
              </div>
            </div>

            <div className="rounded-xl border border-lime-500/20 bg-lime-500/5 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-lime-500">
                <Banknote className="h-4 w-4" />
                Regras de Saque
              </h4>
              <ul className="list-inside list-disc space-y-2 text-xs text-zinc-400">
                <li>Saques via PIX caem na hora, 24/7.</li>
                <li>Transferências via TED caem em até 1 dia útil.</li>
                <li>Taxa de saque: R$ 3,67.</li>
                <li>Saque mínimo: R$ 50,00.</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="w-full border-white/10 text-white hover:bg-white/5"
            >
              Alterar Conta Bancária
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
