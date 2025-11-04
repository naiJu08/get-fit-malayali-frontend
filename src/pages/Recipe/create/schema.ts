import { z } from 'zod'

export const recipeFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  calories: z
    .preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number())
    .refine((v) => !Number.isNaN(v), 'Invalid number'),
  portion_size: z.string().min(1, 'Required'),
  image_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type RecipeSchema = z.infer<typeof recipeFormSchema>
