export function centsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100)
}

export function brlToCents(value: string): number {
  const clean = value.replace(/[^\d,]/g, "").replace(",", ".")
  return Math.round(parseFloat(clean) * 100)
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    opts ?? { dateStyle: "short", timeStyle: "short" }
  ).format(typeof date === "string" ? new Date(date) : date)
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function generateUniqueSlug(title: string, suffix?: string): string {
  const base = slugify(title)
  if (suffix) return `${base}-${suffix}`
  return `${base}-${Date.now().toString(36)}`
}
