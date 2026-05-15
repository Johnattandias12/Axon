"use client"

import { useRef, useState, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { uploadAvatar, removeAvatar } from "@/app/minha-conta/actions"

interface Props {
  userId: string
  initialUrl: string | null
  fullName: string | null
  email: string | null
}

export function AvatarUploader({ initialUrl, fullName, email }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl)
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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.set("file", file)
    startTransition(async () => {
      const r = await uploadAvatar(null, fd)
      if (r.ok) {
        setUrl(r.url)
        toast.success("Foto atualizada")
        router.refresh()
      } else {
        toast.error(r.error)
      }
    })
    // Limpa input pra permitir re-upload do mesmo arquivo
    e.target.value = ""
  }

  function handleRemove() {
    startTransition(async () => {
      const r = await removeAvatar()
      if (r.ok) {
        setUrl(null)
        toast.success("Foto removida")
        router.refresh()
      } else {
        toast.error(r.error)
      }
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
              onClick={handleRemove}
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
