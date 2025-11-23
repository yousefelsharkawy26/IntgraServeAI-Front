import z from 'zod';

const updateUserPasswordRequestSchema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateUserPasswordResponseSchema = z.object({
  message: z.string(),
});

export type updateUserPasswordRequestT = z.infer<
  typeof updateUserPasswordRequestSchema
>;

export type updateUserPasswordResponseT = z.infer<
  typeof updateUserPasswordResponseSchema
>;

export { updateUserPasswordRequestSchema, updateUserPasswordResponseSchema };
