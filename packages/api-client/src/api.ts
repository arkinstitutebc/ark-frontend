const API_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "http://localhost:4000"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly details: Record<string, string[]> = {}
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  if (!res.ok) {
    const payload: unknown = await res.json().catch(() => ({}))
    const body = (
      payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {}
    ) as {
      error?: unknown
      details?: unknown
    }
    const details: Record<string, string[]> = {}
    if (body.details && typeof body.details === "object" && !Array.isArray(body.details)) {
      for (const [field, messages] of Object.entries(body.details)) {
        if (Array.isArray(messages)) {
          const validMessages = messages.filter(
            (message): message is string => typeof message === "string"
          )
          if (validMessages.length > 0) details[field] = validMessages
        }
      }
    }
    const baseMessage = typeof body.error === "string" ? body.error : `API error ${res.status}`
    const firstDetail = Object.values(details)[0]?.[0]
    throw new ApiError(
      baseMessage === "Validation failed" && firstDetail
        ? `${baseMessage}: ${firstDetail}`
        : baseMessage,
      details
    )
  }
  // 204 No Content (or any empty body) → return undefined; callers using
  // api<void>() get a valid resolution without a JSON.parse crash.
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export { API_URL }
