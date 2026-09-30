export const queryKeys = {
  requests: {
    all: ["requests"] as const,
    filtered: (filters?: {
      status?: string
      batchId?: string
      page?: number
      limit?: number
      search?: string
    }) => ["requests", filters] as const,
    byStatus: (status?: string) => ["requests", { status }] as const,
    detail: (id: string) => ["requests", id] as const,
  },
  orders: {
    all: ["orders"] as const,
    allList: ["orders", "all"] as const,
    byStatus: (status?: string) => ["orders", { status }] as const,
    filtered: (filters?: { status?: string; page?: number; limit?: number; search?: string }) =>
      ["orders", filters] as const,
    detail: (id: string) => ["orders", id] as const,
  },
  expenseItems: {
    all: ["procurement-expense-items"] as const,
    filtered: (includeInactive: boolean) =>
      ["procurement-expense-items", { includeInactive }] as const,
  },
  liquidations: {
    all: ["po-liquidations"] as const,
  },
  batches: {
    all: ["batches"] as const,
    budgetSummary: (id: string) => ["batches", id, "budget-summary"] as const,
  },
  receipts: {
    byPoCode: (poCode: string) => ["receipts", poCode] as const,
  },
  categories: {
    all: ["procurement-categories"] as const,
    detail: (id: string) => ["procurement-categories", id] as const,
  },
  pettyCash: {
    all: ["cash-voucher"] as const,
    filtered: (filters?: { status?: string; page?: number; limit?: number; search?: string }) =>
      ["cash-voucher", filters] as const,
    detail: (id: string) => ["cash-voucher", id] as const,
    summary: ["cash-voucher", "summary"] as const,
  },
} as const
