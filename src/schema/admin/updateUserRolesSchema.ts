import z from 'zod';

const updateUserRolesRequestSchema = z.object({
  roles_id: z.array(z.string()),
});

const updateUserRolesResponseSchema = z.object({
  message: z.string(),
});

export type updateUserRolesRequestT = z.infer<
  typeof updateUserRolesRequestSchema
>;
export type updateUserRolesResponseT = z.infer<
  typeof updateUserRolesResponseSchema
>;

export { updateUserRolesRequestSchema, updateUserRolesResponseSchema };
