"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react"

const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

const signupSchema = loginSchema.extend({
  full_name: z
    .string()
    .min(2, "Informe seu nome completo")
    .max(120, "Nome muito longo")
    .regex(/\s/, "Inclua sobrenome"),
})

const resetSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
})

type LoginData = z.infer<typeof loginSchema>
type SignupData = z.infer<typeof signupSchema>
type ResetData = z.infer<typeof resetSchema>

function mapSupabaseError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos."
  if (m.includes("email not confirmed"))
    return "Você ainda não confirmou seu e-mail. Verifique sua caixa de entrada."
  if (m.includes("user already registered") || m.includes("already"))
    return "Este e-mail já está cadastrado. Faça login."
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo."
  if (m.includes("password") && m.includes("short"))
    return "Senha muito curta. Use ao menos 6 caracteres."
  if (m.includes("network") || m.includes("fetch"))
    return "Sem conexão. Verifique sua internet e tente novamente."
  return "Não foi possível entrar agora. Tente novamente em instantes."
}

export function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login")
  const [showPass, setShowPass] = useState(false)
  const [signupSuccessEmail, setSignupSuccessEmail] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })
  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", full_name: "" },
  })
  const resetForm = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  })

  const handleLogin = async (data: LoginData) => {
    const loadingId = toast.loading("Entrando...")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      })
      toast.dismiss(loadingId)
      if (error) {
        toast.error(mapSupabaseError(error.message))
        return
      }

      // Notifica login via email em background (best-effort)
      fetch("/api/auth/login-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAgent: window.navigator.userAgent,
          location: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }).catch(console.error)

      toast.success("Bem-vindo de volta! Bora encher o carrinho.", { duration: 2200 })
      // Hard navigation pra garantir que o header server-side reflita o login
      window.location.href = redirectTo
    } catch {
      toast.dismiss(loadingId)
      toast.error("Erro inesperado. Tente novamente.")
    }
  }

  const handleSignup = async (data: SignupData) => {
    const loadingId = toast.loading("Criando sua conta...")
    try {
      const supabase = createClient()
      const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? window.location.origin
      const { data: signupData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: { full_name: data.full_name.trim() },
          emailRedirectTo: `${appUrl}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      toast.dismiss(loadingId)
      if (error) {
        toast.error(mapSupabaseError(error.message))
        return
      }
      // Quando confirmação por e-mail está habilitada, session vem null
      if (!signupData.session) {
        setSignupSuccessEmail(data.email.trim().toLowerCase())
        toast.success("Conta criada! Verifique seu e-mail para ativar.")
        return
      }
      toast.success("Conta criada! Bora explorar.", { duration: 2200 })
      window.location.href = redirectTo
    } catch {
      toast.dismiss(loadingId)
      toast.error("Erro inesperado. Tente novamente.")
    }
  }

  const handleReset = async (data: ResetData) => {
    const loadingId = toast.loading("Enviando link...")
    try {
      const supabase = createClient()
      const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim().toLowerCase(), {
        redirectTo: `${appUrl}/api/auth/callback?next=/redefinir-senha`,
      })
      toast.dismiss(loadingId)
      if (error) {
        console.warn(
          "Supabase login page resetPasswordForEmail error (mocked success for UX):",
          error.message
        )
      }
      setResetSent(true)
      toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada.")
    } catch {
      toast.dismiss(loadingId)
      toast.error("Erro inesperado. Tente novamente.")
    }
  }

  // Tela: signup com sucesso aguardando confirmação por e-mail
  if (signupSuccessEmail) {
    return (
      <div className="space-y-5 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}
        >
          <MailCheck size={22} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
            Confirme seu e-mail
          </h2>
          <p className="text-sm" style={{ color: "var(--mute)" }}>
            Enviamos um link para
          </p>
          <p className="font-mono text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {signupSuccessEmail}
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--mute-2)" }}>
          Clique no link recebido para ativar sua conta e entrar.
        </p>
        <button
          onClick={() => {
            setSignupSuccessEmail(null)
            setMode("login")
          }}
          className="text-sm underline underline-offset-2"
          style={{ color: "var(--mute)" }}
        >
          Voltar ao login
        </button>
      </div>
    )
  }

  if (mode === "reset") {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
            Recuperar senha
          </h2>
          <p className="text-sm" style={{ color: "var(--mute)" }}>
            Enviaremos um link para redefinir.
          </p>
        </div>
        {resetSent ? (
          <div className="space-y-4">
            <p
              className="rounded-xl border p-4 text-sm"
              style={{
                borderColor: "var(--success)",
                color: "var(--success)",
                backgroundColor: "var(--success-soft)",
              }}
              role="status"
            >
              Link enviado. Verifique sua caixa de entrada (e o spam).
            </p>
            <button
              onClick={() => {
                setResetSent(false)
                setMode("login")
              }}
              className="text-sm underline underline-offset-2"
              style={{ color: "var(--mute)" }}
            >
              Voltar ao login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" style={{ color: "var(--ink)" }}>
                  E-mail
                </Label>
                <Input
                  id="reset-email"
                  {...resetForm.register("email")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  aria-invalid={!!resetForm.formState.errors.email}
                  autoFocus
                />
                {resetForm.formState.errors.email && (
                  <p className="text-xs" style={{ color: "var(--danger)" }} role="alert">
                    {resetForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="w-full"
                style={{
                  backgroundColor: "var(--pulse)",
                  color: "var(--pulse-ink)",
                  fontWeight: 600,
                }}
              >
                {resetForm.formState.isSubmitting ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
            <button
              onClick={() => setMode("login")}
              className="text-sm underline underline-offset-2"
              style={{ color: "var(--mute)" }}
            >
              Voltar ao login
            </button>
          </>
        )}
      </div>
    )
  }

  if (mode === "signup") {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
            Criar conta
          </h2>
          <p className="text-sm" style={{ color: "var(--mute)" }}>
            Gratuito. Sem cartão.
          </p>
        </div>
        <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="signup-name" style={{ color: "var(--ink)" }}>
              Nome completo
            </Label>
            <Input
              id="signup-name"
              {...signupForm.register("full_name")}
              autoComplete="name"
              placeholder="Seu nome"
              aria-invalid={!!signupForm.formState.errors.full_name}
              autoFocus
            />
            {signupForm.formState.errors.full_name && (
              <p className="text-xs" style={{ color: "var(--danger)" }} role="alert">
                {signupForm.formState.errors.full_name.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-email" style={{ color: "var(--ink)" }}>
              E-mail
            </Label>
            <Input
              id="signup-email"
              {...signupForm.register("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seu@email.com"
              aria-invalid={!!signupForm.formState.errors.email}
            />
            {signupForm.formState.errors.email && (
              <p className="text-xs" style={{ color: "var(--danger)" }} role="alert">
                {signupForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-pass" style={{ color: "var(--ink)" }}>
              Senha
            </Label>
            <div className="relative">
              <Input
                id="signup-pass"
                {...signupForm.register("password")}
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
                aria-invalid={!!signupForm.formState.errors.password}
              />
              <button
                type="button"
                aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPass(!showPass)}
                className="absolute top-1/2 right-3 -translate-y-1/2"
                style={{ color: "var(--mute)" }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {signupForm.formState.errors.password && (
              <p className="text-xs" style={{ color: "var(--danger)" }} role="alert">
                {signupForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={signupForm.formState.isSubmitting}
            className="w-full gap-2"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)", fontWeight: 600 }}
          >
            {signupForm.formState.isSubmitting ? (
              "Criando conta..."
            ) : (
              <>
                Criar conta <ArrowRight size={15} />
              </>
            )}
          </Button>
        </form>
        <p className="text-center text-sm" style={{ color: "var(--mute)" }}>
          Já tem conta?{" "}
          <button
            onClick={() => setMode("login")}
            className="font-semibold underline underline-offset-2"
            style={{ color: "var(--ink)" }}
          >
            Entrar
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
          Entrar
        </h2>
        <p className="text-sm" style={{ color: "var(--mute)" }}>
          Acesse sua conta AXON.
        </p>
      </div>
      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login-email" style={{ color: "var(--ink)" }}>
            E-mail
          </Label>
          <Input
            id="login-email"
            {...loginForm.register("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            aria-invalid={!!loginForm.formState.errors.email}
            autoFocus
          />
          {loginForm.formState.errors.email && (
            <p className="text-xs" style={{ color: "var(--danger)" }} role="alert">
              {loginForm.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-pass" style={{ color: "var(--ink)" }}>
              Senha
            </Label>
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="text-xs"
              style={{ color: "var(--mute)" }}
            >
              Esqueci a senha
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-pass"
              {...loginForm.register("password")}
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              className="pr-10"
              aria-invalid={!!loginForm.formState.errors.password}
            />
            <button
              type="button"
              aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPass(!showPass)}
              className="absolute top-1/2 right-3 -translate-y-1/2"
              style={{ color: "var(--mute)" }}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {loginForm.formState.errors.password && (
            <p className="text-xs" style={{ color: "var(--danger)" }} role="alert">
              {loginForm.formState.errors.password.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={loginForm.formState.isSubmitting}
          className="w-full gap-2"
          style={{ backgroundColor: "var(--ink)", color: "var(--paper)", fontWeight: 600 }}
        >
          {loginForm.formState.isSubmitting ? (
            "Entrando..."
          ) : (
            <>
              Entrar <ArrowRight size={15} />
            </>
          )}
        </Button>
      </form>
      <p className="text-center text-sm" style={{ color: "var(--mute)" }}>
        Não tem conta?{" "}
        <button
          onClick={() => setMode("signup")}
          className="font-semibold underline underline-offset-2"
          style={{ color: "var(--ink)" }}
        >
          Criar conta grátis
        </button>
      </p>
    </div>
  )
}
