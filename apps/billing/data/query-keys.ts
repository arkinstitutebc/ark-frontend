export const queryKeys = {
  receivables: {
    all: ["receivables"] as const,
    byStatus: (status?: string) => ["receivables", { status }] as const,
    detail: (id: string) => ["receivables", id] as const,
  },
  batches: {
    all: ["batches"] as const,
  },
} as const
