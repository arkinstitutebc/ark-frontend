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
  employeeAttendance: {
    all: ["employee-attendance"] as const,
    filtered: (filters: { employeeId?: string; startDate?: string; endDate?: string }) =>
      ["employee-attendance", filters] as const,
  },
  payroll: {
    all: ["payroll"] as const,
    detail: (id: string) => ["payroll", id] as const,
  },
  employees: { all: ["employees"] as const },
  trainerAssignments: {
    all: ["trainer-assignments"] as const,
    byTrainer: (id?: string) => ["trainer-assignments", { trainerId: id }] as const,
  },
  cashAdvances: { all: ["cash-advances"] as const },
  calendar: {
    all: ["hr-calendar"] as const,
    month: (month: string) => ["hr-calendar", { month }] as const,
  },
} as const
