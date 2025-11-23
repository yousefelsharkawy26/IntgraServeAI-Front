import z from 'zod';

const userByTokenSchema = z.object({
  id: z.string(),
  email: z.email(),
  email_confirmed: z.boolean(),
  full_name: z.string(),
  roles: z.array(z.string()),
  is_active: z.boolean(),
  last_login: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export type userByTokenT = z.infer<typeof userByTokenSchema>;
export { userByTokenSchema };
