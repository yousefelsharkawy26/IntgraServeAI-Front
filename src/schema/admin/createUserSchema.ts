import z from 'zod';

const createUserRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  full_name: z.string(),
  roles_id: z.array(z.string()),
});

const createUserResponseSchema = z.object({
  message: z.string(),
});

export type createUserRequestT = z.infer<typeof createUserRequestSchema>;
export type createUserResponseT = z.infer<typeof createUserResponseSchema>;

export { createUserRequestSchema, createUserResponseSchema };
