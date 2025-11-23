import z from 'zod';

const usersByRoleSchema = z.record(z.string(), z.number());

const usersStatisticsSchema = z.object({
  total_users: z.number(),
  active_users: z.number(),
  inactive_users: z.number(),
  confirmed_emails: z.number(),
  unconfirmed_emails: z.number(),
  users_by_role: usersByRoleSchema,
  recent_registrations: z.number(),
  recent_logins: z.number(),
});

export type usersStatisticsT = z.infer<typeof usersStatisticsSchema>;

export { usersStatisticsSchema };
