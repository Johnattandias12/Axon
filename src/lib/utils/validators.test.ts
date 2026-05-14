import { describe, it, expect } from "vitest"
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ } from "./validators"

describe("validateCPF", () => {
  it("aceita CPF válido", () => {
    expect(validateCPF("529.982.247-25")).toBe(true)
    expect(validateCPF("52998224725")).toBe(true)
  })

  it("rejeita CPF com dígitos repetidos", () => {
    expect(validateCPF("111.111.111-11")).toBe(false)
    expect(validateCPF("00000000000")).toBe(false)
  })

  it("rejeita CPF com dígito verificador errado", () => {
    expect(validateCPF("529.982.247-26")).toBe(false)
  })

  it("rejeita CPF com tamanho errado", () => {
    expect(validateCPF("123")).toBe(false)
    expect(validateCPF("")).toBe(false)
  })
})

describe("validateCNPJ", () => {
  it("aceita CNPJ válido", () => {
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true)
    expect(validateCNPJ("11222333000181")).toBe(true)
  })

  it("rejeita CNPJ com dígitos repetidos", () => {
    expect(validateCNPJ("11.111.111/1111-11")).toBe(false)
    expect(validateCNPJ("00000000000000")).toBe(false)
  })

  it("rejeita CNPJ com tamanho errado", () => {
    expect(validateCNPJ("1234")).toBe(false)
  })
})

describe("formatCPF", () => {
  it("formata corretamente", () => {
    expect(formatCPF("52998224725")).toBe("529.982.247-25")
  })

  it("trunca após 11 dígitos", () => {
    expect(formatCPF("529982247251111")).toBe("529.982.247-25")
  })
})

describe("formatCNPJ", () => {
  it("formata corretamente", () => {
    expect(formatCNPJ("11222333000181")).toBe("11.222.333/0001-81")
  })
})
