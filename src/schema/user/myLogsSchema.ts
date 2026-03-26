import z from 'zod';

const myLogItemSchema = z.object({
  id: z.string(),
  user_name: z.string(),
  action_type: z.string(),
  target_table: z.string(),
  target_record_id: z.string(),
  changed_values: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
});

const myLogsResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  logs: z.array(myLogItemSchema),
});

export type MyLogItemT = z.infer<typeof myLogItemSchema>;
export type MyLogsResponseT = z.infer<typeof myLogsResponseSchema>;
export { myLogsResponseSchema };
