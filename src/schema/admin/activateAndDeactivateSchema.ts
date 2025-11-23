import z from 'zod';

const activateAndDeactivateRequestSchema = z.object({
  user_ids: z.array(z.string()),
});

const activateAndDeactivateResponseSchema = z.object({
  message: z.string(),
  total_requested: z.number(),
  successful: z.number(),
  failed: z.number(),
  errors: z
    .array(
      z
        .object({
          user_id: z.string(),
          error: z.string(),
        })
        .nullable(),
    )
    .nullable(),
});

export type activateAndDeactivateRequestT = z.infer<
  typeof activateAndDeactivateRequestSchema
>;

export type activateAndDeactivateResponseT = z.infer<
  typeof activateAndDeactivateResponseSchema
>;

export {
  activateAndDeactivateRequestSchema,
  activateAndDeactivateResponseSchema,
};
