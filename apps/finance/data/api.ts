const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...options,
      signal: controller.signal,
      headers: {
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
        ...options?.headers,
      },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `API error ${res.status}`)
    }
    return res.json()
  } finally {
    clearTimeout(timeoutId)
  }
}
