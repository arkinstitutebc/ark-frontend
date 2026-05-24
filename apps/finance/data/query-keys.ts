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
    detail: (id: string) => ["transfers", id] as const,
  },
  disbursements: {
    all: ["disbursements"] as const,
    detail: (id: string) => ["disbursements", id] as const,
  },
  pnl: {
    byMonth: (month: string) => ["pnl", month] as const,
  },
  incomeStatement: {
    range: (r: { from?: string; to?: string }) =>
      ["income-statement", r.from ?? "", r.to ?? ""] as const,
  },
  batches: {
    all: ["batches"] as const,
  },
  reimbursements: {
    all: ["reimbursements"] as const,
    byStatus: (status?: string) => ["reimbursements", { status }] as const,
    detail: (id: string) => ["reimbursements", id] as const,
  },
  assets: {
    all: ["assets"] as const,
    filtered: (filters?: { status?: string; category?: string; profitCenter?: string }) =>
      ["assets", filters] as const,
    detail: (id: string) => ["assets", id] as const,
  },
  glAccounts: {
    all: ["gl-accounts"] as const,
    filtered: (filters?: { includeInactive?: boolean }) => ["gl-accounts", filters] as const,
    detail: (id: string) => ["gl-accounts", id] as const,
  },
} as const
