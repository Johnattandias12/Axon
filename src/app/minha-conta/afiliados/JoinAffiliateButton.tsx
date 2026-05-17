"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { joinAffiliate } from "./actions"
import { Loader2, Sparkles } from "lucide-react"

export function JoinAffiliateButton() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      const res = await joinAffiliate()
      if (res?.ok) {
        toast.success(`Bem-vindo ao programa. Seu código é ${res.code}`)
        router.refresh()
      } else if (res?.ok === false) {
        toast.error(res.error)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-xl px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.02] disabled:opacity-50"
      style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
    >
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Criando seu código…
        </>
      ) : (
        <>
          <Sparkles size={14} />
          Entrar no programa
        </>
      )}
    </button>
  )
}
