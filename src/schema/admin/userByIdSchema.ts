import z from 'zod';
import { userByTokenRolesEnum } from '../userByTokenSchema';

const userByIdSchema = z.object({
  id: z.string(),
  email: z.email(),
  email_confirmed: z.boolean(),
  full_name: z.string(),
  roles: z.array(userByTokenRolesEnum).min(1),

  is_active: z.boolean(),

  last_login: z
    .string()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),

  created_at: z.string().transform((v) => new Date(v)),

  updated_at: z.string().transform((v) => new Date(v)),
});

export type userByIdT = z.infer<typeof userByIdSchema>;

export { userByIdSchema };
