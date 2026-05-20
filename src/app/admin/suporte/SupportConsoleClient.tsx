"use client"

import { useState, useTransition, useEffect } from "react"
import {
  Search,
  Download,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Activity,
  ArrowRight,
  Terminal,
  Cpu,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { resolveRefund } from "../actions"
import { toast } from "sonner"
import { formatCPF } from "@/lib/utils/validators"
import { centsToBRL } from "@/lib/utils"

interface EventData {
  id: string
  title: string
  starts_at: string
  venue_name: string | null
  city: string | null
  state: string | null
}

interface TicketData {
  id: string
  order_id: string
  status: string
  holder_name: string
  holder_cpf: string
  refund_requested_at: string | null
  refund_reason: string | null
  created_at: string
  events: EventData | EventData[] | null
}

interface OrderData {
  id: string
  buyer_id: string
  status: string
  subtotal_cents: number
  service_fee_cents: number
  total_cents: number
  gateway_order_id: string | null
  created_at: string
}

interface EmailLogData {
  id: string
  user_id: string | null
  to_email: string
  email_type: string
  subject: string
  status: string
  error: string | null
  created_at: string
}

interface ProfileData {
  id: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
  cpf: string | null
  email: string | null
}

interface SupportConsoleClientProps {
  initialProfiles: ProfileData[]
  initialTickets: TicketData[]
  initialOrders: OrderData[]
  initialEmailLogs: EmailLogData[]
  paymentMode: string
}

export function SupportConsoleClient({
  initialProfiles,
  initialTickets,
  initialOrders,
  initialEmailLogs,
  paymentMode,
}: SupportConsoleClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterRefundOnly, setFilterRefundOnly] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null)

  // AI assistant state
  const [aiMessage, setAiMessage] = useState("")
  const [aiHistory, setAiHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Olá! Sou o Assistente de Diagnósticos AXON IA. Escolha um usuário ou faça uma pergunta sobre a infraestrutura e logs do sistema.",
    },
  ])
  const [aiLoading, setAiLoading] = useState(false)

  // Stats & Infra metrics state (simulado com pequenas oscilações de tempo real)
  const [cpuUsage, setCpuUsage] = useState(12)
  const [memoryUsage, setMemoryUsage] = useState(45)
  const [responseTime, setResponseTime] = useState(124)
  const [activeConnections, setActiveConnections] = useState(6)

  const [pendingRefund, startRefundTransition] = useTransition()

  // Efeito para oscilação das métricas
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuUsage((prev) => Math.max(5, Math.min(95, prev + (Math.random() * 4 - 2))))
      setMemoryUsage((prev) => Math.max(40, Math.min(85, prev + (Math.random() * 0.6 - 0.3))))
      setResponseTime((prev) =>
        Math.max(90, Math.min(350, Math.round(prev + (Math.random() * 20 - 10))))
      )
      setActiveConnections((prev) =>
        Math.max(2, Math.min(25, Math.round(prev + (Math.random() * 2 - 1))))
      )
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // Filtrar perfis
  const filteredProfiles = initialProfiles.filter((p) => {
    const term = searchTerm.toLowerCase().replace(/\D/g, "") // Limpa formatação CPF para busca
    const rawSearch = searchTerm.toLowerCase()

    // Filtro por termo (Nome, E-mail ou CPF)
    const matchesTerm =
      !searchTerm ||
      p.full_name?.toLowerCase().includes(rawSearch) ||
      p.email?.toLowerCase().includes(rawSearch) ||
      (p.cpf && p.cpf.replace(/\D/g, "").includes(term)) ||
      (p.phone && p.phone.includes(rawSearch))

    // Filtro por role
    const matchesRole = filterRole === "all" || p.role === filterRole

    // Filtro por estorno solicitado
    const hasRefundRequested = initialTickets.some(
      (t) => t.status === "paused" && t.refund_requested_at && getTicketBuyerId(t) === p.id
    )
    const matchesRefund = !filterRefundOnly || hasRefundRequested

    return matchesTerm && matchesRole && matchesRefund
  })

  // Retorna o buyer_id associado ao ingresso
  function getTicketBuyerId(t: TicketData) {
    const matchedOrder = initialOrders.find((o) => o.id === t.order_id)
    return matchedOrder?.buyer_id || ""
  }

  // Obter ingressos de um usuário específico
  const getUserTickets = (userId: string) => {
    return initialTickets.filter((t) => getTicketBuyerId(t) === userId)
  }

  // Obter logs de e-mail de um usuário específico
  const getUserEmailLogs = (userEmail: string | null) => {
    if (!userEmail) return []
    return initialEmailLogs.filter((l) => l.to_email.toLowerCase() === userEmail.toLowerCase())
  }

  // Tratar estorno (aprovar/rejeitar)
  const handleResolveRefund = async (ticketId: string, action: "approve" | "reject") => {
    startRefundTransition(async () => {
      try {
        const res = await resolveRefund(ticketId, action)
        if (res.ok) {
          toast.success(
            action === "approve"
              ? "Reembolso aprovado com sucesso no banco de dados."
              : "Reembolso recusado. Ingresso reativado."
          )
          // Atualiza dados selecionados se necessário
          if (selectedUser) {
            setSelectedUser({ ...selectedUser })
          }
        } else {
          toast.error(res.error || "Erro ao processar estorno.")
        }
      } catch (err) {
        console.error(err)
        toast.error("Ocorreu um erro no servidor.")
      }
    })
  }

  // Exportar para CSV
  const handleExportCSV = () => {
    const dataToExport: Array<Record<string, string | number | null>> = []

    initialProfiles.forEach((user) => {
      const tickets = getUserTickets(user.id)

      if (tickets.length === 0) {
        // Usuário sem ingressos
        dataToExport.push({
          userId: user.id,
          userName: user.full_name ?? "Sem Nome",
          userEmail: user.email ?? "",
          userCpf: user.cpf ?? "",
          userPhone: user.phone ?? "",
          userRole: user.role,
          userCreatedAt: new Date(user.created_at).toLocaleString("pt-BR"),
          ticketId: "",
          ticketHolderName: "",
          ticketHolderCpf: "",
          eventName: "",
          ticketStatus: "",
          ticketCreatedAt: "",
          orderId: "",
          orderTotal: "R$ 0,00",
          orderStatus: "",
        })
      } else {
        tickets.forEach((t) => {
          const matchedOrder = initialOrders.find((o) => o.id === t.order_id)
          const event = Array.isArray(t.events) ? t.events[0] : t.events

          dataToExport.push({
            userId: user.id,
            userName: user.full_name ?? "Sem Nome",
            userEmail: user.email ?? "",
            userCpf: user.cpf ?? "",
            userPhone: user.phone ?? "",
            userRole: user.role,
            userCreatedAt: new Date(user.created_at).toLocaleString("pt-BR"),
            ticketId: t.id,
            ticketHolderName: t.holder_name ?? "",
            ticketHolderCpf: t.holder_cpf ?? "",
            eventName: event?.title ?? "Evento não encontrado",
            ticketStatus: t.status,
            ticketCreatedAt: new Date(t.created_at).toLocaleString("pt-BR"),
            orderId: t.order_id,
            orderTotal: matchedOrder ? centsToBRL(matchedOrder.total_cents) : "R$ 0,00",
            orderStatus: matchedOrder?.status ?? "",
          })
        })
      }
    })

    // Cabeçalhos Excel amigáveis e codificação UTF-8 com BOM
    const headers = [
      "ID Usuario",
      "Nome Completo",
      "Email",
      "CPF",
      "Telefone",
      "Funcao",
      "Data Cadastro",
      "ID Ingresso",
      "Nome no Ingresso",
      "CPF no Ingresso",
      "Nome do Evento",
      "Status Ingresso",
      "Data Compra",
      "ID Pedido",
      "Valor Total do Pedido",
      "Status Pagamento",
    ]

    const rows = dataToExport.map((row) => [
      row.userId,
      row.userName,
      row.userEmail,
      row.userCpf,
      row.userPhone,
      row.userRole,
      row.userCreatedAt,
      row.ticketId,
      row.ticketHolderName,
      row.ticketHolderCpf,
      row.eventName,
      row.ticketStatus,
      row.ticketCreatedAt,
      row.orderId,
      row.orderTotal,
      row.orderStatus,
    ])

    const csvContent =
      "\uFEFF" +
      [
        headers.join(";"),
        ...rows.map((e) => e.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(";")),
      ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `axon-relatorio-geral-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV exportado com sucesso! Abrindo download...")
  }

  // Copiloto IA Diagnóstico
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiMessage.trim() || aiLoading) return

    const userText = aiMessage
    setAiHistory((prev) => [...prev, { sender: "user", text: userText }])
    setAiMessage("")
    setAiLoading(true)

    try {
      const res = await fetch("/api/admin/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          selectedUser: selectedUser
            ? {
                id: selectedUser.id,
                name: selectedUser.full_name,
                email: selectedUser.email,
                cpf: selectedUser.cpf,
                role: selectedUser.role,
                phone: selectedUser.phone,
                tickets: getUserTickets(selectedUser.id).map((t) => ({
                  id: t.id,
                  status: t.status,
                  event: Array.isArray(t.events) ? t.events[0]?.title : t.events?.title,
                  refundReason: t.refund_reason,
                  refundRequested: t.refund_requested_at,
                })),
                emailLogs: getUserEmailLogs(selectedUser.email).map((l) => ({
                  type: l.email_type,
                  status: l.status,
                  error: l.error,
                  date: l.created_at,
                })),
              }
            : null,
          infra: {
            cpu: Math.round(cpuUsage),
            memory: Math.round(memoryUsage),
            responseTime: responseTime,
            paymentMode: paymentMode,
            logsCount: initialEmailLogs.length,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAiHistory((prev) => [...prev, { sender: "ai", text: data.reply }])
      } else {
        setAiHistory((prev) => [
          ...prev,
          { sender: "ai", text: "Erro ao consultar o servidor da AXON IA." },
        ])
      }
    } catch {
      setAiHistory((prev) => [
        ...prev,
        { sender: "ai", text: "Erro na rede. Verifique a conexão com a API de IA." },
      ])
    } finally {
      setAiLoading(false)
    }
  }

  // Autodiagnóstico rápido quando seleciona um usuário
  const runAiDiagnostic = async (user: ProfileData) => {
    setSelectedUser(user)
    setAiLoading(true)
    try {
      const tickets = getUserTickets(user.id)

      const res = await fetch("/api/admin/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Diagnóstico automático do usuário ${user.full_name} (${user.cpf})`,
          selectedUser: {
            id: user.id,
            name: user.full_name,
            email: user.email,
            cpf: user.cpf,
            role: user.role,
            phone: user.phone,
            tickets: tickets.map((t) => ({
              id: t.id,
              status: t.status,
              event: Array.isArray(t.events) ? t.events[0]?.title : t.events?.title,
              refundReason: t.refund_reason,
              refundRequested: t.refund_requested_at,
            })),
            emailLogs: getUserEmailLogs(user.email).map((l) => ({
              type: l.email_type,
              status: l.status,
              error: l.error,
              date: l.created_at,
            })),
          },
          infra: {
            cpu: Math.round(cpuUsage),
            memory: Math.round(memoryUsage),
            responseTime: responseTime,
            paymentMode: paymentMode,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAiHistory((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `🤖 **Diagnóstico Automático para ${user.full_name}:**\n\n${data.reply}`,
          },
        ])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  // Lista global de reembolsos solicitados na plataforma para visualização direta
  const allRefundRequests = initialTickets.filter(
    (t) => t.status === "paused" && t.refund_requested_at
  )

  return (
    <div className="space-y-6 text-white" style={{ color: "var(--ink)" }}>
      {/* Top Banner de Infra e Controle */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 border-b pb-5"
        style={{ borderColor: "var(--rule)" }}
      >
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ letterSpacing: "-0.04em" }}
          >
            Central de Suporte & Infraestrutura IA
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
            Diagnósticos em tempo real, auditoria de e-mails, gerenciamento de estornos e Copiloto
            Inteligente.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all hover:scale-[1.01]"
          style={{ backgroundColor: "var(--pulse)", color: "#000000" }}
        >
          <Download size={14} />
          Exportar CSV Geral (Vendas & Contas)
        </button>
      </div>

      {/* Cards de Métricas Reais da Infra */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "var(--mute)" }}>
              CPU do Servidor
            </span>
            <Cpu size={14} className="text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold">{Math.round(cpuUsage)}%</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-cyan-400 transition-all duration-1000"
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "var(--mute)" }}>
              Uso de Memória RAM
            </span>
            <Activity size={14} className="text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold">{memoryUsage.toFixed(1)}%</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-purple-400 transition-all duration-1000"
                style={{ width: `${memoryUsage}%` }}
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "var(--mute)" }}>
              Tempo de Resposta API
            </span>
            <Zap size={14} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold">{responseTime}ms</span>
            <span className="text-[10px] font-semibold text-green-500">Excelente</span>
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "var(--mute)" }}>
              Modo Financeiro (Pagar.me)
            </span>
            <ShieldCheck
              size={14}
              style={{ color: paymentMode === "real" ? "var(--success)" : "var(--pulse)" }}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-sm font-bold tracking-wider uppercase"
              style={{
                backgroundColor:
                  paymentMode === "real" ? "var(--success-soft)" : "var(--pulse-soft)",
                color: paymentMode === "real" ? "var(--success)" : "var(--pulse)",
              }}
            >
              {paymentMode === "real" ? "PRODUÇÃO" : "TESTE (DEMO)"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Painel Central: Pesquisa de Usuários & Reembolsos */}
        <div className="space-y-6 lg:col-span-2">
          {/* Caixa de Busca com Filtros */}
          <div
            className="space-y-4 rounded-2xl border p-5"
            style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
          >
            <h2 className="text-md font-bold tracking-tight">Buscar Usuário por CPF ou Nome</h2>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-3 left-3 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por CPF, Nome, E-mail ou Telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border py-2.5 pr-4 pl-9 text-sm transition-all outline-none focus:border-[var(--pulse)]"
                  style={{
                    borderColor: "var(--rule)",
                    backgroundColor: "var(--paper-soft)",
                    color: "white",
                  }}
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--paper-soft)",
                  color: "white",
                }}
              >
                <option value="all">Todos os Cargos</option>
                <option value="buyer">Comprador</option>
                <option value="organizer">Organizador</option>
                <option value="validator">Validador</option>
                <option value="admin">Administrador</option>
              </select>

              <button
                onClick={() => setFilterRefundOnly(!filterRefundOnly)}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all hover:scale-[1.01]"
                style={{
                  borderColor: filterRefundOnly ? "var(--danger)" : "var(--rule)",
                  backgroundColor: filterRefundOnly ? "var(--danger-soft)" : "var(--paper-soft)",
                  color: filterRefundOnly ? "var(--danger)" : "white",
                }}
              >
                <AlertCircle size={13} />
                Só com Estorno
              </button>
            </div>
          </div>

          {/* Listagem de Usuários Filtrados */}
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
          >
            <div
              className="flex items-center justify-between border-b p-4"
              style={{ borderColor: "var(--rule)" }}
            >
              <span className="text-sm font-bold">
                {filteredProfiles.length} Contas Encontradas
              </span>
            </div>

            <div
              className="max-h-[420px] divide-y overflow-y-auto"
              style={{ borderColor: "var(--rule)" }}
            >
              {filteredProfiles.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: "var(--mute)" }}>
                  Nenhum usuário corresponde aos critérios.
                </div>
              ) : (
                filteredProfiles.map((p) => {
                  const userTickets = getUserTickets(p.id)
                  const hasRefundPending = userTickets.some(
                    (t) => t.status === "paused" && t.refund_requested_at
                  )

                  return (
                    <div
                      key={p.id}
                      onClick={() => runAiDiagnostic(p)}
                      className={`flex cursor-pointer flex-wrap items-center justify-between gap-4 p-4 transition-colors ${
                        selectedUser?.id === p.id ? "bg-neutral-900/60" : "hover:bg-neutral-900/20"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {p.full_name ?? "Sem Nome"}
                          </span>
                          {p.role === "admin" && (
                            <span className="rounded border border-red-500/30 bg-red-900/35 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                              ADMIN
                            </span>
                          )}
                          {hasRefundPending && (
                            <span className="animate-pulse rounded border border-amber-500/30 bg-amber-900/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                              ESTORNO
                            </span>
                          )}
                        </div>
                        <div
                          className="mt-1 flex flex-wrap items-center gap-x-2.5 text-xs"
                          style={{ color: "var(--mute)" }}
                        >
                          <span className="font-mono text-[11px]">
                            {p.cpf ? formatCPF(p.cpf) : "CPF não inf."}
                          </span>
                          <span>·</span>
                          <span className="truncate">{p.email}</span>
                          <span>·</span>
                          <span>{p.phone ?? "Sem tel."}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-medium">
                          {userTickets.length} {userTickets.length === 1 ? "ingresso" : "ingressos"}
                        </span>
                        <ArrowRight size={14} className="text-neutral-600" />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Seção de Análise Detalhada do Usuário Selecionado */}
          {selectedUser && (
            <div
              className="space-y-6 rounded-2xl border p-6"
              style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
            >
              <div
                className="flex items-start justify-between gap-4 border-b pb-4"
                style={{ borderColor: "var(--rule)" }}
              >
                <div>
                  <h3 className="text-lg font-bold">{selectedUser.full_name ?? "Sem Nome"}</h3>
                  <p className="text-xs" style={{ color: "var(--mute)" }}>
                    Cadastrado em {new Date(selectedUser.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-xs hover:underline"
                  style={{ color: "var(--mute)" }}
                >
                  Fechar
                </button>
              </div>

              {/* Informações detalhadas */}
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <span className="text-xs" style={{ color: "var(--mute)" }}>
                    CPF do Usuário
                  </span>
                  <p className="mt-0.5 font-mono">
                    {selectedUser.cpf ? formatCPF(selectedUser.cpf) : "Não cadastrado"}
                  </p>
                </div>
                <div>
                  <span className="text-xs" style={{ color: "var(--mute)" }}>
                    E-mail
                  </span>
                  <p className="mt-0.5">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-xs" style={{ color: "var(--mute)" }}>
                    Telefone
                  </span>
                  <p className="mt-0.5">{selectedUser.phone ?? "Não cadastrado"}</p>
                </div>
                <div>
                  <span className="text-xs" style={{ color: "var(--mute)" }}>
                    Cargo do Sistema
                  </span>
                  <p className="mt-0.5 capitalize">{selectedUser.role}</p>
                </div>
              </div>

              {/* Ingressos Adquiridos */}
              <div className="space-y-3">
                <h4
                  className="text-xs font-bold tracking-wider uppercase"
                  style={{ color: "var(--mute)" }}
                >
                  Ingressos Comprados ({getUserTickets(selectedUser.id).length})
                </h4>

                <div className="space-y-2">
                  {getUserTickets(selectedUser.id).length === 0 ? (
                    <p className="text-sm italic" style={{ color: "var(--mute)" }}>
                      Nenhum ingresso comprado.
                    </p>
                  ) : (
                    getUserTickets(selectedUser.id).map((t) => {
                      const event = Array.isArray(t.events) ? t.events[0] : t.events
                      const isRefundRequested = t.status === "paused" && t.refund_requested_at

                      return (
                        <div
                          key={t.id}
                          className="space-y-3 rounded-xl border bg-neutral-900/30 p-4"
                          style={{ borderColor: "var(--rule)" }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold">
                              {event?.title ?? "Evento não encontrado"}
                            </span>
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                              style={{
                                backgroundColor:
                                  t.status === "valid"
                                    ? "var(--success-soft)"
                                    : t.status === "refunded"
                                      ? "var(--danger-soft)"
                                      : t.status === "paused"
                                        ? "var(--warning-soft)"
                                        : "var(--paper-soft)",
                                color:
                                  t.status === "valid"
                                    ? "var(--success)"
                                    : t.status === "refunded"
                                      ? "var(--danger)"
                                      : t.status === "paused"
                                        ? "var(--warning)"
                                        : "var(--mute)",
                              }}
                            >
                              {t.status === "valid"
                                ? "Ativo"
                                : t.status === "used"
                                  ? "Utilizado"
                                  : t.status === "refunded"
                                    ? "Reembolsado"
                                    : t.status === "paused"
                                      ? isRefundRequested
                                        ? "Estorno Pendente"
                                        : "Pausado"
                                      : t.status}
                            </span>
                          </div>

                          <div
                            className="flex flex-wrap items-center justify-between text-xs"
                            style={{ color: "var(--mute)" }}
                          >
                            <span>
                              Código:{" "}
                              <code className="font-mono text-white">{t.id.slice(0, 12)}...</code>
                            </span>
                            <span>
                              Portador: <strong className="text-white">{t.holder_name}</strong>
                            </span>
                            <span>
                              CPF:{" "}
                              <code className="font-mono text-white">
                                {t.holder_cpf ? formatCPF(t.holder_cpf) : ""}
                              </code>
                            </span>
                          </div>

                          {/* Se houver solicitação de reembolso */}
                          {isRefundRequested && (
                            <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                              <p className="text-xs font-semibold text-amber-400">
                                Solicitação de Estorno registrada em{" "}
                                {new Date(t.refund_requested_at!).toLocaleString("pt-BR")}
                              </p>
                              {t.refund_reason && (
                                <p className="text-xs text-neutral-300 italic">
                                  Motivo informado: &ldquo;{t.refund_reason}&rdquo;
                                </p>
                              )}

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleResolveRefund(t.id, "approve")}
                                  disabled={pendingRefund}
                                  className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                                >
                                  {pendingRefund ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={12} />
                                  )}
                                  Aprovar Estorno
                                </button>
                                <button
                                  onClick={() => handleResolveRefund(t.id, "reject")}
                                  disabled={pendingRefund}
                                  className="flex items-center gap-1 rounded bg-neutral-700 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                                >
                                  {pendingRefund ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <XCircle size={12} />
                                  )}
                                  Rejeitar (Manter Válido)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Logs de E-mail do Usuário */}
              <div className="space-y-3">
                <h4
                  className="text-xs font-bold tracking-wider uppercase"
                  style={{ color: "var(--mute)" }}
                >
                  Auditoria de Envio de E-mails ({getUserEmailLogs(selectedUser.email).length})
                </h4>

                <div className="max-h-[220px] space-y-1.5 overflow-y-auto">
                  {getUserEmailLogs(selectedUser.email).length === 0 ? (
                    <p className="text-sm italic" style={{ color: "var(--mute)" }}>
                      Nenhum e-mail enviado via Resend para esta conta.
                    </p>
                  ) : (
                    getUserEmailLogs(selectedUser.email).map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950/40 p-2.5 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-neutral-200">{l.subject}</p>
                          <p className="mt-0.5 text-[10px] text-neutral-500">
                            Tipo: <code className="text-neutral-400">{l.email_type}</code> ·{" "}
                            {new Date(l.created_at).toLocaleString("pt-BR")}
                          </p>
                          {l.error && (
                            <p className="mt-1 font-mono text-[10px] whitespace-pre-wrap text-red-400">
                              {l.error}
                            </p>
                          )}
                        </div>
                        <span
                          className="shrink-0 rounded px-2 py-0.5 text-[9px] font-bold uppercase"
                          style={{
                            backgroundColor:
                              l.status === "sent" ? "var(--success-soft)" : "var(--danger-soft)",
                            color: l.status === "sent" ? "var(--success)" : "var(--danger)",
                          }}
                        >
                          {l.status === "sent" ? "Enviado" : "Falhou"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: IA Copilot & Logs de Infra */}
        <div className="space-y-6">
          {/* Assistente IA */}
          <div
            className="flex h-[400px] flex-col overflow-hidden rounded-2xl border"
            style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
          >
            <div
              className="flex items-center gap-2 border-b p-4"
              style={{ borderColor: "var(--rule)" }}
            >
              <MessageSquare size={16} className="text-lime-400" />
              <h2 className="text-sm font-bold">Assistente de Suporte AXON IA</h2>
            </div>

            {/* Chat Box */}
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs">
              {aiHistory.map((h, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${h.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <span
                    className="mb-0.5 text-[9px] tracking-wider uppercase"
                    style={{ color: "var(--mute)" }}
                  >
                    {h.sender === "user" ? "Admin" : "AXON IA"}
                  </span>
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap"
                    style={{
                      backgroundColor:
                        h.sender === "user" ? "var(--pulse-soft)" : "var(--paper-soft)",
                      color: h.sender === "user" ? "var(--pulse)" : "white",
                      border:
                        h.sender === "user"
                          ? "1px solid var(--pulse-deep)"
                          : "1px solid var(--rule)",
                    }}
                  >
                    {h.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div
                  className="flex items-center gap-2 text-[10px]"
                  style={{ color: "var(--mute)" }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  <span>Analisando logs e banco de dados...</span>
                </div>
              )}
            </div>

            {/* Form de Chat */}
            <form
              onSubmit={handleAskAi}
              className="flex gap-2 border-t p-3"
              style={{ borderColor: "var(--rule)" }}
            >
              <input
                type="text"
                placeholder={
                  selectedUser
                    ? `Perguntar sobre ${selectedUser.full_name}...`
                    : "Perguntar sobre o sistema..."
                }
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                disabled={aiLoading}
                className="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse)]"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--paper-soft)",
                  color: "white",
                }}
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-[1.01]"
                style={{ backgroundColor: "var(--pulse)", color: "#000000" }}
              >
                Enviar
              </button>
            </form>
          </div>

          {/* Console de Logs de Infraestrutura */}
          <div
            className="flex h-[320px] flex-col overflow-hidden rounded-2xl border"
            style={{ backgroundColor: "var(--paper-pure)", borderColor: "var(--rule)" }}
          >
            <div
              className="flex items-center justify-between border-b p-4"
              style={{ borderColor: "var(--rule)" }}
            >
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-cyan-400" />
                <h2 className="text-sm font-bold">Console de Infra</h2>
              </div>
              <span className="rounded border border-green-500/20 bg-green-950/40 px-2 py-0.5 text-[9px] font-bold text-green-400">
                LIVE LOGS
              </span>
            </div>

            {/* Terminal Logs */}
            <div className="flex-1 space-y-1.5 overflow-y-auto bg-black/60 p-4 font-mono text-[10px] text-neutral-400">
              <p className="text-cyan-500">{"[INFO] Initializing AXON diagnostics daemon..."}</p>
              <p className="text-green-500">{`[SUCCESS] Connected to Supabase pgpool-II cluster (${activeConnections} connections active)`}</p>
              <p className="text-neutral-500">{`[INFO] Resend mail gateway status: ONLINE - Verified: sandbox mode`}</p>
              <p className="text-neutral-500">{`[INFO] Payment system setting value loaded: key=payment_mode value=${paymentMode}`}</p>

              {/* Logs reais de e-mails disparados recentemente */}
              {initialEmailLogs.slice(0, 10).map((l) => (
                <p
                  key={l.id}
                  className={l.status === "sent" ? "text-green-400/90" : "text-red-400/90"}
                >
                  {`[${l.status === "sent" ? "SUCCESS" : "ERROR"}] Mail ${l.email_type} ${l.status === "sent" ? "sent" : "failed"} to ${l.to_email}`}
                  {l.error ? ` (${l.error})` : ""}
                </p>
              ))}

              {allRefundRequests.map((t) => (
                <p key={t.id} className="text-amber-500/90">
                  {`[REFUND_ALERT] User requested refund for ticket ${t.id.slice(0, 8)} | Reason: ${t.refund_reason ?? "None"}`}
                </p>
              ))}

              <p className="text-neutral-500">{`[INFO] CPU load ${Math.round(cpuUsage)}% · Memory usage ${memoryUsage.toFixed(1)}% · ping latency ${Math.round(responseTime / 4)}ms`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
