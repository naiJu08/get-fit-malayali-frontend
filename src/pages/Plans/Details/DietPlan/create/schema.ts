import { z } from 'zod'

export const dietPlanFormSchema = z.object({
  plan_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  day_number: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 1, 'Day number must be >= 1'),
  sequence_number: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .refine(
      (v) => Number.isFinite(v) && v >= 1,
      'Sequence number must be >= 1'
    ),
  meal_time: z.string().min(1, 'Meal time is required'),
  meal_name: z.string().optional().or(z.literal('')),
  calories: z
    .union([z.number(), z.string()])
    .transform((v) =>
      v === '' || v === null || v === undefined ? '' : Number(v)
    )
    .optional()
    .or(z.literal('')),
})

export type DietPlanSchema = z.infer<typeof dietPlanFormSchema>
