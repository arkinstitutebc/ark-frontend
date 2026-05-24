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
  receipts: {
    byPoCode: (poCode: string) => ["receipts", poCode] as const,
  },
  categories: {
    all: ["procurement-categories"] as const,
    detail: (id: string) => ["procurement-categories", id] as const,
  },
} as const
