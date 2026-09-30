import { z } from "zod"

const budgetSchema = z
  .union([z.string(), z.number()])
  .refine(value => value !== "" && Number.isFinite(Number(value)), {
    message: "Budget must be a number",
  })
  .refine(value => Number(value) > 0, {
    message: "Budget must be greater than 0",
  })

export const createBatchSchema = z.object({
  trainingOfferingId: z.string().uuid("Qualification is required"),
  trainingSchemeId: z.string().uuid("Program scheme is required"),
  batchNo: z.string().max(50, "Batch no. is too long").optional().or(z.literal("")),
  rqm: z.string().max(50, "RQM is too long").optional().or(z.literal("")),
  senator: z.string().min(1, "Sponsor is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().or(z.literal("")),
  weeklySchedule: z.string().max(100, "Weekly schedule is too long").optional().or(z.literal("")),
  venue: z.string().min(1, "Venue is required"),
  instructor: z.string().min(1, "Instructor is required"),
  budget: budgetSchema,
})

export const updateBatchSchema = createBatchSchema.extend({
  trainingLevel: z.string().min(1, "Training level is required"),
  status: z.string().min(1, "Status is required"),
})

export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  batchId: z.string().min(1, "Batch is required"),
})

export const updateStudentSchema = createStudentSchema.extend({
  status: z.string().min(1, "Status is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  contactNumber: z.string().optional(),
})
