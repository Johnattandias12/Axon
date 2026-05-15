import { z } from "zod"
import { emailSchema, fullNameSchema } from "./common"

export const passwordSchema = z
  .string()
  .min(6, "Mínimo 6 caracteres")
  .max(72, "Máximo 72 caracteres")

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const signupSchema = loginSchema.extend({
  full_name: fullNameSchema,
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
