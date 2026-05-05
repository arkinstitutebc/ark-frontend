export const queryKeys = {
  trainers: {
    all: ["trainers"] as const,
    byStatus: (status?: string) => ["trainers", { status }] as const,
    detail: (id: string) => ["trainers", id] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    filtered: (filters: { trainerId?: string; date?: string }) => ["attendance", filters] as const,
  },
  payroll: {
    all: ["payroll"] as const,
    detail: (id: string) => ["payroll", id] as const,
  },
} as const
