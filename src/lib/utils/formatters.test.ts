import { describe, it, expect } from "vitest"
import { centsToBRL, brlToCents, slugify, generateUniqueSlug } from "./formatters"

describe("centsToBRL", () => {
  it("converte corretamente", () => {
    expect(centsToBRL(5000)).toBe("R$ 50,00")
    expect(centsToBRL(0)).toBe("R$ 0,00")
    expect(centsToBRL(100)).toBe("R$ 1,00")
  })
})

describe("brlToCents", () => {
  it("converte string de preço para centavos", () => {
    expect(brlToCents("50,00")).toBe(5000)
    expect(brlToCents("1,00")).toBe(100)
    expect(brlToCents("R$ 150,00")).toBe(15000)
  })
})

describe("slugify", () => {
  it("normaliza texto para slug", () => {
    expect(slugify("Carnaxelita 2025 · Currais Novos")).toBe("carnaxelita-2025-currais-novos")
    expect(slugify("Show de Verão — Natal/RN")).toBe("show-de-verao-natal-rn")
    expect(slugify("Forró & Gospel")).toBe("forro-gospel")
  })

  it("remove acentos", () => {
    expect(slugify("Ação")).toBe("acao")
    expect(slugify("ção")).toBe("cao")
  })
})

describe("generateUniqueSlug", () => {
  it("gera slug com base no título", () => {
    const slug = generateUniqueSlug("Meu Evento Legal")
    expect(slug).toMatch(/^meu-evento-legal-/)
  })

  it("usa sufixo quando fornecido", () => {
    const slug = generateUniqueSlug("Meu Evento", "abc123")
    expect(slug).toBe("meu-evento-abc123")
  })
})
