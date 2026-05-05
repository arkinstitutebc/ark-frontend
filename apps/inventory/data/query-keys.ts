export const queryKeys = {
  stock: {
    all: ["stock"] as const,
    byBatch: (batchId?: string) => ["stock", { batchId }] as const,
    detail: (id: string) => ["stock", id] as const,
  },
  movements: {
    all: ["movements"] as const,
    byItem: (itemId?: string) => ["movements", { itemId }] as const,
  },
  orders: {
    all: ["orders"] as const,
  },
} as const
