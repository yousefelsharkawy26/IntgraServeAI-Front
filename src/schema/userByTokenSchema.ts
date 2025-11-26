import z from 'zod';

export const userByTokenRolesEnum = z.enum([
  'Admin',
  'Tech User',
  'Support User',
]);

const userByTokenSchema = z.object({
  id: z.string(),
  email: z.email(),
  email_confirmed: z.boolean(),
  full_name: z.string(),
  roles: z.array(userByTokenRolesEnum).min(1),
  is_active: z.boolean(),
  last_login: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export type userByTokenT = z.infer<typeof userByTokenSchema>;
export type userByTokenRolesEnumT = z.infer<typeof userByTokenRolesEnum>;
export { userByTokenSchema };
