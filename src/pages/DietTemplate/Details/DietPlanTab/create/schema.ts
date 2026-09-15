import { z } from 'zod'

const toNumberOrZero = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return 0
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const mealItemSchema = z
  .object({
    meal_id: z
      .union([z.number(), z.string()])
      .transform((v) => toNumberOrZero(v)),
    count: z
      .union([z.number(), z.string()])
      .transform((v) => toNumberOrZero(v)),
    requirement: z.enum(['Optional', 'Mandatory']).default('Optional'),
    protein: z
      .union([z.number(), z.string()])
      .transform((v) =>
        v === '' || v === null || v === undefined ? '' : Number(v)
      )
      .optional()
      .or(z.literal('')),
    carbs: z
      .union([z.number(), z.string()])
      .transform((v) =>
        v === '' || v === null || v === undefined ? '' : Number(v)
      )
      .optional()
      .or(z.literal('')),
    fat: z
      .union([z.number(), z.string()])
      .transform((v) =>
        v === '' || v === null || v === undefined ? '' : Number(v)
      )
      .optional()
      .or(z.literal('')),
    fiber: z
      .union([z.number(), z.string()])
      .transform((v) =>
        v === '' || v === null || v === undefined ? '' : Number(v)
      )
      .optional()
      .or(z.literal('')),
    total_calories: z
      .union([z.number(), z.string()])
      .transform((v) =>
        v === '' || v === null || v === undefined ? '' : Number(v)
      )
      .optional()
      .or(z.literal('')),
  })
  .superRefine((val, ctx) => {
    const hasMeal = Number.isFinite(val.meal_id) && val.meal_id > 0
    const hasCount = Number.isFinite(val.count) && val.count > 0

    // If meal is selected but count is missing/invalid
    if (hasMeal && !hasCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Intake quantity must be at least 1',
        path: ['count'],
      })
    }

    // If count is provided but meal is missing
    if (!hasMeal && hasCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Meal name is required',
        path: ['meal_id'],
      })
    }
  })

export const dietPlanFormSchema = z.object({
  diet_plan_template_id: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v)),
  day_number: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 1, 'Day number must be >= 1'),
  day_name: z.string().min(1, 'Day name is required'),
  sequence_number: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v)),
  // .refine(
  //   (v) => Number.isFinite(v) && v >= 1,
  //   'Sequence number must be >= 1'
  // ),
  meal_time: z.string().min(1, 'Meal time is required'),
  meal_time_time: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  protein: z
    .union([z.number(), z.string()])
    .transform((v) =>
      v === '' || v === null || v === undefined ? '' : Number(v)
    )
    .optional()
    .or(z.literal('')),
  carbs: z
    .union([z.number(), z.string()])
    .transform((v) =>
      v === '' || v === null || v === undefined ? '' : Number(v)
    )
    .optional()
    .or(z.literal('')),
  fat: z
    .union([z.number(), z.string()])
    .transform((v) =>
      v === '' || v === null || v === undefined ? '' : Number(v)
    )
    .optional()
    .or(z.literal('')),
  fiber: z
    .union([z.number(), z.string()])
    .transform((v) =>
      v === '' || v === null || v === undefined ? '' : Number(v)
    )
    .optional()
    .or(z.literal('')),
  total_calories: z
    .union([z.number(), z.string()])
    .transform((v) =>
      v === '' || v === null || v === undefined ? '' : Number(v)
    )
    .optional()
    .or(z.literal('')),
  calories: z
    .union([z.number(), z.string()])
    .transform((v) =>
      v === '' || v === null || v === undefined ? '' : Number(v)
    )
    .optional()
    .or(z.literal('')),
  meals: z.array(mealItemSchema).optional().default([]),
})

export type DietPlanSchema = z.infer<typeof dietPlanFormSchema>
