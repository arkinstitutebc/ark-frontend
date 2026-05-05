export const queryKeys = {
  banks: {
    all: ["banks"] as const,
    detail: (id: string) => ["banks", id] as const,
    balance: (id: string) => ["banks", id, "balance"] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    filtered: (filters: { bankId?: string; batchId?: string; limit?: number }) =>
      ["transactions", filters] as const,
  },
  transfers: {
    all: ["transfers"] as const,
  },
  disbursements: {
    all: ["disbursements"] as const,
  },
  pnl: {
    byMonth: (month: string) => ["pnl", month] as const,
  },
  batches: {
    all: ["batches"] as const,
  },
} as const
