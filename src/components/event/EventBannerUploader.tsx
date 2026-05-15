"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { Camera, Loader2, Trash2, ImagePlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { uploadEventBanner, removeEventBanner } from "@/app/organizador/eventos/[id]/editar/actions"
import { EventBannerPlaceholder } from "./EventBannerPlaceholder"

interface Props {
  eventId: string
  initialUrl: string | null
  category?: string
}

export function EventBannerUploader({ eventId, initialUrl, category = "outro" }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.set("eventId", eventId)
    fd.set("file", file)
    startTransition(async () => {
      const r = await uploadEventBanner(null, fd)
      if (r.ok) {
        setUrl(r.url)
        toast.success("Banner atualizado")
        router.refresh()
      } else {
        toast.error(r.error)
      }
    })
    e.target.value = ""
  }

  function handleRemove() {
    startTransition(async () => {
      const r = await removeEventBanner(eventId)
      if (r.ok) {
        setUrl(null)
        toast.success("Banner removido")
        router.refresh()
      } else {
        toast.error(r.error)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border transition-colors"
        style={{
          borderColor: url ? "var(--rule)" : "var(--rule-strong)",
          aspectRatio: "21 / 9",
        }}
      >
        {url ? (
          <Image
            src={url}
            alt="Banner do evento"
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover"
          />
        ) : (
          <EventBannerPlaceholder category={category} className="absolute inset-0" />
        )}
        {pending && (
          <div
            className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: "rgba(10,10,11,0.45)" }}
          >
            <Loader2 size={26} className="animate-spin" style={{ color: "var(--pulse)" }} />
          </div>
        )}
        {!url && !pending && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center text-white/85">
            <ImagePlus size={26} />
            <p className="text-sm font-semibold">Sem imagem ainda</p>
            <p className="text-[10px] opacity-80">PNG, JPG ou WEBP · até 5 MB · 21:9</p>
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
