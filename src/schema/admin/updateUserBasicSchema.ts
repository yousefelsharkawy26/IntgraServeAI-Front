import z from 'zod';

const updateUserBasicRequestSchema = z.object({
  email: z.email(),
  full_name: z.string().min(3, 'Name must be at least 3 characters'),
});

const updateUserBasicResponseSchema = z.object({
  message: z.string(),
});

export type updateUserBasicRequestT = z.infer<
  typeof updateUserBasicRequestSchema
>;
export type updateUserBasicResponseT = z.infer<
  typeof updateUserBasicResponseSchema
>;

export { updateUserBasicRequestSchema, updateUserBasicResponseSchema };
