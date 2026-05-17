import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { generateQrPayload, verifyQrPayload } from "./hmac"

describe("generateQrPayload", () => {
  beforeEach(() => {
    vi.stubEnv("QR_HMAC_SECRET", "test_secret_at_least_16_chars_long")
    vi.stubEnv("NODE_ENV", "test")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("gera payload no formato AXN1.<32hex>.<16hex>", () => {
    const payload = generateQrPayload(
      "11111111-2222-3333-4444-555555555555",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    )
    expect(payload).toMatch(/^AXN1\.[a-f0-9]{32}\.[a-f0-9]{16}$/)
  })

  it("é determinístico com mesmo input", () => {
    const a = generateQrPayload(
      "11111111-2222-3333-4444-555555555555",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    )
    const b = generateQrPayload(
      "11111111-2222-3333-4444-555555555555",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    )
    expect(a).toBe(b)
  })

  it("muda quando o ticketId muda", () => {
    const a = generateQrPayload(
      "11111111-2222-3333-4444-555555555555",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    )
    const b = generateQrPayload(
      "22222222-2222-3333-4444-555555555555",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    )
    expect(a).not.toBe(b)
  })

  it("muda quando o eventId muda", () => {
    const a = generateQrPayload(
      "11111111-2222-3333-4444-555555555555",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    )
    const b = generateQrPayload(
      "11111111-2222-3333-4444-555555555555",
      "ffffffff-bbbb-cccc-dddd-eeeeeeeeeeee"
    )
    expect(a).not.toBe(b)
  })

  it("lança erro em production sem QR_HMAC_SECRET", () => {
    vi.stubEnv("QR_HMAC_SECRET", "")
    vi.stubEnv("NODE_ENV", "production")
    expect(() =>
      generateQrPayload(
        "11111111-2222-3333-4444-555555555555",
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
      )
    ).toThrow(/QR_HMAC_SECRET/)
  })

  it("lança erro em production se QR_HMAC_SECRET for curto", () => {
    vi.stubEnv("QR_HMAC_SECRET", "short")
    vi.stubEnv("NODE_ENV", "production")
    expect(() =>
      generateQrPayload(
        "11111111-2222-3333-4444-555555555555",
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
      )
    ).toThrow(/QR_HMAC_SECRET/)
  })

  it("usa fallback em dev/test", () => {
    vi.stubEnv("QR_HMAC_SECRET", "")
    vi.stubEnv("NODE_ENV", "development")
    const payload = generateQrPayload(
      "11111111-2222-3333-4444-555555555555",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    )
    expect(payload).toMatch(/^AXN1\.[a-f0-9]{32}\.[a-f0-9]{16}$/)
  })
})

describe("verifyQrPayload", () => {
  beforeEach(() => {
    vi.stubEnv("QR_HMAC_SECRET", "test_secret_at_least_16_chars_long")
    vi.stubEnv("NODE_ENV", "test")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("confirma um payload válido", () => {
    const ticketId = "11111111-2222-3333-4444-555555555555"
    const eventId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    const payload = generateQrPayload(ticketId, eventId)
    expect(verifyQrPayload(payload, ticketId, eventId)).toBe(true)
  })

  it("rejeita payload de outro ticket", () => {
    const eventId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    const payloadA = generateQrPayload("11111111-2222-3333-4444-555555555555", eventId)
    expect(verifyQrPayload(payloadA, "22222222-2222-3333-4444-555555555555", eventId)).toBe(false)
  })

  it("rejeita payload de outro evento", () => {
    const ticketId = "11111111-2222-3333-4444-555555555555"
    const payloadA = generateQrPayload(ticketId, "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
    expect(verifyQrPayload(payloadA, ticketId, "ffffffff-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(false)
  })

  it("rejeita payload truncado", () => {
    const ticketId = "11111111-2222-3333-4444-555555555555"
    const eventId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    const payload = generateQrPayload(ticketId, eventId).slice(0, -2)
    expect(verifyQrPayload(payload, ticketId, eventId)).toBe(false)
  })

  it("rejeita payload completamente inválido", () => {
    expect(
      verifyQrPayload(
        "lixo",
        "11111111-2222-3333-4444-555555555555",
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
      )
    ).toBe(false)
  })
})
