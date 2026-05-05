import { z } from "zod"

/**
 * User Roles
 */
export const userRoleSchema = z.enum(["admin", "director", "trainer"])

/**
 * User Profile
 * Represents PK: USER#<user_id>, SK: PROFILE
 */
export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: userRoleSchema,
  createdAt: z
    .string()
    .or(z.date())
    .transform(v => new Date(v)),
  updatedAt: z
    .string()
    .or(z.date())
    .transform(v => new Date(v))
    .optional(),
})

/**
 * Login Request
 */
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

/**
 * Login Response
 */
export const loginResponseSchema = z.object({
  token: z.string(),
  user: userProfileSchema,
  expiresAt: z
    .string()
    .or(z.date())
    .transform(v => new Date(v)),
})

/**
 * Auth Context User
 */
export const authUserSchema = userProfileSchema.extend({
  token: z.string().optional(),
})

// Types
export type UserRole = z.infer<typeof userRoleSchema>
export type UserProfile = z.infer<typeof userProfileSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type AuthUser = z.infer<typeof authUserSchema>
