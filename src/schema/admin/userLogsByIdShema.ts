import z from 'zod';

const userLogItemSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  action_type: z.string(),
  target_table: z.string(),
  target_record_id: z.string(),
  changed_values: z.record(z.string(), z.any()), 
  created_at: z.iso.datetime(),
});

export interface GetUserLogsRequestT {
  userId: string;
  page: number;
  limit: number;
}

const userLogsResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  logs: z.array(userLogItemSchema),
});

export type userLogItemT = z.infer<typeof userLogItemSchema>;
export type userLogsResponseT = z.infer<typeof userLogsResponseSchema>;

export {
  userLogItemSchema,
  userLogsResponseSchema,
};