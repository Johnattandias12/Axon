"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TurnstileWidget } from "@/components/shared/TurnstileWidget"
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
  const [turnstileToken, setTurnstileToken] = useState<string>("")

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

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    try {
      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${appUrl}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) {
        toast.error(`Erro ao entrar com ${provider}: ${error.message}`)
      }
    } catch {
      toast.error("Erro inesperado ao iniciar login social.")
    }
  }

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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      })
      const body = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null
      toast.dismiss(loadingId)
      if (!res.ok || !body?.ok) {
        toast.error(body?.error || "Não foi possível enviar agora. Tente em alguns minutos.")
        return
      }
      setResetSent(true)
      toast.success("E-mail enviado. Confere a caixa de entrada (e o spam).")
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
              <TurnstileWidget onToken={setTurnstileToken} />
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

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" style={{ borderColor: "var(--rule)" }} />
          </div>
          <span
            className="relative px-3 text-xs uppercase"
            style={{ backgroundColor: "var(--paper-pure)", color: "var(--mute)" }}
          >
            ou continue com
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin("google")}
            className="flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin("facebook")}
            className="flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
            </svg>
            Facebook
          </Button>
        </div>

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

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" style={{ borderColor: "var(--rule)" }} />
        </div>
        <span
          className="relative px-3 text-xs uppercase"
          style={{ backgroundColor: "var(--paper-pure)", color: "var(--mute)" }}
        >
          ou continue com
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin("google")}
          className="flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin("facebook")}
          className="flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
          </svg>
          Facebook
        </Button>
      </div>

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
