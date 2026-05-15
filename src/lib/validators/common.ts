import { z } from "zod"
import { validateCPF, validateCNPJ } from "@/lib/utils/validators"

export const emailSchema = z
  .string()
  .min(1, "Informe o e-mail")
  .email("E-mail inválido")
  .max(254, "E-mail muito longo")
  .transform((v) => v.trim().toLowerCase())

export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos")
  .refine(validateCPF, "CPF inválido")

export const cnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 14, "CNPJ deve ter 14 dígitos")
  .refine(validateCNPJ, "CNPJ inválido")

export const cpfOrCnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine(
    (v) => (v.length === 11 && validateCPF(v)) || (v.length === 14 && validateCNPJ(v)),
    "CPF ou CNPJ inválido"
  )

export const brazilPhoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 10 || v.length === 11, "Telefone inválido (10 ou 11 dígitos)")

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Informe o nome completo")
  .max(120, "Nome muito longo")
  .regex(/\s/, "Inclua sobrenome")

export const slugSchema = z
  .string()
  .trim()
  .min(3, "Slug muito curto")
  .max(80, "Slug muito longo")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Use minúsculas, números e hífen")

export const priceCentsSchema = z
  .number({ invalid_type_error: "Valor inválido" })
  .int("Use valor em centavos (inteiro)")
  .nonnegative("Valor não pode ser negativo")
  .max(99_999_999, "Valor máximo excedido")

export const quantitySchema = z
  .number({ invalid_type_error: "Quantidade inválida" })
  .int("Quantidade inteira")
  .positive("Quantidade > 0")
  .max(100_000, "Quantidade muito alta")

export const ufSchema = z
  .string()
  .length(2, "UF deve ter 2 letras")
  .regex(/^[A-Z]{2}$/, "UF em maiúsculas (ex.: RN)")

export const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true, message: "Data/hora ISO 8601 inválida" })

export type Email = z.infer<typeof emailSchema>
export type CPF = z.infer<typeof cpfSchema>
export type CNPJ = z.infer<typeof cnpjSchema>
