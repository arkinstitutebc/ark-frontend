export function buildCrudListUrl<Q>(basePath: string, q: Q | undefined): string {
  if (!q || typeof q !== "object") return basePath
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(q as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}
