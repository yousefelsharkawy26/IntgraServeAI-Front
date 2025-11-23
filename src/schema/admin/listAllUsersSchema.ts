import z from 'zod';

const listAllUsersSchema = z.object({
  id: z.string(),
  email: z.email(),
  email_confirmed: z.boolean(),
  full_name: z.string(),
  roles: z.array(z.string()),
  is_active: z.boolean(),
  last_login: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

const listAllUsersSuccessResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  users: z.array(listAllUsersSchema),
});

const listAllUsersErrorResponseSchema = z.object({
  detail: z.string(),
});

const listAllUsersResponseSchema = z.union([
  listAllUsersSuccessResponseSchema,
  listAllUsersErrorResponseSchema,
]);

export type listAllUsersT = z.infer<typeof listAllUsersSchema>;
export type listAllUsersResponseT = z.infer<typeof listAllUsersResponseSchema>;
export type listAllUsersSuccessResponseT = z.infer<
  typeof listAllUsersSuccessResponseSchema
>;
export type listAllUsersErrorResponseT = z.infer<
  typeof listAllUsersErrorResponseSchema
>;

export {
  listAllUsersSchema,
  listAllUsersResponseSchema,
  listAllUsersSuccessResponseSchema,
  listAllUsersErrorResponseSchema,
};
