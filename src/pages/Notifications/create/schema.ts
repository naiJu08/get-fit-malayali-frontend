import { z } from 'zod'

export const formSchema = z.object({
  user_id: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
    .refine((v) => Number.isInteger(v) && v > 0, { message: 'Required.' }),
  plan_id: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
    .refine((v) => Number.isInteger(v) && v > 0, { message: 'Required.' }),
  start_date: z.union([
    z.string().min(1, { message: 'Required.' }),
    z.date({ invalid_type_error: 'Required.' }),
  ]),
  end_date: z.union([
    z.string().min(1, { message: 'Required.' }),
    z.date({ invalid_type_error: 'Required.' }),
  ]),
  status: z
    .union([
      z.number(),
      z.string(),
      z.object({ id: z.any(), name: z.string() }),
    ])
    .transform((v) => {
      const raw = typeof v === 'object' && v !== null ? ((v as any).id ?? v) : v
      const n = typeof raw === 'string' ? parseInt(raw, 10) : raw
      return n
    })
    .refine((v) => v === 0 || v === 1 || v === 2, {
      message: 'Invalid status',
    }),
  notes: z.string().min(1, { message: 'Required.' }),
})

export type AdminSchema = z.infer<typeof formSchema>
