import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const basePassword = z
  .string()
  .min(8)
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')

export const seekerRegisterSchema = z.object({
  audience: z.literal('job_seeker').default('job_seeker'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: basePassword,
})

export const employerRegisterSchema = z.object({
  audience: z.literal('employer'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: basePassword,
  companyName: z.string().min(2).max(120),
  companySize: z.enum(['size_1_10', 'size_11_50', 'size_51_200', 'size_201_500', 'size_500_plus']).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  plan: z.enum(['single', 'monthly', 'bulk']).default('single'),
})

export const registerSchema = z.discriminatedUnion('audience', [
  seekerRegisterSchema,
  employerRegisterSchema,
])

export const magicLinkSchema = z.object({
  email: z.string().email(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
