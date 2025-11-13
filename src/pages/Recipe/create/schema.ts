import { z } from 'zod'

export const recipeFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  calories: z
    .preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number())
    .refine((v) => !Number.isNaN(v), 'Invalid number'),
  portion_size: z.string().min(1, 'Required'),
  image: z
    .union([
      // When editing, this may be a pre-existing URL string
      z.string().url('Invalid URL'),
      // When uploading, this will be a File
      z.instanceof(File),
      // Or left empty
      z.literal(''),
    ])
    .optional(),
})

export type RecipeSchema = z.infer<typeof recipeFormSchema>
