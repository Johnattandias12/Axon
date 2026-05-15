"use client"

import { useRef, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Camera, Loader2, Trash2, ImagePlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  eventId?: string
  organizerId: string
  initialUrl: string | null
  onUpload?: (url: string) => void
}

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export function EventBannerUploader({ eventId, organizerId, initialUrl, onUpload }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError("Imagem muito grande (máx 5 MB).")
      return
    }
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Formato inválido. Use PNG, JPG ou WEBP.")
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
      const path = `${organizerId}/${eventId ?? "draft"}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage.from("event-banners").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      })
      if (upErr) {
        setError(upErr.message)
        return
      }
      const { data } = supabase.storage.from("event-banners").getPublicUrl(path)
      const publicUrl = data.publicUrl

      if (eventId) {
        const { error: updErr } = await supabase
          .from("events")
          .update({ banner_url: publicUrl })
          .eq("id", eventId)
        if (updErr) {
          setError(updErr.message)
          return
        }
      }

      setUrl(publicUrl)
      onUpload?.(publicUrl)
      router.refresh()
    })
  }

  async function removeBanner() {
    setError(null)
    if (!eventId) {
      setUrl(null)
      onUpload?.("")
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const { error: updErr } = await supabase
        .from("events")
        .update({ banner_url: null })
        .eq("id", eventId)
      if (updErr) {
        setError(updErr.message)
        return
      }
      setUrl(null)
      onUpload?.("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors"
        style={{
          borderColor: url ? "var(--rule)" : "var(--rule-strong)",
          backgroundColor: "var(--paper-soft)",
          aspectRatio: "21 / 9",
        }}
      >
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={url} alt="Banner" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <ImagePlus size={28} style={{ color: "var(--mute-2)" }} />
            <p className="text-xs font-medium" style={{ color: "var(--mute)" }}>
              Clique no botão abaixo para enviar o banner
            </p>
            <p className="text-[10px]" style={{ color: "var(--mute-2)" }}>
              PNG, JPG ou WEBP · até 5 MB · 21:9 recomendado
            </p>
          </div>
        )}
        {pending && (
          <div
            className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: "rgba(10,10,11,0.4)" }}
          >
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--pulse)" }} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-transform hover:scale-[1.03] disabled:opacity-50"
          style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
        >
          <Camera size={12} />
          {url ? "Trocar imagem" : "Enviar imagem"}
        </button>
        {url && (
          <button
            type="button"
            onClick={removeBanner}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--danger-soft)] disabled:opacity-50"
            style={{ borderColor: "var(--rule)", color: "var(--danger)" }}
          >
            <Trash2 size={12} />
            Remover
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
