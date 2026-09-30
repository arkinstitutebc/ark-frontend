export const queryKeys = {
  stock: {
    all: ["stock"] as const,
    list: ["stock", "list"] as const,
    filtered: (filters?: { page?: number; limit?: number; search?: string }) =>
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
  monthly: {
    all: ["monthly-toolkeeping"] as const,
    detail: (id: string) => ["monthly-toolkeeping", id] as const,
  },
} as const
