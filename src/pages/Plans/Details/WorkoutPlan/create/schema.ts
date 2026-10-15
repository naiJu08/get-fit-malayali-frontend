import { z } from 'zod'

export const workoutPlanFormSchema = z.object({
  plan_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  day_number: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 1, 'Day number must be >= 1'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  video: z.any().optional(),
})

export type WorkoutPlanSchema = z.infer<typeof workoutPlanFormSchema>
