export const queryKeys = {
  stock: {
    all: ["stock"] as const,
    byBatch: (batchId?: string) => ["stock", { batchId }] as const,
    filtered: (filters?: { batchId?: string; page?: number; limit?: number; search?: string }) =>
      ["stock", filters] as const,
    detail: (id: string) => ["stock", id] as const,
  },
  movements: {
    all: ["movements"] as const,
    byItem: (itemId?: string) => ["movements", { itemId }] as const,
    filtered: (filters?: {
      itemId?: string
      reference?: string
      type?: string
      page?: number
      limit?: number
      search?: string
    }) => ["movements", filters] as const,
  },
  orders: {
    all: ["orders"] as const,
  },
} as const
