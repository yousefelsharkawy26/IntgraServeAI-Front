import z from 'zod';

const roleStatItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  user_count: z.number(),
  active_users: z.number().optional().default(0),
  inactive_users: z.number().optional().default(0),
});

const roleStatisticsSchema = z.object({
  total_roles: z.number(),
  roles: z.array(roleStatItemSchema),
});

export type RoleStatItemT = z.infer<typeof roleStatItemSchema>;
export type RoleStatisticsT = z.infer<typeof roleStatisticsSchema>;
export { roleStatisticsSchema };

