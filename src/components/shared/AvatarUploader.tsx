"use client"

import { useRef, useState, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  userId: string
  initialUrl: string | null
  fullName: string | null
  email: string | null
}

const MAX_BYTES = 2 * 1024 * 1024 // 2MB

export function AvatarUploader({ userId, initialUrl, fullName, email }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const initials = fullName
    ? fullName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : (email?.[0]?.toUpperCase() ?? "U")

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError("Arquivo muito grande (máx 2 MB).")
      return
    }
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setError("Formato inválido. Use PNG, JPG, WEBP ou GIF.")
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
      const path = `${userId}/avatar-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      })
      if (upErr) {
        setError(upErr.message)
        return
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      const publicUrl = data.publicUrl

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId)
      if (updErr) {
        setError(updErr.message)
        return
      }

      setUrl(publicUrl)
      router.refresh()
    })
  }

  async function removeAvatar() {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId)
      if (updErr) {
        setError(updErr.message)
        return
      }
      setUrl(null)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <Avatar className="h-20 w-20">
          {url ? <AvatarImage src={url} alt={fullName ?? "Avatar"} /> : null}
          <AvatarFallback
            className="text-2xl font-bold"
            style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {pending && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(10,10,11,0.5)" }}
          >
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--pulse)" }} />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-transform hover:scale-[1.03] disabled:opacity-50"
            style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
          >
            <Camera size={12} />
            {url ? "Trocar foto" : "Adicionar foto"}
          </button>
          {url && (
            <button
              type="button"
              onClick={removeAvatar}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--danger-soft)] disabled:opacity-50"
              style={{ borderColor: "var(--rule)", color: "var(--danger)" }}
            >
              <Trash2 size={12} />
              Remover
            </button>
          )}
        </div>
        <p className="text-[11px]" style={{ color: "var(--mute)" }}>
          PNG, JPG, WEBP ou GIF · até 2 MB
        </p>
        {error && (
          <p className="text-[11px]" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
