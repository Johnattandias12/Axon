"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

const signupSchema = loginSchema.extend({
  full_name: z.string().min(2, "Nome obrigatório"),
})

type LoginData = z.infer<typeof loginSchema>
type SignupData = z.infer<typeof signupSchema>

export function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login")
  const [showPass, setShowPass] = useState(false)
  const [globalError, setGlobalError] = useState("")
  const [resetSent, setResetSent] = useState(false)

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const signupForm = useForm<SignupData>({ resolver: zodResolver(signupSchema) })
  const resetForm = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email("E-mail inválido") })),
  })

  const handleLogin = async (data: LoginData) => {
    setGlobalError("")
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setGlobalError("E-mail ou senha incorretos.")
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  const handleSignup = async (data: SignupData) => {
    setGlobalError("")
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } },
    })
    if (error) {
      setGlobalError(
        error.message.includes("already") ? "E-mail já cadastrado." : "Erro ao criar conta."
      )
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  const handleReset = async (data: { email: string }) => {
    setGlobalError("")
    const supabase = createClient()
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? window.location.origin
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${appUrl}/api/auth/callback?next=/minha-conta`,
    })
    setResetSent(true)
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
          <p
            className="rounded-xl border p-4 text-sm"
            style={{
              borderColor: "var(--success)",
              color: "var(--success)",
              backgroundColor: "var(--success-soft)",
            }}
          >
            Link enviado. Verifique sua caixa de entrada.
          </p>
        ) : (
          <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
            <div className="space-y-1.5">
              <Label style={{ color: "var(--ink)" }}>E-mail</Label>
              <Input
                {...resetForm.register("email")}
                type="email"
                placeholder="seu@email.com"
                autoFocus
              />
              {resetForm.formState.errors.email && (
                <p className="text-xs" style={{ color: "var(--danger)" }}>
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
        )}
        <button
          onClick={() => setMode("login")}
          className="text-sm"
          style={{ color: "var(--mute)" }}
        >
          Voltar ao login
        </button>
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
        <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
          <div className="space-y-1.5">
            <Label style={{ color: "var(--ink)" }}>Nome</Label>
            <Input {...signupForm.register("full_name")} placeholder="Seu nome" autoFocus />
            {signupForm.formState.errors.full_name && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {signupForm.formState.errors.full_name.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: "var(--ink)" }}>E-mail</Label>
            <Input {...signupForm.register("email")} type="email" placeholder="seu@email.com" />
            {signupForm.formState.errors.email && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {signupForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: "var(--ink)" }}>Senha</Label>
            <div className="relative">
              <Input
                {...signupForm.register("password")}
                type={showPass ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute top-1/2 right-3 -translate-y-1/2"
                style={{ color: "var(--mute)" }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {signupForm.formState.errors.password && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {signupForm.formState.errors.password.message}
              </p>
            )}
          </div>
          {globalError && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {globalError}
            </p>
          )}
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
      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
        <div className="space-y-1.5">
          <Label style={{ color: "var(--ink)" }}>E-mail</Label>
          <Input
            {...loginForm.register("email")}
            type="email"
            placeholder="seu@email.com"
            autoFocus
          />
          {loginForm.formState.errors.email && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              {loginForm.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label style={{ color: "var(--ink)" }}>Senha</Label>
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
              {...loginForm.register("password")}
              type={showPass ? "text" : "password"}
              placeholder="Sua senha"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute top-1/2 right-3 -translate-y-1/2"
              style={{ color: "var(--mute)" }}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {loginForm.formState.errors.password && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              {loginForm.formState.errors.password.message}
            </p>
          )}
        </div>
        {globalError && (
          <p
            className="rounded-lg border p-3 text-sm"
            style={{
              borderColor: "var(--danger-soft)",
              color: "var(--danger)",
              backgroundColor: "var(--danger-soft)",
            }}
          >
            {globalError}
          </p>
        )}
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
