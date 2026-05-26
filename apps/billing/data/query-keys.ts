export const queryKeys = {
  receivables: {
    all: ["receivables"] as const,
    filtered: (filters?: { status?: string; page?: number; limit?: number; search?: string }) =>
      ["receivables", filters] as const,
    byStatus: (status?: string) => ["receivables", { status }] as const,
    detail: (id: string) => ["receivables", id] as const,
  },
  batches: {
    all: ["batches"] as const,
  },
} as const
