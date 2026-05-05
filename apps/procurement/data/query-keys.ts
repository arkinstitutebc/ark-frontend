export const queryKeys = {
  requests: {
    all: ["requests"] as const,
    byStatus: (status?: string) => ["requests", { status }] as const,
    detail: (id: string) => ["requests", id] as const,
  },
  orders: {
    all: ["orders"] as const,
    byStatus: (status?: string) => ["orders", { status }] as const,
    detail: (id: string) => ["orders", id] as const,
  },
  batches: {
    all: ["batches"] as const,
  },
} as const
