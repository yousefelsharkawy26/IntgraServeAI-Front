import z from 'zod';

const roleUserItemSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string(),
  is_active: z.boolean(),
  roles: z.array(z.string()),
  last_login: z.string().nullable(),
  created_at: z.string(),
});

const roleUsersResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  users: z.array(roleUserItemSchema),
});

export type RoleUserItemT = z.infer<typeof roleUserItemSchema>;
export type RoleUsersResponseT = z.infer<typeof roleUsersResponseSchema>;
export { roleUsersResponseSchema };
