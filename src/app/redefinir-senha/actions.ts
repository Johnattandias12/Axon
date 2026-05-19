"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get("password")?.toString()
  const confirmPassword = formData.get("confirmPassword")?.toString()

  if (!password || !confirmPassword || password !== confirmPassword) {
    redirect("/redefinir-senha?error=As senhas não coincidem ou são inválidas")
  }

  if (password.length < 6) {
    redirect("/redefinir-senha?error=A senha deve ter pelo menos 6 caracteres")
  }

  const supabase = await createClient()

  // Supabase Auth updates the password of the currently logged in user
  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    redirect(`/redefinir-senha?error=${error.message}`)
  }

  redirect("/minha-conta?tab=seguranca&msg=Senha+atualizada+com+sucesso")
}
