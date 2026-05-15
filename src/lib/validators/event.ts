import { z } from "zod"
import { slugSchema, priceCentsSchema, quantitySchema, ufSchema, isoDateTimeSchema } from "./common"

export const eventCategorySchema = z.enum(["show", "esporte", "religioso", "curso", "outro"], {
  errorMap: () => ({ message: "Categoria inválida" }),
})

export const eventStatusSchema = z.enum(["draft", "published", "cancelled", "finished"])

export const coverPolicySchema = z.object({
  refund_days: z.number().int().min(0).max(60),
  partial_refund_pct: z.number().int().min(0).max(100),
})

export const ticketLotSchema = z
  .object({
    name: z.string().trim().min(2, "Nome do lote muito curto").max(80),
    price_cents: priceCentsSchema,
    quantity_total: quantitySchema,
    is_half_price: z.boolean().default(false),
    sales_starts_at: isoDateTimeSchema.optional(),
    sales_ends_at: isoDateTimeSchema.optional(),
    max_per_order: z.number().int().min(1).max(20).default(10),
  })
  .refine(
    (lot) =>
      !lot.sales_starts_at ||
      !lot.sales_ends_at ||
      new Date(lot.sales_ends_at) > new Date(lot.sales_starts_at),
    {
      message: "Fim das vendas deve ser depois do início",
      path: ["sales_ends_at"],
    }
  )

export const eventBaseSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(3, "Título muito curto").max(120, "Título muito longo"),
  description: z.string().trim().max(8_000).optional(),
  category: eventCategorySchema,
  banner_url: z.string().url("URL inválida").optional(),
  venue_name: z.string().trim().max(120).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  state: ufSchema.optional(),
  starts_at: isoDateTimeSchema,
  ends_at: isoDateTimeSchema.optional(),
  capacity: z.number().int().nonnegative().max(1_000_000).default(0),
  cover_policy: coverPolicySchema.default({ refund_days: 7, partial_refund_pct: 100 }),
  age_rating: z.string().trim().max(20).optional(),
  is_nominal: z.boolean().default(true),
})

export const createEventSchema = eventBaseSchema
  .extend({
    lots: z.array(ticketLotSchema).min(1, "Crie ao menos um lote").max(50, "Limite de 50 lotes"),
  })
  .superRefine((data, ctx) => {
    if (data.ends_at && new Date(data.ends_at) <= new Date(data.starts_at)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "Encerramento deve ser depois do início",
      })
    }

    // Lei 12.933/2013 — pelo menos 40% dos ingressos como meia-entrada
    const total = data.lots.reduce((acc, l) => acc + l.quantity_total, 0)
    const half = data.lots.reduce((acc, l) => acc + (l.is_half_price ? l.quantity_total : 0), 0)
    if (total > 0 && half / total < 0.4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lots"],
        message: "Mínimo 40% de meia-entrada (Lei 12.933/2013)",
      })
    }
  })

export const updateEventSchema = eventBaseSchema.partial().extend({
  id: z.string().uuid(),
  status: eventStatusSchema.optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type TicketLotInput = z.infer<typeof ticketLotSchema>
export type EventCategory = z.infer<typeof eventCategorySchema>
