export const queryKeys = {
  batches: {
    all: ["batches"] as const,
    filtered: (filters?: { status?: string }) => ["batches", filters] as const,
    detail: (id: string) => ["batches", id] as const,
    students: (batchId: string) => ["batches", batchId, "students"] as const,
  },
  students: {
    all: ["students"] as const,
    filtered: (filters?: { batchId?: string; page?: number; limit?: number; search?: string }) =>
      ["students", filters] as const,
    detail: (id: string) => ["students", id] as const,
  },
  instructors: {
    all: ["training", "instructors"] as const,
  },
  venues: {
    all: ["training-venues"] as const,
    detail: (id: string) => ["training-venues", id] as const,
  },
} as const
