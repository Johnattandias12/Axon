import { z } from "zod"
import { cpfSchema, fullNameSchema } from "./common"

export const halfPriceDocTypeSchema = z.enum(
  ["estudante", "idoso", "pcd", "professor", "jovem_baixa_renda"],
  { errorMap: () => ({ message: "Tipo de documento inválido" }) }
)

export const ticketHolderSchema = z
  .object({
    lot_id: z.string().uuid("Lote inválido"),
    position: z.number().int().nonnegative(),
    name: fullNameSchema,
    cpf: cpfSchema,
    birth_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)")
      .optional(),
    email: z.string().email("E-mail inválido").optional(),
    is_half_price: z.boolean().default(false),
    half_doc_type: halfPriceDocTypeSchema.optional(),
    half_doc_number: z.string().trim().min(3).max(40).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_half_price && !data.half_doc_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["half_doc_type"],
        message: "Informe o tipo de meia-entrada",
      })
    }
    if (data.is_half_price && !data.half_doc_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["half_doc_number"],
        message: "Informe o número do documento",
      })
    }
  })

export const ticketHoldersBatchSchema = z
  .array(ticketHolderSchema)
  .min(1, "Informe ao menos um titular")
  .max(50, "Limite de 50 titulares por pedido")
  .superRefine((arr, ctx) => {
    const seen = new Set<string>()
    arr.forEach((h, i) => {
      if (seen.has(h.cpf)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, "cpf"],
          message: "CPF duplicado no pedido",
        })
      }
      seen.add(h.cpf)
    })
  })

export type TicketHolderInput = z.infer<typeof ticketHolderSchema>
export type TicketHoldersBatchInput = z.infer<typeof ticketHoldersBatchSchema>
export type HalfPriceDocType = z.infer<typeof halfPriceDocTypeSchema>
