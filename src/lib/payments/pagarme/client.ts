/**
 * Wrapper REST da Pagar.me v5. Usa Basic Auth com a SECRET_KEY.
 * Não usa SDK oficial pra evitar peso de dependência — fetch nativo basta.
 *
 * Docs: https://docs.pagar.me/v5/reference
 */

const BASE_URL = "https://api.pagar.me/core/v5"

export interface PagarmeError extends Error {
  status: number
  body: unknown
}

function getApiKey(): string {
  const key = process.env["PAGARME_API_KEY"]
  if (!key) {
    throw Object.assign(new Error("PAGARME_API_KEY não configurada"), {
      status: 500,
      body: null,
    }) as PagarmeError
  }
  return key
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${getApiKey()}:`).toString("base64")
}

const DEFAULT_TIMEOUT_MS = 15_000

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: ctrl.signal,
    })
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      const err = new Error(`Pagar.me ${method} ${path} timeout`) as PagarmeError
      err.status = 504
      err.body = null
      throw err
    }
    throw e
  } finally {
    clearTimeout(timer)
  }

  const text = await res.text()
  let parsed: unknown = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }

  if (!res.ok) {
    const err = new Error(
      `Pagar.me ${method} ${path} failed: ${res.status} ${res.statusText}`
    ) as PagarmeError
    err.status = res.status
    err.body = parsed
    throw err
  }

  return parsed as T
}

export const pagarme = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
}
