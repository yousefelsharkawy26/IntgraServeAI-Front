import z from 'zod';

const userActivitySchema = z.object({
  id: z.string(),
  email: z.email(),
  full_name: z.string(),
  last_login: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  is_active: z.boolean(),
  days_since_login: z.number().nullable(),
});

const userActivitySuccessResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  users: z.array(userActivitySchema),
});

const userActivityErrorResponseSchema = z.object({
  detail: z.string(),
});

const userActivityResponseSchema = z.union([
  userActivitySuccessResponseSchema,
  userActivityErrorResponseSchema,
]);

export type userActivityT = z.infer<typeof userActivitySchema>;
export type userActivityResponseT = z.infer<typeof userActivityResponseSchema>;
export type userActivitySuccessResponseT = z.infer<
  typeof userActivitySuccessResponseSchema
>;
export type userActivityErrorResponseT = z.infer<
  typeof userActivityErrorResponseSchema
>;

export {
  userActivitySchema,
  userActivityResponseSchema,
  userActivitySuccessResponseSchema,
  userActivityErrorResponseSchema,
};
