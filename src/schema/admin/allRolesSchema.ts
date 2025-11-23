import z from 'zod';

const allRolesSchema = z.object({
  name: z.string(),
  description: z.string(),
  id: z.string(),
  created_at: z.string().transform((val) => new Date(val)),
});

const allRolesResponseSchema = z.array(allRolesSchema);

export type allRolesT = z.infer<typeof allRolesSchema>;
export type allRolesResponseT = z.infer<typeof allRolesResponseSchema>;

export { allRolesSchema, allRolesResponseSchema };
