import { z } from "zod"

export const createBatchSchema = z.object({
  trainingName: z.string().min(1, "Training type is required"),
  senator: z.string().min(1, "Sponsor is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().or(z.literal("")),
  venue: z.string().min(1, "Venue is required"),
  instructor: z.string().min(1, "Instructor is required"),
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
